<?php

namespace App\Services;

use App\Models\EmployeeReport;
use App\Models\LeaveRequest;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Collection;

class ApprovalsService
{
    public function canAccess(User $user): bool
    {
        return $user->can('leave.approve')
            || $user->can('procurement.approve')
            || $user->can('quotations.approve')
            || $user->can('reports.weekly.review');
    }

    /**
     * @return array{
     *   total: int,
     *   counts: array{leave: int, procurement: int, quotations: int, reports: int},
     *   items: list<array<string, mixed>>
     * }
     */
    public function pendingFor(User $user, ?string $type = null): array
    {
        $items = collect();

        if ($user->can('leave.approve') && ($type === null || $type === 'leave')) {
            $items = $items->merge($this->leaveItems());
        }

        if ($user->can('procurement.approve') && ($type === null || $type === 'procurement')) {
            $items = $items->merge($this->procurementItems());
        }

        if ($user->can('quotations.approve') && ($type === null || $type === 'quotations')) {
            $items = $items->merge($this->quotationItems());
        }

        if ($user->can('reports.weekly.review') && ($type === null || $type === 'reports')) {
            $items = $items->merge($this->reportItems());
        }

        $sorted = $items
            ->sortBy(fn (array $item) => $item['waiting_at'])
            ->values();

        $counts = [
            'leave' => $user->can('leave.approve') ? LeaveRequest::query()->where('status', 'pending')->count() : 0,
            'procurement' => $user->can('procurement.approve') ? PurchaseRequest::query()->where('status', 'submitted')->count() : 0,
            'quotations' => $user->can('quotations.approve') ? Quotation::query()->where('status', 'pending_approval')->count() : 0,
            'reports' => $user->can('reports.weekly.review') ? EmployeeReport::query()->where('status', 'submitted')->count() : 0,
        ];

        return [
            'total' => array_sum($counts),
            'counts' => $counts,
            'items' => $sorted->all(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function leaveItems(): Collection
    {
        return LeaveRequest::query()
            ->with(['requester:id,name', 'leaveType:id,name'])
            ->where('status', 'pending')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (LeaveRequest $item) => [
                'key' => 'leave-'.$item->id,
                'type' => 'leave',
                'type_label' => 'Leave',
                'id' => $item->id,
                'reference' => $item->reference,
                'from' => $item->requester?->name,
                'summary' => trim(($item->leaveType?->name ?? 'Leave').' · '.$item->days.' day(s) · '.$item->start_date?->toDateString().' – '.$item->end_date?->toDateString()),
                'url' => route('leave.show', $item),
                'waiting_at' => $item->created_at?->toIso8601String(),
                'waiting_label' => $item->created_at?->diffForHumans(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function procurementItems(): Collection
    {
        return PurchaseRequest::query()
            ->with(['requester:id,name'])
            ->where('status', 'submitted')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (PurchaseRequest $item) => [
                'key' => 'procurement-'.$item->id,
                'type' => 'procurement',
                'type_label' => 'Purchase',
                'id' => $item->id,
                'reference' => $item->reference,
                'from' => $item->requester?->name,
                'summary' => $item->title.' · KES '.number_format((float) $item->total_amount, 0),
                'url' => route('procurement.show', $item),
                'waiting_at' => $item->created_at?->toIso8601String(),
                'waiting_label' => $item->created_at?->diffForHumans(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function quotationItems(): Collection
    {
        return Quotation::query()
            ->with(['customer:id,name', 'creator:id,name'])
            ->where('status', 'pending_approval')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Quotation $item) => [
                'key' => 'quotation-'.$item->id,
                'type' => 'quotations',
                'type_label' => 'Quotation',
                'id' => $item->id,
                'reference' => $item->reference,
                'from' => $item->creator?->name,
                'summary' => ($item->customer?->name ?? 'Customer').' · KES '.number_format((float) $item->total, 0),
                'url' => route('sales.quotations.show', $item),
                'waiting_at' => $item->updated_at?->toIso8601String() ?? $item->created_at?->toIso8601String(),
                'waiting_label' => ($item->updated_at ?? $item->created_at)?->diffForHumans(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function reportItems(): Collection
    {
        return EmployeeReport::query()
            ->with(['author:id,name'])
            ->where('status', 'submitted')
            ->latest('submitted_at')
            ->limit(50)
            ->get()
            ->map(fn (EmployeeReport $item) => [
                'key' => 'report-'.$item->id,
                'type' => 'reports',
                'type_label' => 'Report',
                'id' => $item->id,
                'reference' => $item->reference,
                'from' => $item->author?->name,
                'summary' => $item->title.' · '.ucfirst($item->period_type),
                'url' => route('reports.show', $item),
                'waiting_at' => $item->submitted_at?->toIso8601String() ?? $item->created_at?->toIso8601String(),
                'waiting_label' => ($item->submitted_at ?? $item->created_at)?->diffForHumans(),
            ]);
    }
}
