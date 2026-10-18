<?php

namespace App\Services;

use App\Models\Department;
use App\Models\ItRequest;
use App\Models\User;

class ItRequestService
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly AppNotificationService $notifications,
    ) {}

    public function department(): Department
    {
        return Department::query()->firstOrCreate(
            ['code' => 'MKT'],
            [
                'name' => 'IT & Marketing',
                'description' => 'IT support, brand, and growth',
                'is_active' => true,
            ],
        );
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = ItRequest::query()
            ->where('reference', 'like', "IT-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('IT-%s-%04d', $year, $sequence);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): ItRequest
    {
        $department = $this->department();

        $request = ItRequest::query()->create([
            ...$data,
            'reference' => $this->nextReference(),
            'user_id' => $user->id,
            'department_id' => $department->id,
            'status' => 'open',
        ]);

        $this->activityLog->log('it.requested', "Opened IT request {$request->reference}", $request);

        $link = url(route('it.requests.show', $request, false));
        $this->notifications->notifyMany(
            $this->notifications->usersWithPermission('it.manage'),
            'it.requested',
            "New IT request: {$request->reference}",
            "{$user->name} sent {$request->title} to IT & Marketing.",
            $link,
            "it-requested-{$request->id}",
            ['it_request_id' => $request->id],
            true,
            $user->id,
        );

        return $request;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ItRequest $request, User $actor, array $data): ItRequest
    {
        if (in_array($data['status'], ['resolved', 'closed'], true) && ! $request->resolved_at) {
            $data['resolved_at'] = now();
        }

        if (! in_array($data['status'], ['resolved', 'closed'], true)) {
            $data['resolved_at'] = null;
        }

        $request->update($data);
        $this->activityLog->log('it.updated', "Updated IT request {$request->reference}", $request, [
            'status' => $data['status'],
            'actor_id' => $actor->id,
        ]);

        return $request->fresh();
    }
}
