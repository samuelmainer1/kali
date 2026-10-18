<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ChatService
{
    public function __construct(private readonly AppNotificationService $notifications) {}

    /**
     * @return Collection<int, User>
     */
    public function recipients(User $actor): Collection
    {
        return User::query()
            ->where('is_active', true)
            ->where('id', '!=', $actor->id)
            ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'customer'))
            ->orderBy('name')
            ->get(['id', 'name', 'department_id']);
    }

    /**
     * @return Collection<int, Department>
     */
    public function departments(): Collection
    {
        return Department::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function conversationsFor(User $user): Collection
    {
        return Conversation::query()
            ->visibleTo($user)
            ->with([
                'department:id,name',
                'participants.user:id,name',
                'latestMessage.sender:id,name',
            ])
            ->latest('updated_at')
            ->get();
    }

    public function startDirect(User $actor, User $other, string $body): Conversation
    {
        $conversation = Conversation::query()->firstOrCreate(
            ['direct_key' => Conversation::directKey($actor->id, $other->id)],
            [
                'type' => Conversation::TYPE_DIRECT,
                'created_by' => $actor->id,
            ],
        );

        $this->ensureParticipant($conversation, $actor);
        $this->ensureParticipant($conversation, $other);
        $this->post($conversation, $actor, $body);

        return $conversation;
    }

    public function startDepartment(User $actor, Department $department, string $body): Conversation
    {
        $conversation = Conversation::query()->firstOrCreate(
            ['department_id' => $department->id],
            [
                'type' => Conversation::TYPE_DEPARTMENT,
                'created_by' => $actor->id,
            ],
        );

        $this->ensureParticipant($conversation, $actor);
        $this->post($conversation, $actor, $body);

        return $conversation;
    }

    public function post(Conversation $conversation, User $actor, string $body): ChatMessage
    {
        $message = $conversation->messages()->create([
            'user_id' => $actor->id,
            'body' => trim($body),
        ]);

        $conversation->touch();
        $this->ensureParticipant($conversation, $actor);
        $this->markRead($conversation, $actor);
        $this->notify($conversation, $actor, $message);

        return $message;
    }

    public function canAccess(User $user, Conversation $conversation): bool
    {
        if (! $user->can('chat.use')) {
            return false;
        }

        if ($conversation->participants()->where('user_id', $user->id)->exists()) {
            return true;
        }

        return $conversation->type === Conversation::TYPE_DEPARTMENT
            && $conversation->department_id
            && (int) $user->department_id === (int) $conversation->department_id;
    }

    public function markRead(Conversation $conversation, User $user): void
    {
        $participant = $this->ensureParticipant($conversation, $user);
        $participant->forceFill(['last_read_at' => now()])->save();
    }

    public function unreadCount(User $user): int
    {
        return $this->conversationsFor($user)->sum(fn (Conversation $conversation) => $this->unreadFor($user, $conversation));
    }

    public function unreadFor(User $user, Conversation $conversation): int
    {
        $readAt = $conversation->relationLoaded('participants')
            ? $conversation->participants->firstWhere('user_id', $user->id)?->last_read_at
            : $conversation->participants()->where('user_id', $user->id)->value('last_read_at');

        return ChatMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', '!=', $user->id)
            ->when($readAt, fn ($query) => $query->where('created_at', '>', $readAt))
            ->count();
    }

    public function titleFor(Conversation $conversation, User $viewer): string
    {
        if ($conversation->type === Conversation::TYPE_DEPARTMENT) {
            return $conversation->department?->name ?? 'Department';
        }

        $other = $conversation->participants->first(fn ($participant) => (int) $participant->user_id !== (int) $viewer->id);

        return $other?->user?->name ?? 'Conversation';
    }

    private function ensureParticipant(Conversation $conversation, User $user): ConversationParticipant
    {
        return $conversation->participants()->firstOrCreate([
            'user_id' => $user->id,
        ]);
    }

    private function notify(Conversation $conversation, User $sender, ChatMessage $message): void
    {
        $participantIds = $conversation->participants()->pluck('user_id');

        if ($conversation->type === Conversation::TYPE_DEPARTMENT && $conversation->department_id) {
            $memberIds = User::query()
                ->where('department_id', $conversation->department_id)
                ->where('is_active', true)
                ->pluck('id');
            $participantIds = $participantIds->merge($memberIds);
        }

        $recipients = User::query()
            ->whereIn('id', $participantIds->unique()->all())
            ->where('id', '!=', $sender->id)
            ->where('is_active', true)
            ->get();

        $title = $conversation->type === Conversation::TYPE_DEPARTMENT
            ? 'New department message'
            : 'New message from '.$sender->name;

        $this->notifications->notifyMany(
            $recipients,
            'chat.message',
            $title,
            $sender->name.': '.Str::limit($message->body, 140),
            route('chat.show', $conversation),
            'chat-'.$conversation->id,
            ['conversation_id' => $conversation->id],
            false,
            $sender->id,
        );
    }
}
