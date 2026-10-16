<?php

namespace App\Services;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcurementService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = PurchaseRequest::query()
            ->where('reference', 'like', "PR-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('PR-%s-%04d', $year, $sequence);
    }

    public function canRequest(User $user): bool
    {
        return $user->hasAnyRole([
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
        return $user->can('procurement.view_all')
            || $user->can('procurement.approve')
            || $user->can('procurement.process');
    }

    public function scopedQuery(User $user): Builder
    {
        $query = PurchaseRequest::query();

        if ($this->canViewAll($user)) {
            return $query;
        }

        return $query->where('requested_by', $user->id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($user, $data) {
            $request = PurchaseRequest::query()->create([
                'reference' => $this->nextReference(),
                'title' => $data['title'],
                'justification' => $data['justification'] ?? null,
                'status' => 'submitted',
                'department_id' => $data['department_id'] ?? $user->department_id,
                'requested_by' => $user->id,
                'currency' => $data['currency'] ?? 'KES',
                'total_amount' => 0,
            ]);

            $this->syncItems($request, $data['items'] ?? []);
            $request->recalculateTotal();

            $this->activityLog->log('procurement.created', "Submitted purchase request {$request->reference}", $request);

            $fresh = $request->fresh(['items', 'department', 'requester']);
            $title = "Purchase request needs approval: {$fresh->reference}";
            $body = "{$user->name} submitted {$fresh->reference} — {$fresh->title} (KES "
                .number_format((float) $fresh->total_amount, 0).').';
            $link = url(route('procurement.show', $fresh, false));

            app(AppNotificationService::class)->notifyMany(
                app(AppNotificationService::class)->usersWithPermission('procurement.approve'),
                'procurement.approval',
                $title,
                $body,
                $link,
                "procurement-approval-{$fresh->id}",
                ['purchase_request_id' => $fresh->id],
                true,
                $user->id,
            );

            return $fresh;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseRequest $request, array $data): PurchaseRequest
    {
        if ($request->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Only pending requests can be edited.',
            ]);
        }

        return DB::transaction(function () use ($request, $data) {
            $request->update([
                'title' => $data['title'],
                'justification' => $data['justification'] ?? null,
                'department_id' => $data['department_id'] ?? $request->department_id,
                'currency' => $data['currency'] ?? $request->currency,
            ]);

            $this->syncItems($request, $data['items'] ?? []);
            $request->recalculateTotal();

            $this->activityLog->log('procurement.updated', "Updated purchase request {$request->reference}", $request);

            return $request->fresh(['items', 'department', 'requester']);
        });
    }

    public function approve(PurchaseRequest $request, User $approver): PurchaseRequest
    {
        if ($request->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Only pending requests can be approved.',
            ]);
        }

        $request->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        $this->activityLog->log('procurement.approved', "Approved purchase request {$request->reference}", $request);

        $fresh = $request->fresh(['requester']);
        if ($fresh->requester && (int) $fresh->requested_by !== (int) $approver->id) {
            $link = url(route('procurement.show', $fresh, false));
            app(AppNotificationService::class)->notify(
                $fresh->requester,
                'procurement.approved',
                "Purchase request approved: {$fresh->reference}",
                "{$approver->name} approved your request {$fresh->reference} — {$fresh->title}.",
                $link,
                "procurement-approved-{$fresh->id}",
                ['purchase_request_id' => $fresh->id],
            );
        }

        return $fresh;
    }

    public function reject(PurchaseRequest $request, User $approver, string $reason): PurchaseRequest
    {
        if ($request->status !== 'submitted') {
            throw ValidationException::withMessages([
                'status' => 'Only pending requests can be rejected.',
            ]);
        }

        $request->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->activityLog->log('procurement.rejected', "Rejected purchase request {$request->reference}", $request);

        $fresh = $request->fresh(['requester']);
        if ($fresh->requester && (int) $fresh->requested_by !== (int) $approver->id) {
            $link = url(route('procurement.show', $fresh, false));
            app(AppNotificationService::class)->notify(
                $fresh->requester,
                'procurement.rejected',
                "Purchase request rejected: {$fresh->reference}",
                "{$approver->name} rejected your request {$fresh->reference}."
                    .($reason !== '' ? " Reason: {$reason}" : ''),
                $link,
                "procurement-rejected-{$fresh->id}",
                ['purchase_request_id' => $fresh->id],
            );
        }

        return $fresh;
    }

    public function process(PurchaseRequest $request, User $financeUser, ?string $notes = null): PurchaseRequest
    {
        if ($request->status !== 'approved') {
            throw ValidationException::withMessages([
                'status' => 'Only approved requests can be processed by finance.',
            ]);
        }

        $request->update([
            'status' => 'processed',
            'processed_by' => $financeUser->id,
            'processed_at' => now(),
            'finance_notes' => $notes,
        ]);

        $this->activityLog->log('procurement.processed', "Processed purchase request {$request->reference}", $request);

        return $request->fresh();
    }

    public function cancel(PurchaseRequest $request, User $user): PurchaseRequest
    {
        if (! in_array($request->status, ['submitted', 'approved'], true)) {
            throw ValidationException::withMessages([
                'status' => 'This request can no longer be cancelled.',
            ]);
        }

        if ((int) $request->requested_by !== (int) $user->id && ! $user->can('procurement.view_all')) {
            throw ValidationException::withMessages([
                'status' => 'You can only cancel your own requests.',
            ]);
        }

        $request->update(['status' => 'cancelled']);
        $this->activityLog->log('procurement.cancelled', "Cancelled purchase request {$request->reference}", $request);

        return $request->fresh();
    }

    /**
     * @return array{pending: int, approved: int, processed_month: float|int, spend_month: float}
     */
    public function summaryStats(User $user): array
    {
        $query = $this->scopedQuery($user);

        return [
            'pending' => (clone $query)->where('status', 'submitted')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'processed_month' => (clone $query)->where('status', 'processed')
                ->whereMonth('processed_at', now()->month)
                ->whereYear('processed_at', now()->year)
                ->count(),
            'spend_month' => (float) (clone $query)->where('status', 'processed')
                ->whereMonth('processed_at', now()->month)
                ->whereYear('processed_at', now()->year)
                ->sum('total_amount'),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncItems(PurchaseRequest $request, array $items): void
    {
        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => 'Add at least one item.',
            ]);
        }

        $request->items()->delete();

        foreach ($items as $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $cost = (float) ($item['unit_cost'] ?? 0);

            if ($qty <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'Item quantity must be greater than zero.',
                ]);
            }

            PurchaseRequestItem::query()->create([
                'purchase_request_id' => $request->id,
                'description' => $item['description'],
                'quantity' => $qty,
                'unit_cost' => $cost,
                'line_total' => round($qty * $cost, 2),
            ]);
        }
    }
}
