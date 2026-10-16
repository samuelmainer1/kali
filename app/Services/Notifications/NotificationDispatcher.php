<?php

namespace App\Services\Notifications;

use InvalidArgumentException;

/**
 * Resolves notification channels by name for future multi-channel dispatch.
 */
class NotificationDispatcher
{
    /** @var array<string, NotificationChannel> */
    private array $channels = [];

    public function __construct(
        EmailChannel $email,
        WhatsAppChannel $whatsapp,
        SmsChannel $sms,
    ) {
        foreach ([$email, $whatsapp, $sms] as $channel) {
            $this->channels[$channel->name()] = $channel;
        }
    }

    public function via(string $channel): NotificationChannel
    {
        if (! isset($this->channels[$channel])) {
            throw new InvalidArgumentException("Unknown notification channel [{$channel}].");
        }

        return $this->channels[$channel];
    }

    /**
     * @param  list<string>  $channels
     * @param  array<string, mixed>  $payload
     */
    public function send(array $channels, string $to, string $subject, string $message, array $payload = []): void
    {
        foreach ($channels as $channel) {
            $this->via($channel)->send($to, $subject, $message, $payload);
        }
    }
}
