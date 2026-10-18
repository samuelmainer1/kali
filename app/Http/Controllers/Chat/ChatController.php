<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Department;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function __construct(private readonly ChatService $chat) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Chat/Index', [
            'conversations' => $this->chat->conversationsFor($user)->map(fn (Conversation $conversation) => $this->summary($conversation, $user))->values(),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Chat/Create', [
            'people' => $this->chat->recipients($request->user())->map(fn (User $person) => [
                'id' => $person->id,
                'name' => $person->name,
            ])->values(),
            'departments' => $this->chat->departments()->map(fn (Department $department) => [
                'id' => $department->id,
                'name' => $department->name,
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'audience' => ['required', Rule::in(['person', 'department'])],
            'user_id' => ['required_if:audience,person', 'nullable', 'exists:users,id'],
            'department_id' => ['required_if:audience,department', 'nullable', 'exists:departments,id'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $actor = $request->user();

        if ($data['audience'] === 'person') {
            $other = User::query()->findOrFail($data['user_id']);
            if ((int) $other->id === (int) $actor->id) {
                throw ValidationException::withMessages(['user_id' => 'Choose another person.']);
            }
            if (! $other->is_active || $other->hasRole('customer')) {
                throw ValidationException::withMessages(['user_id' => 'Choose a staff member.']);
            }

            $conversation = $this->chat->startDirect($actor, $other, $data['body']);
        } else {
            $department = Department::query()->where('is_active', true)->findOrFail($data['department_id']);
            $conversation = $this->chat->startDepartment($actor, $department, $data['body']);
        }

        return redirect()
            ->route('chat.show', $conversation)
            ->with('success', 'Message sent.');
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $user = $request->user();
        abort_unless($this->chat->canAccess($user, $conversation), 403);
        $this->chat->markRead($conversation, $user);

        $conversation->load([
            'department:id,name',
            'participants.user:id,name',
        ]);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->latest()
            ->limit(100)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'sender_name' => $message->sender?->name,
                'mine' => (int) $message->user_id === (int) $user->id,
                'created_at' => $message->created_at?->format('d M Y H:i'),
            ]);

        return Inertia::render('Chat/Show', [
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'title' => $this->chat->titleFor($conversation, $user),
                'description' => $conversation->type === Conversation::TYPE_DEPARTMENT
                    ? 'Everyone in this department can read this conversation.'
                    : 'Only you and this person can read this conversation.',
            ],
            'messages' => $messages,
        ]);
    }

    public function reply(Request $request, Conversation $conversation): RedirectResponse
    {
        $user = $request->user();
        abort_unless($this->chat->canAccess($user, $conversation), 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $this->chat->post($conversation, $user, $data['body']);

        return redirect()
            ->route('chat.show', $conversation)
            ->with('success', 'Message sent.');
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Conversation $conversation, User $user): array
    {
        $latest = $conversation->latestMessage;

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'title' => $this->chat->titleFor($conversation, $user),
            'preview' => $latest?->body,
            'sender_name' => $latest?->sender?->name,
            'unread' => $this->chat->unreadFor($user, $conversation),
            'updated_at' => $conversation->updated_at?->diffForHumans(),
        ];
    }
}
