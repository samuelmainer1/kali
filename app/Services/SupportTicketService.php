<?php

namespace App\Services;

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SupportTicketService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = SupportTicket::query()
            ->where('reference', 'like', "TK-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('TK-%s-%04d', $year, $sequence);
    }

    public function create(User $user, array $data): SupportTicket
    {
        $ticket = SupportTicket::query()->create([
            ...$data,
            'reference' => $this->nextReference(),
            'requester_id' => $user->id,
            'status' => 'open',
        ]);

        $this->activityLog->log('support.created', "Opened ticket {$ticket->reference}", $ticket);

        return $ticket;
    }

    public function update(SupportTicket $ticket, array $data): SupportTicket
    {
        if (isset($data['status'])) {
            $data = [...$data, ...$this->statusTimestamps($data['status'], $ticket)];
        }

        $ticket->update($data);
        $this->activityLog->log('support.updated', "Updated ticket {$ticket->reference}", $ticket);

        return $ticket->fresh();
    }

    public function reply(SupportTicket $ticket, User $user, string $body, bool $internal = false): SupportTicketReply
    {
        if (in_array($ticket->status, ['closed'], true)) {
            throw ValidationException::withMessages([
                'body' => 'Closed tickets cannot receive new replies.',
            ]);
        }

        $reply = SupportTicketReply::query()->create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $body,
            'is_internal' => $internal,
        ]);

        if (! $internal && $ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        $this->activityLog->log(
            'support.replied',
            ($internal ? 'Internal note on ' : 'Replied to ').$ticket->reference,
            $ticket,
        );

        return $reply;
    }

    /**
     * @return array{resolved_at?: mixed, closed_at?: mixed}
     */
    private function statusTimestamps(string $status, SupportTicket $ticket): array
    {
        return match ($status) {
            'resolved' => [
                'resolved_at' => $ticket->resolved_at ?? now(),
                'closed_at' => null,
            ],
            'closed' => [
                'resolved_at' => $ticket->resolved_at ?? now(),
                'closed_at' => now(),
            ],
            default => [
                'resolved_at' => null,
                'closed_at' => null,
            ],
        };
    }
}
