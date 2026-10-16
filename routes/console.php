<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('invoices:flag-overdue')->dailyAt('08:00');

// Staff reminders (Africa/Nairobi local time via app timezone)
Schedule::command('reminders:missing-weekly-reports')->weeklyOn(5, '15:00'); // Friday 3pm
Schedule::command('reminders:pending-leave')->dailyAt('08:00');
Schedule::command('reminders:leave-starts-tomorrow')->dailyAt('17:00');
