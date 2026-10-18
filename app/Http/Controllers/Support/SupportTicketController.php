<?php

namespace App\Http\Controllers\Support;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Shipment;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\SupportTicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    public function __construct(private readonly SupportTicketService $tickets)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user->can('support.manage');

        $tickets = SupportTicket::query()
            ->with(['requester:id,name', 'assignee:id,name', 'customer:id,name'])
            ->when(! $canManage, fn ($q) => $q->where('requester_id', $user->id))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->string('priority')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (SupportTicket $ticket) => $this->listPayload($ticket));

        return Inertia::render('Support/Index', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status', 'priority']),
            'canManage' => $canManage,
            'statuses' => SupportTicket::STATUSES,
            'priorities' => SupportTicket::PRIORITIES,
            'stats' => [
                'open' => SupportTicket::query()->whereIn('status', ['open', 'in_progress', 'waiting_customer'])->when(! $canManage, fn ($q) => $q->where('requester_id', $user->id))->count(),
                'urgent' => SupportTicket::query()->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->when(! $canManage, fn ($q) => $q->where('requester_id', $user->id))->count(),
                'resolved' => SupportTicket::query()->where('status', 'resolved')->when(! $canManage, fn ($q) => $q->where('requester_id', $user->id))->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Support/Form', [
            'ticket' => null,
            'customers' => $user->can('customers.view')
                ? Customer::query()->orderBy('name')->limit(100)->get(['id', 'name'])
                : [],
            'shipments' => $user->can('shipments.view')
                ? Shipment::query()->latest()->limit(50)->get(['id', 'reference', 'status'])
                : [],
            'priorities' => SupportTicket::PRIORITIES,
            'categories' => SupportTicket::CATEGORIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::in(SupportTicket::PRIORITIES)],
            'category' => ['required', Rule::in(SupportTicket::CATEGORIES)],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'shipment_id' => ['nullable', 'exists:shipments,id'],
        ]);

        $ticket = $this->tickets->create($request->user(), $data);

        return redirect()
            ->route('support.show', $ticket)
            ->with('success', 'Support ticket created.');
    }

    public function show(Request $request, SupportTicket $ticket): Response
    {
        $this->authorizeView($request->user(), $ticket);
        $canManage = $request->user()->can('support.manage');

        $ticket->load([
            'requester:id,name,email',
            'assignee:id,name',
            'customer:id,name',
            'shipment:id,reference,status',
            'replies.author:id,name',
        ]);

        $replies = $ticket->replies
            ->filter(fn ($reply) => $canManage || ! $reply->is_internal)
            ->values()
            ->map(fn ($reply) => [
                'id' => $reply->id,
                'body' => $reply->body,
                'is_internal' => $reply->is_internal,
                'author' => $reply->author?->name,
                'created_at' => $reply->created_at?->diffForHumans(),
                'created_at_full' => $reply->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('Support/Show', [
            'ticket' => [
                ...$this->listPayload($ticket),
                'description' => $ticket->description,
                'category' => $ticket->category,
                'requester' => $ticket->requester?->only(['id', 'name', 'email']),
                'assignee' => $ticket->assignee?->only(['id', 'name']),
                'customer' => $ticket->customer?->only(['id', 'name']),
                'shipment' => $ticket->shipment?->only(['id', 'reference', 'status']),
                'resolved_at' => $ticket->resolved_at?->toDateTimeString(),
                'closed_at' => $ticket->closed_at?->toDateTimeString(),
                'replies' => $replies,
            ],
            'canManage' => $canManage,
            'statuses' => SupportTicket::STATUSES,
            'priorities' => SupportTicket::PRIORITIES,
            'agents' => $canManage
                ? User::role(['customer_care', 'administrator', 'management'])->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    public function update(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_unless($request->user()->can('support.manage'), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(SupportTicket::STATUSES)],
            'priority' => ['required', Rule::in(SupportTicket::PRIORITIES)],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $this->tickets->update($ticket, $data);

        return back()->with('success', 'Ticket updated.');
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $this->authorizeView($request->user(), $ticket);

        $data = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        $internal = $request->boolean('is_internal');
        if ($internal && ! $request->user()->can('support.manage')) {
            abort(403);
        }

        $this->tickets->reply($ticket, $request->user(), $data['body'], $internal);

        return back()->with('success', $internal ? 'Internal note added.' : 'Reply posted.');
    }

    private function authorizeView(User $user, SupportTicket $ticket): void
    {
        if ($user->can('support.manage')) {
            return;
        }

        abort_unless($user->can('support.view') && $ticket->requester_id === $user->id, 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(SupportTicket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'reference' => $ticket->reference,
            'subject' => $ticket->subject,
            'status' => $ticket->status,
            'status_label' => SupportTicket::label($ticket->status),
            'priority' => $ticket->priority,
            'requester_name' => $ticket->requester?->name,
            'assignee_name' => $ticket->assignee?->name,
            'customer_name' => $ticket->customer?->name,
            'created_at' => $ticket->created_at?->toDateString(),
        ];
    }
}
