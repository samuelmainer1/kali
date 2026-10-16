<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;

/**
 * Future SMS gateway adapter. Architecture-ready stub.
 */
class SmsChannel implements NotificationChannel
{
    public function name(): string
    {
        return 'sms';
    }

    public function send(string $to, string $subject, string $message, array $payload = []): void
    {
        Log::info('SMS channel stub invoked', [
            'to' => $to,
            'subject' => $subject,
            'message' => $message,
            'payload' => $payload,
            'status' => 'not_configured',
        ]);
    }
}
