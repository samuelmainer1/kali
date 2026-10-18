<?php

namespace App\Services\Notifications;

/**
 * Contract for outbound notification channels (email, WhatsApp, SMS).
 */
interface NotificationChannel
{
    /**
     * Send a notification payload to a recipient address/identifier.
     *
     * @param  array<string, mixed>  $payload
     */
    public function send(string $to, string $subject, string $message, array $payload = []): void;

    public function name(): string;
}
