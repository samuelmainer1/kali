<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\PurchaseRequest;
use App\Services\ProcurementService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function __construct(private readonly ProcurementService $procurement) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($this->procurement->canRequest($user) || $this->procurement->canViewAll($user), 403);

        $canViewAll = $this->procurement->canViewAll($user);

        $requests = $this->procurement->scopedQuery($user)
            ->with(['requester:id,name', 'department:id,name', 'approver:id,name', 'processor:id,name'])
            ->when($request->filled('q'), function ($query) use ($request) {
                $q = $request->string('q');
                $query->where(function ($builder) use ($q) {
                    $builder->where('title', 'like', "%{$q}%")
                        ->orWhere('reference', 'like', "%{$q}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('department_id') && $canViewAll, fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (PurchaseRequest $item) => [
                'id' => $item->id,
                'reference' => $item->reference,
                'title' => $item->title,
                'status' => $item->status,
                'status_label' => PurchaseRequest::statusLabel($item->status),
                'total_amount' => (float) $item->total_amount,
                'currency' => $item->currency,
                'department' => $item->department?->name,
                'requester' => $item->requester?->name,
                'created_at' => $item->created_at?->toDateString(),
            ]);

        return Inertia::render('Procurement/Index', [
            'requests' => $requests,
            'filters' => $request->only(['q', 'status', 'department_id']),
            'statuses' => PurchaseRequest::STATUSES,
            'statusLabels' => collect(PurchaseRequest::STATUSES)
                ->mapWithKeys(fn ($s) => [$s => PurchaseRequest::statusLabel($s)]),
            'canViewAll' => $canViewAll,
            'canApprove' => $user->can('procurement.approve'),
            'canProcess' => $user->can('procurement.process'),
            'canRequest' => $this->procurement->canRequest($user),
            'departments' => $canViewAll
                ? Department::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'stats' => $this->procurement->summaryStats($user),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($this->procurement->canRequest($request->user()), 403);

        return Inertia::render('Procurement/Form', [
            'purchaseRequest' => null,
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'defaultDepartmentId' => $request->user()->department_id,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($this->procurement->canRequest($request->user()), 403);

        $data = $this->validated($request);
        $purchaseRequest = $this->procurement->create($request->user(), $data);

        return redirect()
            ->route('procurement.show', $purchaseRequest)
            ->with('success', 'Purchase request submitted.');
    }

    public function show(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        $user = $request->user();
        abort_unless($this->procurement->canRequest($user) || $this->procurement->canViewAll($user), 403);

        if (! $this->procurement->canViewAll($user) && (int) $purchaseRequest->requested_by !== (int) $user->id) {
            abort(403);
        }

        $purchaseRequest->load([
            'items',
            'requester:id,name,email',
            'department:id,name',
            'approver:id,name',
            'processor:id,name',
        ]);

        return Inertia::render('Procurement/Show', [
            'purchaseRequest' => [
                ...$purchaseRequest->toArray(),
                'status_label' => PurchaseRequest::statusLabel($purchaseRequest->status),
                'can_edit' => $purchaseRequest->status === 'submitted' && (int) $purchaseRequest->requested_by === (int) $user->id,
                'can_cancel' => in_array($purchaseRequest->status, ['submitted', 'approved'], true)
                    && ((int) $purchaseRequest->requested_by === (int) $user->id || $user->can('procurement.view_all')),
                'can_approve' => $user->can('procurement.approve') && $purchaseRequest->status === 'submitted',
                'can_process' => $user->can('procurement.process') && $purchaseRequest->status === 'approved',
            ],
        ]);
    }

    public function edit(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        abort_unless($this->procurement->canRequest($request->user()), 403);
        abort_unless((int) $purchaseRequest->requested_by === (int) $request->user()->id, 403);
        abort_unless($purchaseRequest->status === 'submitted', 403);

        $purchaseRequest->load('items');

        return Inertia::render('Procurement/Form', [
            'purchaseRequest' => $purchaseRequest,
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'defaultDepartmentId' => $purchaseRequest->department_id,
        ]);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest)
    {
        abort_unless((int) $purchaseRequest->requested_by === (int) $request->user()->id, 403);

        $data = $this->validated($request);
        $this->procurement->update($purchaseRequest, $data);

        return redirect()
            ->route('procurement.show', $purchaseRequest)
            ->with('success', 'Purchase request updated.');
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest)
    {
        abort_unless($request->user()->can('procurement.approve'), 403);
        $this->procurement->approve($purchaseRequest, $request->user());

        return back()->with('success', 'Purchase request approved.');
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest)
    {
        abort_unless($request->user()->can('procurement.approve'), 403);

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:255'],
        ]);

        $this->procurement->reject($purchaseRequest, $request->user(), $data['rejection_reason']);

        return back()->with('success', 'Purchase request rejected.');
    }

    public function process(Request $request, PurchaseRequest $purchaseRequest)
    {
        abort_unless($request->user()->can('procurement.process'), 403);

        $data = $request->validate([
            'finance_notes' => ['nullable', 'string'],
        ]);

        $this->procurement->process($purchaseRequest, $request->user(), $data['finance_notes'] ?? null);

        return back()->with('success', 'Purchase request marked as processed.');
    }

    public function cancel(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->procurement->cancel($purchaseRequest, $request->user());

        return back()->with('success', 'Purchase request cancelled.');
    }

    private function validated(Request $request): array
    {
        $request->merge([
            'department_id' => $request->filled('department_id') ? $request->input('department_id') : null,
        ]);

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'justification' => ['nullable', 'string'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);
    }
}
