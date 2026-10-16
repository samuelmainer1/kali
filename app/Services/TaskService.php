<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class TaskService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = Task::query()
            ->where('reference', 'like', "TS-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('TS-%s-%04d', $year, $sequence);
    }

    public function create(User $user, array $data): Task
    {
        $payload = $this->normalizeRelated($data);

        $task = Task::query()->create([
            ...$payload,
            'reference' => $this->nextReference(),
            'created_by' => $user->id,
            'status' => $payload['status'] ?? 'todo',
        ]);

        $this->activityLog->log('tasks.created', "Created task {$task->reference}", $task);

        $fresh = $task->fresh(['assignee']);
        $this->notifyAssignee($fresh, $user, assigned: true);

        return $fresh;
    }

    public function update(Task $task, array $data): Task
    {
        $previousAssigneeId = (int) $task->assigned_to;
        $payload = $this->normalizeRelated($data);

        if (($payload['status'] ?? $task->status) === 'done' && $task->status !== 'done') {
            $payload['completed_at'] = now();
        }

        if (isset($payload['status']) && $payload['status'] !== 'done') {
            $payload['completed_at'] = null;
        }

        $task->update($payload);
        $this->activityLog->log('tasks.updated', "Updated task {$task->reference}", $task);

        $fresh = $task->fresh(['assignee']);
        $newAssigneeId = (int) $fresh->assigned_to;

        if ($newAssigneeId && $newAssigneeId !== $previousAssigneeId) {
            $this->notifyAssignee($fresh, auth()->user() ?? $fresh->creator, assigned: true);
        }

        return $fresh;
    }

    public function updateStatus(Task $task, string $status): Task
    {
        if (! in_array($status, Task::STATUSES, true)) {
            throw ValidationException::withMessages(['status' => 'Invalid task status.']);
        }

        $task->update([
            'status' => $status,
            'completed_at' => $status === 'done' ? now() : null,
        ]);

        $this->activityLog->log('tasks.status_changed', "Task {$task->reference} → {$status}", $task);

        return $task->fresh();
    }

    public function comment(Task $task, User $user, string $body): TaskComment
    {
        if ($task->status === 'cancelled') {
            throw ValidationException::withMessages([
                'body' => 'Cannot comment on a cancelled task.',
            ]);
        }

        $comment = TaskComment::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => $body,
        ]);

        $this->activityLog->log('tasks.commented', "Commented on {$task->reference}", $task);

        $mentioned = $this->resolveMentions($body, $user->id);
        if ($mentioned->isNotEmpty()) {
            $link = url(route('tasks.show', $task, false));
            $snippet = mb_strimwidth(trim(preg_replace('/\s+/', ' ', $body) ?? $body), 0, 140, '…');

            app(AppNotificationService::class)->notifyMany(
                $mentioned,
                'task.mentioned',
                "You were mentioned on {$task->reference}",
                "{$user->name} mentioned you on {$task->reference}: {$snippet}",
                $link,
                "task-mention-{$task->id}-{$comment->id}",
                ['task_id' => $task->id, 'comment_id' => $comment->id],
            );
        }

        return $comment;
    }

    /**
     * Resolve @Name / @email mentions from comment body to active staff users.
     *
     * @return Collection<int, User>
     */
    public function resolveMentions(string $body, ?int $exceptUserId = null): Collection
    {
        if (! str_contains($body, '@')) {
            return collect();
        }

        $staff = User::query()
            ->where('is_active', true)
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'customer'))
            ->get(['id', 'name', 'email'])
            ->sortByDesc(fn (User $user) => mb_strlen($user->name))
            ->values();

        $matched = collect();

        foreach ($staff as $user) {
            $namePattern = '/@'.preg_quote($user->name, '/').'(?!\w)/iu';
            if (preg_match($namePattern, $body)) {
                $matched->push($user);

                continue;
            }

            $local = strstr((string) $user->email, '@', true) ?: '';
            if ($local !== '' && preg_match('/@'.preg_quote($local, '/').'(?!\w)/iu', $body)) {
                $matched->push($user);
            }
        }

        return $matched
            ->unique('id')
            ->reject(fn (User $user) => $exceptUserId && (int) $user->id === (int) $exceptUserId)
            ->values();
    }

    private function notifyAssignee(Task $task, ?User $actor, bool $assigned): void
    {
        if (! $assigned || ! $task->assignee) {
            return;
        }

        if ($actor && (int) $task->assigned_to === (int) $actor->id) {
            return;
        }

        $actorName = $actor?->name ?? 'A colleague';
        $link = url(route('tasks.show', $task, false));

        app(AppNotificationService::class)->notify(
            $task->assignee,
            'task.assigned',
            "Task assigned: {$task->reference}",
            "{$actorName} assigned you {$task->reference} — {$task->title}.",
            $link,
            "task-assigned-{$task->id}-{$task->assigned_to}",
            ['task_id' => $task->id],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeRelated(array $data): array
    {
        $key = $data['related_key'] ?? null;
        unset($data['related_key']);

        if ($key && isset(Task::RELATED_TYPES[$key], $data['related_id'])) {
            $data['related_type'] = Task::RELATED_TYPES[$key];
        } elseif (array_key_exists('related_id', $data) && blank($data['related_id'])) {
            $data['related_type'] = null;
            $data['related_id'] = null;
        }

        return $data;
    }
}
