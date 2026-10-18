<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0B1220; font-size: 12px; }
        h1 { font-size: 22px; margin: 0; }
        h2 { font-size: 14px; margin-bottom: 4px; }
        .muted { color: #64748b; }
        .block { margin-top: 14px; }
    </style>
</head>
<body>
    <h1>{{ $company->company_name }}</h1>
    <p class="muted">
        {{ $company->address }}<br>
        {{ $company->phone }} · {{ $company->email }}
    </p>
    <h2>{{ $report->reference }} — {{ $report->title }}</h2>
    <p class="muted">
        {{ $report->author?->name ?: '—' }}
        · {{ ucfirst($report->period_type) }}
        {{ $report->period_start?->toDateString() }} – {{ $report->period_end?->toDateString() }}<br>
        Status: {{ str_replace('_', ' ', $report->status) }}
        @if ($report->department) · {{ $report->department->name }} @endif
        @if ($report->branch) · {{ $report->branch->name }} @endif
    </p>
    <div class="block">
        <h2>Accomplishments</h2>
        <p>{{ $report->accomplishments ?: '—' }}</p>
    </div>
    <div class="block">
        <h2>Challenges</h2>
        <p>{{ $report->challenges ?: '—' }}</p>
    </div>
    <div class="block">
        <h2>Next plans</h2>
        <p>{{ $report->next_plans ?: '—' }}</p>
    </div>
    @if ($report->reviewer_notes)
        <div class="block">
            <h2>Reviewer notes</h2>
            <p>{{ $report->reviewer?->name }}: {{ $report->reviewer_notes }}</p>
        </div>
    @endif
</body>
</html>
