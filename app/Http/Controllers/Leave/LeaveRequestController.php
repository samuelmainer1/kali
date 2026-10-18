<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\LeaveService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function __construct(private readonly LeaveService $leave) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($this->leave->canRequest($user) || $this->leave->canViewAll($user), 403);

        $canViewAll = $this->leave->canViewAll($user);

        $requests = $this->leave->scopedQuery($user)
            ->with(['requester:id,name', 'leaveType:id,name,code', 'department:id,name', 'approver:id,name'])
            ->when($request->filled('q'), function ($query) use ($request) {
                $q = $request->string('q');
                $query->where(function ($builder) use ($q) {
                    $builder->where('reference', 'like', "%{$q}%")
                        ->orWhere('reason', 'like', "%{$q}%")
                        ->orWhereHas('requester', fn ($inner) => $inner->where('name', 'like', "%{$q}%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('leave_type_id'), fn ($q) => $q->where('leave_type_id', $request->integer('leave_type_id')))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (LeaveRequest $item) => $this->listPayload($item));

        return Inertia::render('Leave/Index', [
            'requests' => $requests,
            'filters' => $request->only(['q', 'status', 'leave_type_id']),
            'statuses' => LeaveRequest::STATUSES,
            'statusLabels' => collect(LeaveRequest::STATUSES)
                ->mapWithKeys(fn ($s) => [$s => LeaveRequest::statusLabel($s)]),
            'leaveTypes' => LeaveType::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'canViewAll' => $canViewAll,
            'canApprove' => $user->can('leave.approve'),
            'canRequest' => $this->leave->canRequest($user),
            'balances' => $this->leave->balancesFor($user),
            'stats' => $this->leave->summaryStats($user),
        ]);
    }

    public function calendar(Request $request): Response
    {
        $user = $request->user();
        abort_unless($this->leave->canRequest($user) || $this->leave->canViewAll($user), 403);

        $monthInput = $request->string('month')->toString();
        $month = $monthInput !== ''
            ? Carbon::createFromFormat('Y-m', $monthInput)->startOfMonth()
            : now()->startOfMonth();

        return Inertia::render('Leave/Calendar', [
            'month' => $month->format('Y-m'),
            'month_label' => $month->format('F Y'),
            'entries' => $this->leave->calendarEntries($user, $month),
            'canViewAll' => $this->leave->canViewAll($user),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($this->leave->canRequest($request->user()), 403);

        return Inertia::render('Leave/Form', [
            'leaveRequest' => null,
            'leaveTypes' => LeaveType::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'code', 'days_per_year']),
            'balances' => $this->leave->balancesFor($request->user()),
            'halfDayPeriods' => LeaveRequest::HALF_DAY_PERIODS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->leave->canRequest($request->user()), 403);

        $leaveRequest = $this->leave->create($request->user(), $this->validated($request));

        return redirect()
            ->route('leave.show', $leaveRequest)
            ->with('success', 'Leave request submitted for approval.');
    }

    public function show(Request $request, LeaveRequest $leaveRequest): Response
    {
        $user = $request->user();
        abort_unless($this->leave->canRequest($user) || $this->leave->canViewAll($user), 403);

        if (! $this->leave->canViewAll($user) && (int) $leaveRequest->user_id !== (int) $user->id) {
            abort(403);
        }

        $leaveRequest->load([
            'requester:id,name,email',
            'leaveType:id,name,code',
            'department:id,name',
            'branch:id,name',
            'approver:id,name',
        ]);

        return Inertia::render('Leave/Show', [
            'leaveRequest' => [
                ...$this->listPayload($leaveRequest),
                'reason' => $leaveRequest->reason,
                'is_half_day' => $leaveRequest->is_half_day,
                'half_day_period' => $leaveRequest->half_day_period,
                'rejection_reason' => $leaveRequest->rejection_reason,
                'approved_at' => $leaveRequest->approved_at?->toDateTimeString(),
                'approver' => $leaveRequest->approver?->only(['id', 'name']),
                'requester' => $leaveRequest->requester?->only(['id', 'name', 'email']),
                'leave_type' => $leaveRequest->leaveType?->only(['id', 'name', 'code']),
                'department' => $leaveRequest->department?->name,
                'branch' => $leaveRequest->branch?->name,
                'can_edit' => $leaveRequest->status === 'pending' && (int) $leaveRequest->user_id === (int) $user->id,
                'can_cancel' => in_array($leaveRequest->status, ['pending', 'approved'], true)
                    && ((int) $leaveRequest->user_id === (int) $user->id || $user->can('leave.view_all')),
                'can_approve' => $user->can('leave.approve') && $leaveRequest->status === 'pending',
            ],
        ]);
    }

    public function edit(Request $request, LeaveRequest $leaveRequest): Response
    {
        abort_unless($this->leave->canRequest($request->user()), 403);
        abort_unless((int) $leaveRequest->user_id === (int) $request->user()->id, 403);
        abort_unless($leaveRequest->status === 'pending', 403);

        return Inertia::render('Leave/Form', [
            'leaveRequest' => [
                'id' => $leaveRequest->id,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'start_date' => $leaveRequest->start_date?->toDateString(),
                'end_date' => $leaveRequest->end_date?->toDateString(),
                'is_half_day' => $leaveRequest->is_half_day,
                'half_day_period' => $leaveRequest->half_day_period,
                'reason' => $leaveRequest->reason,
            ],
            'leaveTypes' => LeaveType::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'code', 'days_per_year']),
            'balances' => $this->leave->balancesFor($request->user()),
            'halfDayPeriods' => LeaveRequest::HALF_DAY_PERIODS,
        ]);
    }

    public function update(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless((int) $leaveRequest->user_id === (int) $request->user()->id, 403);

        $this->leave->update($leaveRequest, $this->validated($request));

        return redirect()
            ->route('leave.show', $leaveRequest)
            ->with('success', 'Leave request updated.');
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($request->user()->can('leave.approve'), 403);
        $this->leave->approve($leaveRequest, $request->user());

        return back()->with('success', 'Leave request approved.');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($request->user()->can('leave.approve'), 403);

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->leave->reject($leaveRequest, $request->user(), $data['rejection_reason']);

        return back()->with('success', 'Leave request rejected.');
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $this->leave->cancel($leaveRequest, $request->user());

        return back()->with('success', 'Leave request cancelled.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'is_half_day' => ['sometimes', 'boolean'],
            'half_day_period' => ['nullable', Rule::in(LeaveRequest::HALF_DAY_PERIODS)],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['is_half_day'] = $request->boolean('is_half_day');

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(LeaveRequest $item): array
    {
        return [
            'id' => $item->id,
            'reference' => $item->reference,
            'status' => $item->status,
            'status_label' => LeaveRequest::statusLabel($item->status),
            'start_date' => $item->start_date?->toDateString(),
            'end_date' => $item->end_date?->toDateString(),
            'days' => (float) $item->days,
            'leave_type_name' => $item->leaveType?->name,
            'requester_name' => $item->requester?->name,
            'department' => $item->department?->name,
            'created_at' => $item->created_at?->toDateString(),
        ];
    }
}
