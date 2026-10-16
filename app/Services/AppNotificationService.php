<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AppNotificationService
{
    public function __construct(private readonly NotificationDispatcher $dispatcher)
    {
    }

    /**
     * @param  iterable<User>|Collection<int, User>  $users
     * @param  array<string, mixed>  $data
     */
    public function notifyMany(
        iterable $users,
        string $type,
        string $title,
        string $body,
        ?string $link = null,
        ?string $dedupeKey = null,
        array $data = [],
        bool $email = true,
        ?int $exceptUserId = null,
    ): void {
        foreach ($users as $user) {
            if (! $user instanceof User) {
                continue;
            }

            if ($exceptUserId && (int) $user->id === (int) $exceptUserId) {
                continue;
            }

            $this->notify($user, $type, $title, $body, $link, $dedupeKey, $data, $email);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notify(
        User $user,
        string $type,
        string $title,
        string $body,
        ?string $link = null,
        ?string $dedupeKey = null,
        array $data = [],
        bool $email = true,
    ): ?UserNotification {
        $notification = null;

        if ($dedupeKey) {
            $notification = UserNotification::query()
                ->where('user_id', $user->id)
                ->where('dedupe_key', $dedupeKey)
                ->first();
        }

        if ($notification) {
            $notification->update([
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'data' => $data,
                'read_at' => null,
            ]);
        } else {
            $notification = UserNotification::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'dedupe_key' => $dedupeKey,
                'data' => $data,
            ]);
        }

        if ($email && $user->email) {
            try {
                $this->dispatcher->via('email')->send(
                    $user->email,
                    $title,
                    $body.($link ? "\n\nOpen: {$link}" : ''),
                    ['type' => $type, 'notification_id' => $notification->id],
                );
                $notification->update(['emailed_at' => now()]);
            } catch (\Throwable $e) {
                Log::warning('Failed to email notification', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $notification;
    }

    public function usersWithPermission(string $permission): Collection
    {
        return User::permission($permission)
            ->where('is_active', true)
            ->get();
    }

    public function unreadCount(User $user): int
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * @return Collection<int, UserNotification>
     */
    public function unreadPreview(User $user, int $limit = 8): Collection
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function markRead(UserNotification $notification, User $user): void
    {
        if ((int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }
    }

    public function markAllRead(User $user): void
    {
        UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
