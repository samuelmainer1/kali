<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Role-aware dashboard entry point. KPI values are placeholders until domain modules land.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user()->load(['department', 'branch']);
        $role = $user->primaryRole() ?? 'customer';

        $stats = $this->statsForRole($role, $user);
        $activity = ActivityLog::query()->with('user:id,name')->latest();

        if (! $user->hasRole('administrator')) {
            $activity->whereDoesntHave('user', function ($query) {
                $query->whereHas('roles', fn ($roles) => $roles->where('name', 'administrator'));
            });
        }

        $recentActivities = $activity
            ->limit(8)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user?->name,
                'created_at' => $log->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Dashboard/Index', [
            'role' => $role,
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'showRoadmap' => $role === 'administrator',
            'userSummary' => [
                'name' => $user->name,
                'department' => $user->department?->name,
                'branch' => $user->branch?->name,
                'role_label' => str_replace('_', ' ', $role),
            ],
        ]);
    }

    /**
     * Company-wide cards. Management sees the same board, without administrator accounts.
     *
     * @return list<array{label: string, value: string|int, hint: string}>
     */
    private function companyStats(User $viewer): array
    {
        return [
            ['label' => 'Total Users', 'value' => User::query()->visibleTo($viewer)->count(), 'hint' => 'Active directory'],
            ['label' => 'Active Shipments', 'value' => '—', 'hint' => 'Module pending'],
            ['label' => 'Quotations', 'value' => '—', 'hint' => 'Module pending'],
            ['label' => 'Weekly Reports', 'value' => '—', 'hint' => 'Module pending'],
            ['label' => 'Customers', 'value' => '—', 'hint' => 'CRM pending'],
            ['label' => 'Revenue (KES)', 'value' => '—', 'hint' => 'Placeholder'],
        ];
    }

    /**
     * Placeholder KPIs per role — replaced when CRM/Shipments/Finance modules ship.
     *
     * @return list<array{label: string, value: string|int, hint: string}>
     */
    private function statsForRole(string $role, User $viewer): array
    {
        return match ($role) {
            'administrator', 'management' => $this->companyStats($viewer),
            'sales' => [
                ['label' => 'Leads', 'value' => '—', 'hint' => 'This month'],
                ['label' => 'Quotations', 'value' => '—', 'hint' => 'Open'],
                ['label' => 'Customers', 'value' => '—', 'hint' => 'Assigned'],
                ['label' => 'Follow-ups', 'value' => '—', 'hint' => 'Due today'],
            ],
            'operations' => [
                ['label' => 'In Transit', 'value' => '—', 'hint' => 'Shipments'],
                ['label' => 'At Warehouse', 'value' => '—', 'hint' => 'Awaiting booking'],
                ['label' => 'Customs', 'value' => '—', 'hint' => 'Clearance'],
                ['label' => 'Delivered (7d)', 'value' => '—', 'hint' => 'Completed'],
            ],
            'warehouse' => [
                ['label' => 'Inventory Lots', 'value' => '—', 'hint' => 'On hand'],
                ['label' => 'Inbound', 'value' => '—', 'hint' => 'Today'],
                ['label' => 'Outbound', 'value' => '—', 'hint' => 'Today'],
                ['label' => 'Exceptions', 'value' => '—', 'hint' => 'Needs attention'],
            ],
            'finance' => [
                ['label' => 'Open Invoices', 'value' => '—', 'hint' => 'Receivables'],
                ['label' => 'Paid (MTD)', 'value' => '—', 'hint' => 'KES'],
                ['label' => 'Overdue', 'value' => '—', 'hint' => 'Follow-up'],
                ['label' => 'Quotes Pending', 'value' => '—', 'hint' => 'Finance review'],
            ],
            'customer_care' => [
                ['label' => 'Open Tickets', 'value' => '—', 'hint' => 'Support'],
                ['label' => 'Avg Response', 'value' => '—', 'hint' => 'Hours'],
                ['label' => 'Shipments Tracked', 'value' => '—', 'hint' => 'Today'],
                ['label' => 'Escalations', 'value' => '—', 'hint' => 'Active'],
            ],
            'marketing' => [
                ['label' => 'Campaigns', 'value' => '—', 'hint' => 'Active'],
                ['label' => 'Leads Captured', 'value' => '—', 'hint' => 'This week'],
                ['label' => 'Engagement', 'value' => '—', 'hint' => 'Placeholder'],
                ['label' => 'Content Pieces', 'value' => '—', 'hint' => 'In progress'],
            ],
            default => [
                ['label' => 'My Shipments', 'value' => '—', 'hint' => 'Portal'],
                ['label' => 'Open Quotes', 'value' => '—', 'hint' => 'Requests'],
                ['label' => 'Invoices', 'value' => '—', 'hint' => 'Payable'],
                ['label' => 'Documents', 'value' => '—', 'hint' => 'Available'],
            ],
        };
    }
}
