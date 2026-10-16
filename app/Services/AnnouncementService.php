<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AnnouncementService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = Announcement::query()
            ->where('reference', 'like', "AN-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('AN-%s-%04d', $year, $sequence);
    }

    public function create(User $user, array $data): Announcement
    {
        $this->assertAudienceRules($data);

        $announcement = Announcement::query()->create([
            ...$data,
            'reference' => $this->nextReference(),
            'created_by' => $user->id,
            'published_at' => ($data['is_published'] ?? true) ? ($data['published_at'] ?? now()) : null,
        ]);

        $this->activityLog->log('announcements.created', "Created announcement {$announcement->reference}", $announcement);

        return $announcement;
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $this->assertAudienceRules($data);

        if (($data['is_published'] ?? $announcement->is_published) && empty($data['published_at']) && ! $announcement->published_at) {
            $data['published_at'] = now();
        }

        $announcement->update($data);
        $this->activityLog->log('announcements.updated', "Updated announcement {$announcement->reference}", $announcement);

        return $announcement->fresh();
    }

    public function markRead(Announcement $announcement, User $user): void
    {
        AnnouncementRead::query()->updateOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
            ],
            ['read_at' => now()],
        );
    }

    public function canView(User $user): bool
    {
        // Every internal employee role can read announcements.
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

    public function visibleQuery(User $user): Builder
    {
        return Announcement::query()
            ->active()
            ->visibleTo($user);
    }

    public function unreadCount(User $user): int
    {
        if (! $this->canView($user)) {
            return 0;
        }

        return $this->visibleQuery($user)
            ->whereDoesntHave('reads', fn (Builder $q) => $q->where('user_id', $user->id))
            ->count();
    }

    /**
     * @return Collection<int, Announcement>
     */
    public function unreadPreview(User $user, int $limit = 5): Collection
    {
        if (! $this->canView($user)) {
            return collect();
        }

        return $this->visibleQuery($user)
            ->whereDoesntHave('reads', fn (Builder $q) => $q->where('user_id', $user->id))
            ->orderByDesc('is_urgent')
            ->latest('published_at')
            ->limit($limit)
            ->get(['id', 'title', 'type', 'is_urgent', 'published_at', 'department_id']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertAudienceRules(array $data): void
    {
        if (($data['type'] ?? null) === 'department' && empty($data['department_id'])) {
            throw ValidationException::withMessages([
                'department_id' => 'Choose a department for department announcements.',
            ]);
        }
    }
}
