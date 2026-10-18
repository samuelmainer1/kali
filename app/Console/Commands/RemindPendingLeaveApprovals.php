<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class RemindPendingLeaveApprovals extends Command
{
    protected $signature = 'reminders:pending-leave {--hours=24 : Hours a request can wait before reminding}';

    protected $description = 'Notify leave approvers about requests pending too long';

    public function handle(ReminderService $reminders): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $count = $reminders->remindPendingLeaveApprovals($hours);
        $this->info("Reminded approvers about {$count} pending leave request(s).");

        return self::SUCCESS;
    }
}
