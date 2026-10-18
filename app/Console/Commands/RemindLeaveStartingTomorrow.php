<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class RemindLeaveStartingTomorrow extends Command
{
    protected $signature = 'reminders:leave-starts-tomorrow';

    protected $description = 'Notify employees whose approved leave starts tomorrow';

    public function handle(ReminderService $reminders): int
    {
        $count = $reminders->remindLeaveStartingTomorrow();
        $this->info("Sent leave-start reminders to {$count} employee(s).");

        return self::SUCCESS;
    }
}
