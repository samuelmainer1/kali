<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class RemindMissingWeeklyReports extends Command
{
    protected $signature = 'reminders:missing-weekly-reports';

    protected $description = 'Notify staff who have not submitted this week\'s weekly report';

    public function handle(ReminderService $reminders): int
    {
        $count = $reminders->remindMissingWeeklyReports();
        $this->info("Sent weekly report reminders to {$count} staff member(s).");

        return self::SUCCESS;
    }
}
