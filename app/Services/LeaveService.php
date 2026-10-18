<?php

namespace App\Services;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = LeaveRequest::query()
            ->where('reference', 'like', "LV-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('LV-%s-%04d', $year, $sequence);
    }

    public function canRequest(User $user): bool
    {
        return $user->can('leave.request')
            || $user->hasAnyRole([
                'administrator',
                'management',
                'sales',
                'operations',
                'warehouse',
                'finance',
                'customer_care',
                'marketing',
            ]);
    }

    public function canViewAll(User $user): bool
    {
        return $user->can('leave.view_all') || $user->can('leave.approve') || $user->can('leave.manage');
    }

    public function scopedQuery(User $user): Builder
    {
        $query = LeaveRequest::query();

        if ($this->canViewAll($user)) {
            return $query;
        }

        return $query->where('user_id', $user->id);
    }

    /**
     * Count working days (Mon–Fri). Half-day returns 0.5.
     */
    public function calculateDays(string $startDate, string $endDate, bool $isHalfDay = false): float
    {
        if ($isHalfDay) {
            return 0.5;
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'end_date' => 'End date must be on or after the start date.',
            ]);
        }

        $days = 0;
        foreach (CarbonPeriod::create($start, $end) as $date) {
            if (! $date->isWeekend()) {
                $days++;
            }
        }

        if ($days < 1) {
            throw ValidationException::withMessages([
                'start_date' => 'Selected dates fall on a weekend. Choose a working day or a date range with working days.',
            ]);
        }

        return (float) $days;
    }

    public function ensureBalance(User $user, LeaveType $type, ?int $year = null): LeaveBalance
    {
        $year ??= (int) now()->format('Y');

        return LeaveBalance::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'leave_type_id' => $type->id,
                'year' => $year,
            ],
            [
                'entitled' => $type->days_per_year,
                'taken' => 0,
                'carried_over' => 0,
            ],
        );
    }

    /**
     * @return Collection<int, array{leave_type_id: int, name: string, code: string, entitled: float, taken: float, carried_over: float, remaining: float}>
     */
    public function balancesFor(User $user, ?int $year = null): Collection
    {
        $year ??= (int) now()->format('Y');

        $types = LeaveType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();

        return $types->map(function (LeaveType $type) use ($user, $year) {
            $balance = $this->ensureBalance($user, $type, $year);

            return [
                'leave_type_id' => $type->id,
                'name' => $type->name,
                'code' => $type->code,
                'entitled' => (float) $balance->entitled,
                'taken' => (float) $balance->taken,
                'carried_over' => (float) $balance->carried_over,
                'remaining' => $balance->remaining(),
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): LeaveRequest
    {
        return DB::transaction(function () use ($user, $data) {
            $type = LeaveType::query()->where('is_active', true)->findOrFail($data['leave_type_id']);
            $isHalfDay = (bool) ($data['is_half_day'] ?? false);
            $days = $this->calculateDays($data['start_date'], $data['end_date'], $isHalfDay);

            if ($isHalfDay && $data['start_date'] !== $data['end_date']) {
                throw ValidationException::withMessages([
                    'is_half_day' => 'Half-day leave must start and end on the same date.',
                ]);
            }

            $this->assertNoOverlap($user->id, $data['start_date'], $data['end_date']);
            $this->assertSufficientBalance($user, $type, $days, null);

            $request = LeaveRequest::query()->create([
                'reference' => $this->nextReference(),
                'user_id' => $user->id,
                'leave_type_id' => $type->id,
                'department_id' => $user->department_id,
                'branch_id' => $user->branch_id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'days' => $days,
                'is_half_day' => $isHalfDay,
                'half_day_period' => $isHalfDay ? ($data['half_day_period'] ?? 'morning') : null,
                'reason' => $data['reason'] ?? null,
                'status' => 'pending',
            ]);

            $this->activityLog->log('leave.created', "Submitted leave request {$request->reference}", $request);

            $fresh = $request->fresh(['leaveType', 'requester']);
            $link = url(route('leave.show', $fresh, false));

            app(AppNotificationService::class)->notifyMany(
                app(AppNotificationService::class)->usersWithPermission('leave.approve'),
                'leave.approval',
                "Leave request needs approval: {$fresh->reference}",
                "{$user->name} requested {$fresh->days} day(s) of {$fresh->leaveType?->name} ({$fresh->start_date->toDateString()} – {$fresh->end_date->toDateString()}).",
                $link,
                "leave-approval-{$fresh->id}",
                ['leave_request_id' => $fresh->id],
                true,
                $user->id,
            );

            return $fresh;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(LeaveRequest $request, array $data): LeaveRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Only pending leave requests can be edited.',
            ]);
        }

        return DB::transaction(function () use ($request, $data) {
            $request->loadMissing('requester');
            $type = LeaveType::query()->where('is_active', true)->findOrFail($data['leave_type_id']);
            $isHalfDay = (bool) ($data['is_half_day'] ?? false);
            $days = $this->calculateDays($data['start_date'], $data['end_date'], $isHalfDay);

            if ($isHalfDay && $data['start_date'] !== $data['end_date']) {
                throw ValidationException::withMessages([
                    'is_half_day' => 'Half-day leave must start and end on the same date.',
                ]);
            }

            $this->assertNoOverlap($request->user_id, $data['start_date'], $data['end_date'], $request->id);
            $this->assertSufficientBalance(
                $request->requester ?? User::query()->findOrFail($request->user_id),
                $type,
                $days,
                $request->id,
            );

            $request->update([
                'leave_type_id' => $type->id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'days' => $days,
                'is_half_day' => $isHalfDay,
                'half_day_period' => $isHalfDay ? ($data['half_day_period'] ?? 'morning') : null,
                'reason' => $data['reason'] ?? null,
            ]);

            $this->activityLog->log('leave.updated', "Updated leave request {$request->reference}", $request);

            return $request->fresh(['leaveType', 'requester']);
        });
    }

    public function approve(LeaveRequest $request, User $approver): LeaveRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Only pending leave requests can be approved.',
            ]);
        }

        return DB::transaction(function () use ($request, $approver) {
            $request->loadMissing(['leaveType', 'requester']);
            $balance = $this->ensureBalance($request->requester, $request->leaveType, (int) $request->start_date->format('Y'));
            if ((float) $request->days > $balance->remaining() + 0.001) {
                throw ValidationException::withMessages([
                    'status' => "Insufficient {$request->leaveType?->name} balance to approve this request.",
                ]);
            }

            $balance->update(['taken' => round((float) $balance->taken + (float) $request->days, 1)]);

            $request->update([
                'status' => 'approved',
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);

            $this->activityLog->log('leave.approved', "Approved leave request {$request->reference}", $request);

            $fresh = $request->fresh(['leaveType', 'requester', 'approver']);
            if ($fresh->requester && (int) $fresh->user_id !== (int) $approver->id) {
                app(AppNotificationService::class)->notify(
                    $fresh->requester,
                    'leave.approved',
                    "Leave approved: {$fresh->reference}",
                    "{$approver->name} approved your {$fresh->leaveType?->name} leave ({$fresh->start_date->toDateString()} – {$fresh->end_date->toDateString()}).",
                    url(route('leave.show', $fresh, false)),
                    "leave-approved-{$fresh->id}",
                    ['leave_request_id' => $fresh->id],
                );
            }

            return $fresh;
        });
    }

    public function reject(LeaveRequest $request, User $approver, string $reason): LeaveRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Only pending leave requests can be rejected.',
            ]);
        }

        $request->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->activityLog->log('leave.rejected', "Rejected leave request {$request->reference}", $request);

        $fresh = $request->fresh(['leaveType', 'requester', 'approver']);
        if ($fresh->requester && (int) $fresh->user_id !== (int) $approver->id) {
            app(AppNotificationService::class)->notify(
                $fresh->requester,
                'leave.rejected',
                "Leave rejected: {$fresh->reference}",
                "{$approver->name} rejected your leave request."
                    .($reason !== '' ? " Reason: {$reason}" : ''),
                url(route('leave.show', $fresh, false)),
                "leave-rejected-{$fresh->id}",
                ['leave_request_id' => $fresh->id],
            );
        }

        return $fresh;
    }

    public function cancel(LeaveRequest $request, User $user): LeaveRequest
    {
        if (! in_array($request->status, ['pending', 'approved'], true)) {
            throw ValidationException::withMessages([
                'status' => 'This leave request can no longer be cancelled.',
            ]);
        }

        if ((int) $request->user_id !== (int) $user->id && ! $user->can('leave.view_all')) {
            throw ValidationException::withMessages([
                'status' => 'You can only cancel your own leave requests.',
            ]);
        }

        return DB::transaction(function () use ($request, $user) {
            if ($request->status === 'approved') {
                $request->loadMissing(['leaveType', 'requester']);
                $balance = $this->ensureBalance(
                    $request->requester,
                    $request->leaveType,
                    (int) $request->start_date->format('Y'),
                );
                $balance->update([
                    'taken' => max(0, round((float) $balance->taken - (float) $request->days, 1)),
                ]);
            }

            $request->update(['status' => 'cancelled']);
            $this->activityLog->log('leave.cancelled', "Cancelled leave request {$request->reference}", $request, [
                'by' => $user->id,
            ]);

            return $request->fresh();
        });
    }

    /**
     * @return array{pending: int, approved_upcoming: int, my_remaining_annual: float, on_leave_today: int}
     */
    public function summaryStats(User $user): array
    {
        $query = $this->scopedQuery($user);
        $annual = LeaveType::query()->where('code', 'ANNUAL')->first();
        $remaining = 0.0;
        if ($annual) {
            $balance = $this->ensureBalance($user, $annual);
            $remaining = $balance->remaining();
        }

        return [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'approved_upcoming' => (clone $query)->where('status', 'approved')
                ->whereDate('end_date', '>=', today())
                ->count(),
            'my_remaining_annual' => $remaining,
            'on_leave_today' => LeaveRequest::query()
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', today())
                ->whereDate('end_date', '>=', today())
                ->when(! $this->canViewAll($user), fn ($q) => $q->where('user_id', $user->id))
                ->count(),
        ];
    }

    /**
     * Team calendar entries for a month (approved + pending for managers).
     *
     * @return list<array<string, mixed>>
     */
    public function calendarEntries(User $viewer, Carbon $month): array
    {
        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();
        $canViewAll = $this->canViewAll($viewer);

        return LeaveRequest::query()
            ->with(['requester:id,name', 'leaveType:id,name,code', 'department:id,name'])
            ->whereIn('status', $canViewAll ? ['pending', 'approved'] : ['approved', 'pending'])
            ->when(! $canViewAll, fn ($q) => $q->where('user_id', $viewer->id))
            ->whereDate('start_date', '<=', $end)
            ->whereDate('end_date', '>=', $start)
            ->orderBy('start_date')
            ->get()
            ->map(fn (LeaveRequest $item) => [
                'id' => $item->id,
                'reference' => $item->reference,
                'employee' => $item->requester?->name,
                'leave_type' => $item->leaveType?->name,
                'department' => $item->department?->name,
                'start_date' => $item->start_date?->toDateString(),
                'end_date' => $item->end_date?->toDateString(),
                'days' => (float) $item->days,
                'status' => $item->status,
                'status_label' => LeaveRequest::statusLabel($item->status),
                'is_half_day' => $item->is_half_day,
            ])
            ->all();
    }

    private function assertNoOverlap(int $userId, string $start, string $end, ?int $ignoreId = null): void
    {
        $overlap = LeaveRequest::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->whereDate('start_date', '<=', $end)
            ->whereDate('end_date', '>=', $start)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'start_date' => 'You already have leave pending or approved that overlaps these dates.',
            ]);
        }
    }

    private function assertSufficientBalance(User $user, LeaveType $type, float $days, ?int $ignoreRequestId = null): void
    {
        $balance = $this->ensureBalance($user, $type);
        $pendingDays = (float) LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('leave_type_id', $type->id)
            ->where('status', 'pending')
            ->whereYear('start_date', $balance->year)
            ->when($ignoreRequestId, fn ($q) => $q->where('id', '!=', $ignoreRequestId))
            ->sum('days');

        $available = round($balance->remaining() - $pendingDays, 1);

        if ($days > $available + 0.001) {
            throw ValidationException::withMessages([
                'leave_type_id' => "Insufficient {$type->name} balance. Available: {$available} day(s) (including pending requests).",
            ]);
        }
    }
}
