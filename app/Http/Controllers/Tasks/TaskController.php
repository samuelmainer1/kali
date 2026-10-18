<?php

namespace App\Http\Controllers\Tasks;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\Shipment;
use App\Models\SupportTicket;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(private readonly TaskService $tasks)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user->can('tasks.manage');
        $scope = $request->string('scope')->toString() ?: ($canManage ? 'all' : 'mine');

        $tasks = Task::query()
            ->with(['assignee:id,name', 'creator:id,name', 'department:id,name'])
            ->when(! $canManage || $scope === 'mine', function ($query) use ($user) {
                $query->where(function ($inner) use ($user) {
                    $inner->where('assigned_to', $user->id)
                        ->orWhere('created_by', $user->id);
                });
            })
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->string('priority')))
            ->when($request->filled('assigned_to') && $canManage, fn ($q) => $q->where('assigned_to', $request->integer('assigned_to')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Task $task) => $this->listPayload($task));

        $openQuery = Task::query()->whereIn('status', ['todo', 'in_progress']);
        if (! $canManage) {
            $openQuery->where('assigned_to', $user->id);
        }

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['search', 'status', 'priority', 'assigned_to', 'scope']),
            'canManage' => $canManage,
            'statuses' => Task::STATUSES,
            'priorities' => Task::PRIORITIES,
            'assignees' => $canManage
                ? User::query()->where('is_active', true)->whereDoesntHave('roles', fn ($q) => $q->where('name', 'customer'))->orderBy('name')->get(['id', 'name'])
                : [],
            'stats' => [
                'my_open' => Task::query()->where('assigned_to', $user->id)->whereIn('status', ['todo', 'in_progress'])->count(),
                'overdue' => Task::query()->where('assigned_to', $user->id)->whereIn('status', ['todo', 'in_progress'])->whereDate('due_date', '<', today())->count(),
                'due_today' => Task::query()->where('assigned_to', $user->id)->whereIn('status', ['todo', 'in_progress'])->whereDate('due_date', today())->count(),
                'all_open' => $canManage ? (clone $openQuery)->count() : null,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Tasks/Form', [
            'task' => null,
            'options' => $this->formOptions($request),
            'prefill' => [
                'related_key' => $request->string('related_key')->toString() ?: null,
                'related_id' => $request->integer('related_id') ?: null,
                'title' => $request->string('title')->toString() ?: null,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $task = $this->tasks->create($request->user(), $data);

        return redirect()
            ->route('tasks.show', $task)
            ->with('success', 'Task created.');
    }

    public function show(Request $request, Task $task): Response
    {
        $this->authorizeView($request->user(), $task);

        $task->load([
            'assignee:id,name,email',
            'creator:id,name',
            'department:id,name',
            'related',
            'comments.author:id,name',
        ]);

        return Inertia::render('Tasks/Show', [
            'task' => [
                ...$this->listPayload($task),
                'description' => $task->description,
                'completed_at' => $task->completed_at?->toDateTimeString(),
                'assignee' => $task->assignee?->only(['id', 'name', 'email']),
                'creator' => $task->creator?->only(['id', 'name']),
                'department' => $task->department?->only(['id', 'name']),
                'related' => $this->relatedPayload($task),
                'comments' => $task->comments->map(fn ($comment) => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'author' => $comment->author?->name,
                    'created_at' => $comment->created_at?->diffForHumans(),
                ]),
                'can_edit' => $this->canEdit($request->user(), $task),
            ],
            'statuses' => Task::STATUSES,
            'priorities' => Task::PRIORITIES,
            'assignees' => $this->canEdit($request->user(), $task)
                ? User::query()->where('is_active', true)->whereDoesntHave('roles', fn ($q) => $q->where('name', 'customer'))->orderBy('name')->get(['id', 'name'])
                : [],
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(Request $request, Task $task): Response
    {
        $this->authorizeEdit($request->user(), $task);

        return Inertia::render('Tasks/Form', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->toDateString(),
                'assigned_to' => $task->assigned_to,
                'department_id' => $task->department_id,
                'related_key' => Task::relatedKey($task->related_type),
                'related_id' => $task->related_id,
            ],
            'options' => $this->formOptions($request),
            'prefill' => null,
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeEdit($request->user(), $task);
        $this->tasks->update($task, $this->validated($request));

        return redirect()
            ->route('tasks.show', $task)
            ->with('success', 'Task updated.');
    }

    public function status(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeEdit($request->user(), $task);

        $data = $request->validate([
            'status' => ['required', Rule::in(Task::STATUSES)],
        ]);

        $this->tasks->updateStatus($task, $data['status']);

        return back()->with('success', 'Task status updated.');
    }

    public function comment(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeView($request->user(), $task);
        abort_unless($request->user()->can('tasks.create') || $request->user()->can('tasks.manage'), 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $this->tasks->comment($task, $request->user(), $data['body']);

        return back()->with('success', 'Comment added.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(Task::STATUSES)],
            'priority' => ['required', Rule::in(Task::PRIORITIES)],
            'due_date' => ['nullable', 'date'],
            'assigned_to' => ['required', 'exists:users,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'related_key' => ['nullable', Rule::in(array_keys(Task::RELATED_TYPES))],
            'related_id' => ['nullable', 'integer'],
        ]);
    }

    private function authorizeView(User $user, Task $task): void
    {
        if ($user->can('tasks.manage')) {
            return;
        }

        abort_unless(
            $user->can('tasks.view') && ($task->assigned_to === $user->id || $task->created_by === $user->id),
            403
        );
    }

    private function authorizeEdit(User $user, Task $task): void
    {
        if ($user->can('tasks.manage')) {
            return;
        }

        abort_unless(
            $user->can('tasks.create') && ($task->assigned_to === $user->id || $task->created_by === $user->id),
            403
        );
    }

    private function canEdit(User $user, Task $task): bool
    {
        if ($user->can('tasks.manage')) {
            return true;
        }

        return $user->can('tasks.create') && ($task->assigned_to === $user->id || $task->created_by === $user->id);
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(Task $task): array
    {
        return [
            'id' => $task->id,
            'reference' => $task->reference,
            'title' => $task->title,
            'status' => $task->status,
            'status_label' => Task::label($task->status),
            'priority' => $task->priority,
            'due_date' => $task->due_date?->toDateString(),
            'is_overdue' => $task->isOpen() && $task->due_date && $task->due_date->isPast(),
            'assignee_name' => $task->assignee?->name,
            'creator_name' => $task->creator?->name,
            'department_name' => $task->department?->name,
            'related_key' => Task::relatedKey($task->related_type),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function relatedPayload(Task $task): ?array
    {
        if (! $task->related) {
            return null;
        }

        $key = Task::relatedKey($task->related_type);
        $label = $task->related->reference ?? $task->related->subject ?? ('#'.$task->related_id);

        $route = match ($key) {
            'quotation' => route('sales.quotations.show', $task->related_id),
            'shipment' => route('operations.shipments.show', $task->related_id),
            'invoice' => route('finance.invoices.show', $task->related_id),
            'support_ticket' => route('support.show', $task->related_id),
            default => null,
        };

        return [
            'key' => $key,
            'id' => $task->related_id,
            'label' => $label,
            'url' => $route,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'statuses' => Task::STATUSES,
            'priorities' => Task::PRIORITIES,
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'assignees' => User::query()
                ->where('is_active', true)
                ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'customer'))
                ->orderBy('name')
                ->get(['id', 'name']),
            'related_types' => array_keys(Task::RELATED_TYPES),
            'related_options' => [
                'quotation' => Quotation::query()->latest()->limit(40)->get(['id', 'reference']),
                'shipment' => Shipment::query()->latest()->limit(40)->get(['id', 'reference']),
                'invoice' => Invoice::query()->latest()->limit(40)->get(['id', 'reference']),
                'support_ticket' => SupportTicket::query()->latest()->limit(40)->get(['id', 'reference', 'subject']),
            ],
            'default_assignee' => $request->user()->id,
        ];
    }
}
