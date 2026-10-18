<?php

namespace App\Services;

use App\Models\EmployeeReport;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;

class ReminderService
{
    public function __construct(private readonly AppNotificationService $notifications)
    {
    }

    /**
     * Remind staff who have not submitted this week's weekly report.
     */
    public function remindMissingWeeklyReports(?Carbon $anchor = null): int
    {
        $anchor ??= now();
        $periodStart = $anchor->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $periodEnd = $anchor->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();

        $submittedUserIds = EmployeeReport::query()
            ->where('period_type', 'weekly')
            ->whereDate('period_start', $periodStart)
            ->whereIn('status', ['submitted', 'approved'])
            ->pluck('user_id')
            ->all();

        $staff = User::query()
            ->permission('reports.weekly.submit')
            ->where('is_active', true)
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'customer'))
            ->whereNotIn('id', $submittedUserIds)
            ->get();

        $title = 'Reminder: weekly report due';
        $body = "Please submit your weekly report for {$periodStart} to {$periodEnd}.";
        $link = url(route('reports.create', ['period_type' => 'weekly'], false));
        $dedupe = 'report-reminder-weekly-'.$periodStart;

        $this->notifications->notifyMany(
            $staff,
            'reminder.report.weekly',
            $title,
            $body,
            $link,
            $dedupe,
            ['period_start' => $periodStart, 'period_end' => $periodEnd],
        );

        return $staff->count();
    }

    /**
     * Remind approvers about leave still pending longer than $hours.
     */
    public function remindPendingLeaveApprovals(int $hours = 24): int
    {
        $cutoff = now()->subHours($hours);

        $pending = LeaveRequest::query()
            ->with(['requester:id,name', 'leaveType:id,name'])
            ->where('status', 'pending')
            ->where('created_at', '<=', $cutoff)
            ->orderBy('created_at')
            ->get();

        if ($pending->isEmpty()) {
            return 0;
        }

        $approvers = $this->notifications->usersWithPermission('leave.approve');
        if ($approvers->isEmpty()) {
            return 0;
        }

        $count = $pending->count();
        $oldest = $pending->first();
        $title = $count === 1
            ? 'Leave request still waiting for approval'
            : "{$count} leave requests still waiting for approval";
        $body = $count === 1
            ? ($oldest->requester?->name ?? 'An employee')." requested {$oldest->leaveType?->name} leave more than {$hours} hours ago."
            : "There are {$count} leave requests pending for more than {$hours} hours. Oldest: {$oldest->reference}.";
        $link = url(route('approvals.index', ['type' => 'leave'], false));
        $dedupe = 'leave-reminder-pending-'.now()->toDateString();

        $this->notifications->notifyMany(
            $approvers,
            'reminder.leave.pending',
            $title,
            $body,
            $link,
            $dedupe,
            ['count' => $count, 'hours' => $hours],
        );

        return $count;
    }

    /**
     * Remind employees whose approved leave starts tomorrow.
     */
    public function remindLeaveStartingTomorrow(?Carbon $anchor = null): int
    {
        $anchor ??= now();
        $tomorrow = $anchor->copy()->addDay()->toDateString();

        $requests = LeaveRequest::query()
            ->with(['requester', 'leaveType:id,name'])
            ->where('status', 'approved')
            ->whereDate('start_date', $tomorrow)
            ->get();

        $sent = 0;
        foreach ($requests as $request) {
            if (! $request->requester) {
                continue;
            }

            $this->notifications->notify(
                $request->requester,
                'reminder.leave.starts_tomorrow',
                "Leave starts tomorrow: {$request->reference}",
                "Your {$request->leaveType?->name} leave starts tomorrow ({$request->start_date?->toDateString()} – {$request->end_date?->toDateString()}).",
                url(route('leave.show', $request, false)),
                "leave-starts-tomorrow-{$request->id}-{$tomorrow}",
                ['leave_request_id' => $request->id],
            );
            $sent++;
        }

        return $sent;
    }
}
