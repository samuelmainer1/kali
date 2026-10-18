<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email channel — production-ready wiring; uses Laravel Mail.
 */
class EmailChannel implements NotificationChannel
{
    public function name(): string
    {
        return 'email';
    }

    public function send(string $to, string $subject, string $message, array $payload = []): void
    {
        // Lightweight placeholder until dedicated Mailable classes exist per module.
        Log::info('Email notification queued', compact('to', 'subject', 'message', 'payload'));

        if (! config('mail.default')) {
            return;
        }

        Mail::raw($message, function ($mail) use ($to, $subject) {
            $mail->to($to)->subject($subject);
        });
    }
}
