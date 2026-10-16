<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\EmployeeReport;
use App\Models\User;
use App\Services\EmployeeReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeReportController extends Controller
{
    public function __construct(private readonly EmployeeReportService $reports)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user->can('reports.view_all') || $user->can('reports.weekly.review');

        $reports = EmployeeReport::query()
            ->with(['author:id,name', 'department:id,name', 'branch:id,name', 'reviewer:id,name'])
            ->when(! $canViewAll, fn ($q) => $q->where('user_id', $user->id))
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhereHas('author', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('period_type'), fn ($q) => $q->where('period_type', $request->string('period_type')))
            ->when($request->filled('department_id') && $canViewAll, fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (EmployeeReport $report) => $this->listPayload($report));

        return Inertia::render('Reports/Index', [
            'reports' => $reports,
            'filters' => $request->only(['search', 'status', 'period_type', 'department_id']),
            'canViewAll' => $canViewAll,
            'statuses' => EmployeeReport::STATUSES,
            'periodTypes' => EmployeeReport::PERIOD_TYPES,
            'departments' => $canViewAll
                ? Department::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'stats' => [
                'my_drafts' => EmployeeReport::query()->where('user_id', $user->id)->whereIn('status', ['draft', 'revision_requested'])->count(),
                'pending_review' => EmployeeReport::query()->where('status', 'submitted')->when(! $canViewAll, fn ($q) => $q->where('user_id', $user->id))->count(),
                'approved' => EmployeeReport::query()->where('status', 'approved')->when(! $canViewAll, fn ($q) => $q->where('user_id', $user->id))->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $periodType = $request->string('period_type')->toString() ?: 'weekly';
        if (! in_array($periodType, EmployeeReport::PERIOD_TYPES, true)) {
            $periodType = 'weekly';
        }

        $defaults = $this->reports->defaultPeriod($periodType);

        return Inertia::render('Reports/Form', [
            'report' => null,
            'defaults' => $defaults,
            'periodTypes' => EmployeeReport::PERIOD_TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $shouldSubmit = $request->boolean('submit');
        $data = $this->validated($request, $shouldSubmit);
        $report = $this->reports->create($request->user(), $data);

        if ($shouldSubmit) {
            $this->reports->submit($report);
        }

        return redirect()
            ->route('reports.show', $report)
            ->with('success', $shouldSubmit ? 'Report submitted.' : 'Draft saved.');
    }

    public function show(Request $request, EmployeeReport $report): Response
    {
        $this->authorizeView($request->user(), $report);

        $report->load(['author:id,name,email', 'department:id,name', 'branch:id,name', 'reviewer:id,name']);

        return Inertia::render('Reports/Show', [
            'report' => [
                ...$this->listPayload($report),
                'accomplishments' => $report->accomplishments,
                'challenges' => $report->challenges,
                'next_plans' => $report->next_plans,
                'metrics' => $report->metrics,
                'submitted_at' => $report->submitted_at?->toDateTimeString(),
                'reviewed_at' => $report->reviewed_at?->toDateTimeString(),
                'reviewer_notes' => $report->reviewer_notes,
                'reviewer' => $report->reviewer?->only(['id', 'name']),
                'author' => $report->author?->only(['id', 'name', 'email']),
                'is_editable' => $report->isEditable(),
                'is_reviewable' => $report->isReviewable(),
                'is_owner' => $report->user_id === $request->user()->id,
            ],
        ]);
    }

    public function edit(Request $request, EmployeeReport $report): Response
    {
        $this->authorizeOwner($request->user(), $report);

        if (! $report->isEditable()) {
            return redirect()->route('reports.show', $report)->with('error', 'This report can no longer be edited.');
        }

        return Inertia::render('Reports/Form', [
            'report' => [
                'id' => $report->id,
                'period_type' => $report->period_type,
                'period_start' => $report->period_start?->toDateString(),
                'period_end' => $report->period_end?->toDateString(),
                'title' => $report->title,
                'accomplishments' => $report->accomplishments,
                'challenges' => $report->challenges,
                'next_plans' => $report->next_plans,
                'status' => $report->status,
            ],
            'defaults' => null,
            'periodTypes' => EmployeeReport::PERIOD_TYPES,
        ]);
    }

    public function update(Request $request, EmployeeReport $report): RedirectResponse
    {
        $this->authorizeOwner($request->user(), $report);
        $shouldSubmit = $request->boolean('submit');
        $data = $this->validated($request, $shouldSubmit);
        $report = $this->reports->update($report, $data);

        if ($shouldSubmit) {
            $this->reports->submit($report);
        }

        return redirect()
            ->route('reports.show', $report)
            ->with('success', $shouldSubmit ? 'Report submitted.' : 'Report updated.');
    }

    public function submit(Request $request, EmployeeReport $report): RedirectResponse
    {
        $this->authorizeOwner($request->user(), $report);
        $this->reports->submit($report);

        return back()->with('success', 'Report submitted for review.');
    }

    public function review(Request $request, EmployeeReport $report): RedirectResponse
    {
        abort_unless($request->user()->can('reports.weekly.review'), 403);

        $data = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected', 'revision_requested'])],
            'reviewer_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->reports->review(
            $report,
            $request->user(),
            $data['decision'],
            $data['reviewer_notes'] ?? null,
        );

        return back()->with('success', 'Review saved.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $shouldSubmit = false): array
    {
        return $request->validate([
            'period_type' => ['required', Rule::in(EmployeeReport::PERIOD_TYPES)],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'title' => ['required', 'string', 'max:255'],
            'accomplishments' => [$shouldSubmit ? 'required' : 'nullable', 'string'],
            'challenges' => ['nullable', 'string'],
            'next_plans' => ['nullable', 'string'],
        ]);
    }

    private function authorizeView(User $user, EmployeeReport $report): void
    {
        $canViewAll = $user->can('reports.view_all') || $user->can('reports.weekly.review');
        if ($report->user_id !== $user->id && ! $canViewAll) {
            abort(403);
        }
    }

    private function authorizeOwner(User $user, EmployeeReport $report): void
    {
        abort_unless($user->can('reports.weekly.submit'), 403);
        abort_unless($report->user_id === $user->id, 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function listPayload(EmployeeReport $report): array
    {
        return [
            'id' => $report->id,
            'reference' => $report->reference,
            'title' => $report->title,
            'period_type' => $report->period_type,
            'period_start' => $report->period_start?->toDateString(),
            'period_end' => $report->period_end?->toDateString(),
            'status' => $report->status,
            'status_label' => EmployeeReport::label($report->status),
            'author_name' => $report->author?->name,
            'department' => $report->department?->name,
            'branch' => $report->branch?->name,
            'created_at' => $report->created_at?->toDateString(),
        ];
    }
}
