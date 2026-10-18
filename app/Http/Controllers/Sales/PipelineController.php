<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\Quotation;
use App\Models\User;
use App\Services\PipelineService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function __construct(private readonly PipelineService $pipeline) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $viewAll = $this->pipeline->canViewAll($user);

        $query = $this->pipeline->scopedQuery($user)
            ->with(['customer:id,name', 'owner:id,name', 'quotation:id,reference'])
            ->latest('updated_at');

        if ($request->filled('stage')) {
            $query->where('stage', $request->string('stage'));
        }

        if ($request->filled('owner_id') && $viewAll) {
            $query->where('owner_id', $request->integer('owner_id'));
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%");
            });
        }

        if ($request->boolean('overdue')) {
            $query->open()->whereDate('next_follow_up', '<', now()->toDateString());
        }

        $opportunities = $query->paginate(20)->withQueryString();
        $opportunities->getCollection()->transform(function (Opportunity $item) {
            $item->setAttribute('stage_label', Opportunity::stageLabel($item->stage));
            $item->setAttribute('is_overdue', $item->isOverdue());
            $item->setAttribute('is_closed', $item->isClosed());

            return $item;
        });

        $boardQuery = $this->pipeline->scopedQuery($user)->open();
        if ($request->filled('owner_id') && $viewAll) {
            $boardQuery->where('owner_id', $request->integer('owner_id'));
        }

        $board = collect(Opportunity::OPEN_STAGES)->mapWithKeys(function (string $stage) use ($boardQuery) {
            $items = (clone $boardQuery)
                ->where('stage', $stage)
                ->with(['customer:id,name', 'owner:id,name'])
                ->orderBy('next_follow_up')
                ->limit(12)
                ->get()
                ->map(fn (Opportunity $item) => [
                    'id' => $item->id,
                    'reference' => $item->reference,
                    'title' => $item->title,
                    'customer' => $item->customer?->name,
                    'owner' => $item->owner?->name,
                    'expected_value' => (float) $item->expected_value,
                    'next_follow_up' => $item->next_follow_up?->toDateString(),
                    'is_overdue' => $item->isOverdue(),
                ]);

            return [$stage => $items];
        });

        return Inertia::render('Sales/Pipeline/Index', [
            'opportunities' => $opportunities,
            'board' => $board,
            'filters' => $request->only(['q', 'stage', 'owner_id', 'overdue']),
            'stages' => Opportunity::STAGES,
            'stageLabels' => collect(Opportunity::STAGES)
                ->mapWithKeys(fn ($s) => [$s => Opportunity::stageLabel($s)]),
            'canViewAll' => $viewAll,
            'canManage' => $user->can('pipeline.manage'),
            'owners' => $viewAll
                ? User::role(['sales', 'management', 'administrator'])->orderBy('name')->get(['id', 'name'])
                : [],
            'performance' => $viewAll ? $this->pipeline->salespersonPerformance() : [],
            'stats' => [
                'open' => $this->pipeline->scopedQuery($user)->open()->count(),
                'overdue' => $this->pipeline->scopedQuery($user)->open()->whereDate('next_follow_up', '<', now()->toDateString())->count(),
                'won_value' => (float) $this->pipeline->scopedQuery($user)->where('stage', 'won')->sum('expected_value'),
                'lost' => $this->pipeline->scopedQuery($user)->where('stage', 'lost')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Sales/Pipeline/Form', [
            'opportunity' => null,
            'options' => $this->formOptions($request->user()),
            'prefill' => [
                'customer_id' => $request->integer('customer_id') ?: null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        if (! $request->user()->can('pipeline.view_all')) {
            $data['owner_id'] = $request->user()->id;
        }

        $opportunity = $this->pipeline->create($request->user(), $data);

        return redirect()
            ->route('pipeline.show', $opportunity)
            ->with('success', 'Opportunity created.');
    }

    public function show(Request $request, Opportunity $opportunity): Response
    {
        $this->authorizeView($request->user(), $opportunity);

        $opportunity->load([
            'customer:id,name,email,phone,status',
            'owner:id,name',
            'creator:id,name',
            'quotation:id,reference,status,total',
        ]);

        return Inertia::render('Sales/Pipeline/Show', [
            'opportunity' => [
                ...$opportunity->toArray(),
                'stage_label' => Opportunity::stageLabel($opportunity->stage),
                'is_overdue' => $opportunity->isOverdue(),
                'is_closed' => $opportunity->isClosed(),
                'next_follow_up' => $opportunity->next_follow_up?->toDateString(),
                'can_edit' => $this->canEdit($request->user(), $opportunity),
            ],
            'stages' => Opportunity::STAGES,
            'stageLabels' => collect(Opportunity::STAGES)
                ->mapWithKeys(fn ($s) => [$s => Opportunity::stageLabel($s)]),
        ]);
    }

    public function edit(Request $request, Opportunity $opportunity): Response
    {
        $this->authorizeView($request->user(), $opportunity);
        abort_unless($this->canEdit($request->user(), $opportunity), 403);

        return Inertia::render('Sales/Pipeline/Form', [
            'opportunity' => $opportunity->load(['customer:id,name', 'quotation:id,reference']),
            'options' => $this->formOptions($request->user(), $opportunity),
            'prefill' => null,
        ]);
    }

    public function update(Request $request, Opportunity $opportunity)
    {
        $this->authorizeView($request->user(), $opportunity);
        abort_unless($this->canEdit($request->user(), $opportunity), 403);

        $data = $this->validated($request);
        if (! $request->user()->can('pipeline.view_all')) {
            $data['owner_id'] = $opportunity->owner_id;
        }

        $this->pipeline->update($opportunity, $data);

        return redirect()
            ->route('pipeline.show', $opportunity)
            ->with('success', 'Opportunity updated.');
    }

    public function stage(Request $request, Opportunity $opportunity)
    {
        $this->authorizeView($request->user(), $opportunity);
        abort_unless($this->canEdit($request->user(), $opportunity) || $request->user()->can('pipeline.manage'), 403);

        if ($opportunity->isClosed() && ! $request->user()->can('pipeline.view_all')) {
            abort(403);
        }

        $data = $request->validate([
            'stage' => ['required', Rule::in(Opportunity::STAGES)],
            'lost_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $this->pipeline->changeStage($opportunity, $data['stage'], $data['lost_reason'] ?? null);

        return back()->with('success', 'Stage updated.');
    }

    private function validated(Request $request): array
    {
        $request->merge([
            'quotation_id' => $request->filled('quotation_id') ? $request->input('quotation_id') : null,
            'next_follow_up' => $request->filled('next_follow_up') ? $request->input('next_follow_up') : null,
            'lost_reason' => $request->filled('lost_reason') ? $request->input('lost_reason') : null,
        ]);

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'owner_id' => ['required', 'integer', 'exists:users,id'],
            'stage' => ['required', Rule::in(Opportunity::STAGES)],
            'expected_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'next_follow_up' => ['nullable', 'date'],
            'quotation_id' => ['nullable', 'integer', 'exists:quotations,id'],
            'notes' => ['nullable', 'string'],
            'lost_reason' => ['nullable', 'string', 'max:255', Rule::requiredIf(fn () => $request->input('stage') === 'lost')],
        ]);
    }

    private function formOptions(User $user, ?Opportunity $opportunity = null): array
    {
        $viewAll = $user->can('pipeline.view_all');

        return [
            'stages' => Opportunity::STAGES,
            'stageLabels' => collect(Opportunity::STAGES)
                ->mapWithKeys(fn ($s) => [$s => Opportunity::stageLabel($s)]),
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name', 'status']),
            'owners' => $viewAll
                ? User::role(['sales', 'management', 'administrator'])->orderBy('name')->get(['id', 'name'])
                : User::query()->where('id', $user->id)->get(['id', 'name']),
            'quotations' => Quotation::query()
                ->when($opportunity, fn ($q) => $q->where('customer_id', $opportunity->customer_id))
                ->latest()
                ->limit(50)
                ->get(['id', 'reference', 'customer_id', 'status', 'total']),
            'default_owner' => $user->id,
        ];
    }

    private function authorizeView(User $user, Opportunity $opportunity): void
    {
        if ($user->can('pipeline.view_all')) {
            return;
        }

        abort_unless((int) $opportunity->owner_id === (int) $user->id, 403);
    }

    private function canEdit(User $user, Opportunity $opportunity): bool
    {
        if (! $user->can('pipeline.manage') && ! $user->can('pipeline.view_all')) {
            return false;
        }

        if ($user->can('pipeline.view_all')) {
            return true;
        }

        return (int) $opportunity->owner_id === (int) $user->id && ! $opportunity->isClosed();
    }
}
