<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;

/**
 * Future WhatsApp Business API adapter. Architecture-ready stub.
 */
class WhatsAppChannel implements NotificationChannel
{
    public function name(): string
    {
        return 'whatsapp';
    }

    public function send(string $to, string $subject, string $message, array $payload = []): void
    {
        Log::info('WhatsApp channel stub invoked', [
            'to' => $to,
            'subject' => $subject,
            'message' => $message,
            'payload' => $payload,
            'status' => 'not_configured',
        ]);
    }
}
