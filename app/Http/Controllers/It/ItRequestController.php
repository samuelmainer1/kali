<?php

namespace App\Http\Controllers\It;

use App\Http\Controllers\Controller;
use App\Models\ItRequest;
use App\Models\User;
use App\Services\ItRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ItRequestController extends Controller
{
    public function __construct(private readonly ItRequestService $requests) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user->can('it.manage');

        $items = ItRequest::query()
            ->with(['requester:id,name', 'assignee:id,name', 'department:id,name'])
            ->when(! $canManage, fn ($query) => $query->where('user_id', $user->id))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (ItRequest $item) => $this->listPayload($item));

        return Inertia::render('It/Index', [
            'requests' => $items,
            'filters' => $request->only(['search', 'status']),
            'canManage' => $canManage,
            'statuses' => ItRequest::STATUSES,
            'department' => $this->requests->department()->only(['id', 'name']),
            'stats' => [
                'open' => $this->scoped($user, $canManage)->whereIn('status', ['open', 'in_progress'])->count(),
                'urgent' => $this->scoped($user, $canManage)->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(),
                'resolved' => $this->scoped($user, $canManage)->whereIn('status', ['resolved', 'closed'])->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('It/Form', [
            'categories' => ItRequest::CATEGORIES,
            'priorities' => ItRequest::PRIORITIES,
            'department' => $this->requests->department()->only(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', Rule::in(ItRequest::CATEGORIES)],
            'priority' => ['required', Rule::in(ItRequest::PRIORITIES)],
        ]);

        $item = $this->requests->create($request->user(), $data);

        return redirect()
            ->route('it.requests.show', $item)
            ->with('success', 'IT request sent to IT & Marketing.');
    }

    public function show(Request $request, ItRequest $itRequest): Response
    {
        $this->authorizeView($request->user(), $itRequest);
        $canManage = $request->user()->can('it.manage');

        $itRequest->load(['requester:id,name,email', 'assignee:id,name', 'department:id,name']);

        return Inertia::render('It/Show', [
            'requestItem' => [
                ...$this->listPayload($itRequest),
                'description' => $itRequest->description,
                'resolution' => $itRequest->resolution,
                'requester' => $itRequest->requester?->only(['id', 'name', 'email']),
                'assignee' => $itRequest->assignee?->only(['id', 'name']),
            ],
            'canManage' => $canManage,
            'statuses' => ItRequest::STATUSES,
            'handlers' => $canManage
                ? User::permission('it.manage')->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    public function update(Request $request, ItRequest $itRequest): RedirectResponse
    {
        abort_unless($request->user()->can('it.manage'), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(ItRequest::STATUSES)],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'resolution' => ['nullable', 'string'],
        ]);

        if (blank($data['assigned_to'] ?? null)) {
            unset($data['assigned_to']);
        }

        $this->requests->update($itRequest, $request->user(), $data);

        return back()->with('success', 'IT request updated.');
    }

    private function authorizeView(User $user, ItRequest $itRequest): void
    {
        if ($user->can('it.manage') || $itRequest->user_id === $user->id) {
            return;
        }

        abort(403);
    }

    private function scoped(User $user, bool $canManage)
    {
        return ItRequest::query()->when(! $canManage, fn ($query) => $query->where('user_id', $user->id));
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(ItRequest $item): array
    {
        return [
            'id' => $item->id,
            'reference' => $item->reference,
            'title' => $item->title,
            'category' => $item->category,
            'priority' => $item->priority,
            'status' => $item->status,
            'status_label' => ItRequest::label($item->status),
            'requester_name' => $item->requester?->name,
            'assignee_name' => $item->assignee?->name,
            'department' => $item->department?->name ?? 'IT & Marketing',
            'created_at' => $item->created_at?->toDateString(),
        ];
    }
}
