<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CargoMovement;
use App\Models\Customer;
use App\Models\EmployeeReport;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\Shipment;
use App\Models\ShipmentDocument;
use App\Models\SupportTicket;
use App\Models\Task;
use App\Models\User;
use App\Services\ApprovalsService;
use App\Services\PipelineService;
use App\Services\ProcurementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Role-aware dashboard entry point.
 */
class DashboardController extends Controller
{
    public function __construct(
        private readonly PipelineService $pipeline,
        private readonly ProcurementService $procurement,
        private readonly ApprovalsService $approvals,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user()->load(['department', 'branch']);
        $role = $user->primaryRole() ?? 'customer';
        $showOpsPanels = in_array($role, ['administrator', 'management'], true);

        $stats = $this->statsForRole($role, $user);

        $recentActivities = [];
        if ($showOpsPanels) {
            $recentActivities = ActivityLog::query()
                ->with('user:id,name')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (ActivityLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'user' => $log->user?->name,
                    'created_at' => $log->created_at?->diffForHumans(),
                ]);
        }

        $pipelineSummary = null;
        if ($user->can('pipeline.view') || $user->can('pipeline.view_all') || $user->can('pipeline.manage')) {
            $pipelineSummary = $this->pipeline->dashboardSummary($user);
        }

        $procurementSummary = null;
        if ($this->procurement->canRequest($user) || $this->procurement->canViewAll($user)) {
            $statsData = $this->procurement->summaryStats($user);
            $procurementSummary = [
                'subtitle' => $this->procurement->canViewAll($user)
                    ? 'Internal spending overview'
                    : 'Your purchase requests',
                'cards' => [
                    ['label' => 'Pending approval', 'value' => $statsData['pending']],
                    ['label' => 'Approved', 'value' => $statsData['approved']],
                    ['label' => 'Processed this month', 'value' => $statsData['processed_month']],
                    ['label' => 'Spend this month (KES)', 'value' => number_format($statsData['spend_month'], 0)],
                ],
                'latest' => $this->procurement->scopedQuery($user)
                    ->latest()
                    ->limit(4)
                    ->get(['id', 'title', 'reference', 'status', 'total_amount'])
                    ->map(fn (PurchaseRequest $item) => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'reference' => $item->reference,
                        'status_label' => PurchaseRequest::statusLabel($item->status),
                        'total_amount' => (float) $item->total_amount,
                    ])->all(),
            ];
        }

        $approvalsSummary = null;
        if ($this->approvals->canAccess($user)) {
            $pending = $this->approvals->pendingFor($user);
            $approvalsSummary = [
                'total' => $pending['total'],
                'counts' => $pending['counts'],
                'latest' => array_slice($pending['items'], 0, 5),
            ];
        }

        return Inertia::render('Dashboard/Index', [
            'role' => $role,
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'showOpsPanels' => $showOpsPanels,
            'pipelineSummary' => $pipelineSummary,
            'procurementSummary' => $procurementSummary,
            'approvalsSummary' => $approvalsSummary,
            'userSummary' => [
                'name' => $user->name,
                'department' => $user->department?->name,
                'branch' => $user->branch?->name,
                'role_label' => str_replace('_', ' ', $role),
            ],
        ]);
    }

    /**
     * Administrator and management share one board: company totals, then the approval and finance cards.
     *
     * @return list<array{label: string, value: string|int, hint: string}>
     */
    private function leadershipStats(User $user, int $activeShipments, int $quotations, int $customers, float $pipeline): array
    {
        return [
            ['label' => 'Total Users', 'value' => User::query()->count(), 'hint' => 'Active directory'],
            ['label' => 'Active Shipments', 'value' => $activeShipments, 'hint' => 'Not delivered'],
            ['label' => 'Quotations', 'value' => $quotations, 'hint' => 'All time'],
            ['label' => 'Pending Reports', 'value' => EmployeeReport::query()->where('status', 'submitted')->count(), 'hint' => 'Awaiting review'],
            ['label' => 'Customers', 'value' => $customers, 'hint' => 'CRM companies'],
            ['label' => 'Invoices Paid', 'value' => Invoice::query()->where('status', 'paid')->count(), 'hint' => 'Finance'],
            ['label' => 'Pending Approvals', 'value' => $this->approvals->pendingFor($user)['total'], 'hint' => 'Leave · PR · Quotes · Reports'],
            ['label' => 'Pipeline Value', 'value' => number_format($pipeline, 0), 'hint' => 'KES open quotes'],
            ['label' => 'Unpaid Invoices', 'value' => Invoice::query()->whereIn('status', ['sent', 'overdue'])->count(), 'hint' => 'Finance'],
        ];
    }

    /**
     * @return list<array{label: string, value: string|int, hint: string}>
     */
    private function statsForRole(string $role, User $user): array
    {
        $activeShipments = Shipment::query()->whereNotIn('status', ['delivered'])->count();
        $quotations = Quotation::query()->count();
        $customers = Customer::query()->count();
        $openQuotes = Quotation::query()->whereIn('status', ['draft', 'pending_approval', 'approved'])->count();
        $pipeline = (float) Quotation::query()->whereIn('status', ['pending_approval', 'approved'])->sum('total');

        return match ($role) {
            'administrator', 'management' => $this->leadershipStats($user, $activeShipments, $quotations, $customers, $pipeline),
            'finance' => [
                ['label' => 'Draft Invoices', 'value' => Invoice::query()->where('status', 'draft')->count(), 'hint' => 'To send'],
                ['label' => 'Sent', 'value' => Invoice::query()->where('status', 'sent')->count(), 'hint' => 'Awaiting payment'],
                ['label' => 'Paid', 'value' => Invoice::query()->where('status', 'paid')->count(), 'hint' => 'Collected'],
                ['label' => 'Overdue', 'value' => Invoice::query()->where('status', 'overdue')->count(), 'hint' => 'Follow up'],
            ],
            'sales' => [
                ['label' => 'Leads', 'value' => Customer::query()->where('status', 'lead')->count(), 'hint' => 'CRM'],
                ['label' => 'Open Quotations', 'value' => $openQuotes, 'hint' => 'Active pipeline'],
                ['label' => 'My Tasks', 'value' => Task::query()->where('assigned_to', $user->id)->whereIn('status', ['todo', 'in_progress'])->count(), 'hint' => 'Open'],
                ['label' => 'My Reports', 'value' => EmployeeReport::query()->where('user_id', $user->id)->count(), 'hint' => 'Submitted / drafts'],
            ],
            'operations' => [
                ['label' => 'Created', 'value' => Shipment::query()->where('status', 'created')->count(), 'hint' => 'Shipments'],
                ['label' => 'In Transit', 'value' => Shipment::query()->whereIn('status', ['departed', 'arrived', 'customs_clearance', 'out_for_delivery'])->count(), 'hint' => 'Moving'],
                ['label' => 'At Warehouse', 'value' => Shipment::query()->where('status', 'warehouse')->count(), 'hint' => 'Staging'],
                ['label' => 'My Tasks', 'value' => Task::query()->where('assigned_to', $user->id)->whereIn('status', ['todo', 'in_progress'])->count(), 'hint' => 'Open'],
            ],
            'warehouse' => [
                ['label' => 'Inventory Lots', 'value' => InventoryItem::query()->count(), 'hint' => 'On record'],
                ['label' => 'Inbound Today', 'value' => CargoMovement::query()->where('type', 'inbound')->whereDate('moved_at', today())->count(), 'hint' => 'Movements'],
                ['label' => 'Outbound Today', 'value' => CargoMovement::query()->where('type', 'outbound')->whereDate('moved_at', today())->count(), 'hint' => 'Movements'],
                ['label' => 'My Reports', 'value' => EmployeeReport::query()->where('user_id', $user->id)->count(), 'hint' => 'All periods'],
            ],
            'customer_care' => [
                ['label' => 'Open Tickets', 'value' => SupportTicket::query()->whereIn('status', ['open', 'in_progress', 'waiting_customer'])->count(), 'hint' => 'Support queue'],
                ['label' => 'Urgent', 'value' => SupportTicket::query()->where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(), 'hint' => 'Priority'],
                ['label' => 'Assigned to Me', 'value' => SupportTicket::query()->where('assigned_to', $user->id)->whereNotIn('status', ['closed'])->count(), 'hint' => 'Active'],
                ['label' => 'Resolved', 'value' => SupportTicket::query()->where('status', 'resolved')->count(), 'hint' => 'Awaiting close'],
            ],
            'marketing' => [
                ['label' => 'Active Campaigns', 'value' => MarketingCampaign::query()->where('status', 'active')->count(), 'hint' => 'Live'],
                ['label' => 'New Leads', 'value' => MarketingLead::query()->where('status', 'new')->count(), 'hint' => 'Pipeline'],
                ['label' => 'Qualified', 'value' => MarketingLead::query()->where('status', 'qualified')->count(), 'hint' => 'Ready for sales'],
                ['label' => 'Converted', 'value' => MarketingLead::query()->where('status', 'converted')->count(), 'hint' => 'Won'],
            ],
            'customer' => [
                ['label' => 'My Tickets', 'value' => SupportTicket::query()->where('requester_id', $user->id)->whereNotIn('status', ['closed'])->count(), 'hint' => 'Open support'],
                ['label' => 'Quotations', 'value' => Quotation::query()->whereHas('customer', fn ($query) => $query->where('email', $user->email))->count(), 'hint' => 'Your quotes'],
                ['label' => 'Shipments', 'value' => Shipment::query()->forCustomerUser($user)->count(), 'hint' => 'Track in the portal'],
                ['label' => 'Documents', 'value' => ShipmentDocument::query()->whereHas('shipment', fn ($query) => $query->forCustomerUser($user))->count(), 'hint' => 'Waybills and proof of delivery'],
            ],
            default => [
                ['label' => 'Customers', 'value' => $customers, 'hint' => 'CRM'],
                ['label' => 'Quotations', 'value' => $quotations, 'hint' => 'All'],
                ['label' => 'Shipments', 'value' => Shipment::query()->count(), 'hint' => 'Created'],
                ['label' => 'Open Tickets', 'value' => SupportTicket::query()->whereIn('status', ['open', 'in_progress'])->count(), 'hint' => 'Support'],
            ],
        };
    }
}
