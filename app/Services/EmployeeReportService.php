<?php

namespace App\Services;

use App\Models\EmployeeReport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class EmployeeReportService
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function nextReference(string $periodType): string
    {
        $prefix = match ($periodType) {
            'daily' => 'DR',
            'monthly' => 'MR',
            default => 'WR',
        };
        $year = now()->format('Y');

        $latest = EmployeeReport::query()
            ->where('reference', 'like', "{$prefix}-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $year, $sequence);
    }

    /**
     * @return array{period_type: string, period_start: string, period_end: string, title: string}
     */
    public function defaultPeriod(string $periodType, ?Carbon $anchor = null): array
    {
        $anchor ??= now();

        if ($periodType === 'daily') {
            $start = $anchor->copy()->startOfDay();
            $end = $start->copy();
            $title = 'Daily report — '.$start->format('d M Y');
        } elseif ($periodType === 'monthly') {
            $start = $anchor->copy()->startOfMonth();
            $end = $anchor->copy()->endOfMonth();
            $title = 'Monthly report — '.$start->format('F Y');
        } else {
            $start = $anchor->copy()->startOfWeek(Carbon::MONDAY);
            $end = $anchor->copy()->endOfWeek(Carbon::SUNDAY);
            $title = 'Weekly report — '.$start->format('d M').' to '.$end->format('d M Y');
        }

        return [
            'period_type' => $periodType,
            'period_start' => $start->toDateString(),
            'period_end' => $end->toDateString(),
            'title' => $title,
        ];
    }

    public function create(User $user, array $data): EmployeeReport
    {
        $data = $this->normalizePeriod($data);
        $this->assertUniquePeriod($user->id, $data['period_type'], $data['period_start']);

        $report = EmployeeReport::query()->create([
            ...$data,
            'accomplishments' => $data['accomplishments'] ?? '',
            'reference' => $this->nextReference($data['period_type']),
            'user_id' => $user->id,
            'department_id' => $data['department_id'] ?? $user->department_id,
            'branch_id' => $data['branch_id'] ?? $user->branch_id,
            'status' => 'draft',
        ]);

        $this->activityLog->log('reports.created', "Created report {$report->reference}", $report);

        return $report;
    }

    public function update(EmployeeReport $report, array $data): EmployeeReport
    {
        if (! $report->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Only draft or revision-requested reports can be edited.',
            ]);
        }

        $data = $this->normalizePeriod($data);

        if (
            ($data['period_type'] ?? $report->period_type) !== $report->period_type
            || ($data['period_start'] ?? $report->period_start->toDateString()) !== $report->period_start->toDateString()
        ) {
            $this->assertUniquePeriod(
                $report->user_id,
                $data['period_type'] ?? $report->period_type,
                $data['period_start'] ?? $report->period_start->toDateString(),
                $report->id,
            );
        }

        $report->update($data);
        $this->activityLog->log('reports.updated', "Updated report {$report->reference}", $report);

        return $report->fresh();
    }

    public function submit(EmployeeReport $report): EmployeeReport
    {
        if (! $report->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Only draft or revision-requested reports can be submitted.',
            ]);
        }

        if (blank($report->accomplishments)) {
            throw ValidationException::withMessages([
                'accomplishments' => 'Add accomplishments before submitting.',
            ]);
        }

        $report->update([
            'status' => 'submitted',
            'submitted_at' => now(),
            'reviewed_by' => null,
            'reviewed_at' => null,
            'reviewer_notes' => $report->status === 'revision_requested' ? $report->reviewer_notes : null,
        ]);

        $this->activityLog->log('reports.submitted', "Submitted report {$report->reference}", $report);

        $fresh = $report->fresh(['author:id,name']);
        $authorName = $fresh->author?->name ?? 'An employee';
        $period = match ($fresh->period_type) {
            'daily' => 'daily',
            'monthly' => 'monthly',
            default => 'weekly',
        };
        $link = url(route('reports.show', $fresh, false));

        app(AppNotificationService::class)->notifyMany(
            app(AppNotificationService::class)->usersWithPermission('reports.weekly.review'),
            'report.submitted',
            "New {$period} report: {$fresh->reference}",
            "{$authorName} submitted {$fresh->reference} — {$fresh->title}.",
            $link,
            "report-submitted-{$fresh->id}-{$fresh->submitted_at?->timestamp}",
            ['employee_report_id' => $fresh->id],
            true,
            $fresh->user_id,
        );

        return $fresh;
    }

    public function review(EmployeeReport $report, User $reviewer, string $decision, ?string $notes = null): EmployeeReport
    {
        if (! $report->isReviewable()) {
            throw ValidationException::withMessages([
                'status' => 'Only submitted reports can be reviewed.',
            ]);
        }

        if (! in_array($decision, ['approved', 'rejected', 'revision_requested'], true)) {
            throw ValidationException::withMessages([
                'decision' => 'Invalid review decision.',
            ]);
        }

        if (in_array($decision, ['rejected', 'revision_requested'], true) && blank($notes)) {
            throw ValidationException::withMessages([
                'reviewer_notes' => 'Add notes when rejecting or requesting revision.',
            ]);
        }

        $report->update([
            'status' => $decision,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'reviewer_notes' => $notes,
        ]);

        $this->activityLog->log(
            'reports.reviewed',
            "Reviewed report {$report->reference} as {$decision}",
            $report,
            ['decision' => $decision],
        );

        return $report->fresh();
    }

    /**
     * A daily report covers one date. Weekly and monthly reports keep the range the author chose.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePeriod(array $data): array
    {
        if (($data['period_type'] ?? null) === 'daily' && isset($data['period_start'])) {
            $data['period_end'] = $data['period_start'];
        }

        return $data;
    }

    private function assertUniquePeriod(int $userId, string $periodType, string $periodStart, ?int $ignoreId = null): void
    {
        $exists = EmployeeReport::query()
            ->where('user_id', $userId)
            ->where('period_type', $periodType)
            ->whereDate('period_start', $periodStart)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'period_start' => 'You already have a report for this period.',
            ]);
        }
    }
}
