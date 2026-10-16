<?php

namespace App\Services;

use App\Models\Quotation;
use App\Models\Shipment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotationService
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly ShipmentService $shipmentService,
    ) {
    }

    public function nextReference(string $prefix = 'QT'): string
    {
        $year = now()->format('Y');
        $latest = DB::table($prefix === 'SH' ? 'shipments' : 'quotations')
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
     * @param  list<array<string, mixed>>  $items
     * @return array{subtotal: float, tax_amount: float, total: float, items: list<array<string, mixed>>}
     */
    public function calculateTotals(array $items, float $taxRate = 0): array
    {
        $normalized = [];
        $subtotal = 0.0;

        foreach (array_values($items) as $index => $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $price = (float) ($item['unit_price'] ?? 0);
            $line = round($qty * $price, 2);
            $subtotal += $line;

            $normalized[] = [
                'description' => $item['description'],
                'quantity' => $qty,
                'unit' => $item['unit'] ?? null,
                'unit_price' => $price,
                'line_total' => $line,
                'weight_kg' => $item['weight_kg'] ?? null,
                'sort_order' => $index,
            ];
        }

        $tax = round($subtotal * $taxRate, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => $tax,
            'total' => round($subtotal + $tax, 2),
            'items' => $normalized,
        ];
    }

    public function submitForApproval(Quotation $quotation): Quotation
    {
        if (! in_array($quotation->status, ['draft', 'rejected'], true)) {
            throw ValidationException::withMessages(['status' => 'Only draft or rejected quotations can be submitted.']);
        }

        if ($quotation->items()->count() === 0) {
            throw ValidationException::withMessages(['items' => 'Add at least one line item before submitting.']);
        }

        $quotation->update([
            'status' => 'pending_approval',
            'rejected_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        $this->activityLog->log('quotations.submitted', "Submitted quotation {$quotation->reference}", $quotation);

        $fresh = $quotation->fresh(['customer:id,name']);
        $title = "Quotation needs approval: {$fresh->reference}";
        $body = "Quotation {$fresh->reference}"
            .($fresh->customer ? " for {$fresh->customer->name}" : '')
            .' is waiting for approval.';
        $link = url(route('sales.quotations.show', $fresh, false));

        app(AppNotificationService::class)->notifyMany(
            app(AppNotificationService::class)->usersWithPermission('quotations.approve'),
            'quotation.approval',
            $title,
            $body,
            $link,
            "quotation-approval-{$fresh->id}",
            ['quotation_id' => $fresh->id],
            true,
            auth()->id(),
        );

        return $fresh;
    }

    public function approve(Quotation $quotation, $user): Quotation
    {
        if ($quotation->status !== 'pending_approval') {
            throw ValidationException::withMessages(['status' => 'Only pending quotations can be approved.']);
        }

        $quotation->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejected_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);

        $this->activityLog->log('quotations.approved', "Approved quotation {$quotation->reference}", $quotation);

        return $quotation->fresh();
    }

    public function reject(Quotation $quotation, $user, string $reason): Quotation
    {
        if ($quotation->status !== 'pending_approval') {
            throw ValidationException::withMessages(['status' => 'Only pending quotations can be rejected.']);
        }

        $quotation->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->activityLog->log('quotations.rejected', "Rejected quotation {$quotation->reference}", $quotation, [
            'reason' => $reason,
        ]);

        return $quotation->fresh();
    }

    public function convertToShipment(Quotation $quotation, $user): Shipment
    {
        if ($quotation->status !== 'approved') {
            throw ValidationException::withMessages(['status' => 'Only approved quotations can be converted.']);
        }

        return DB::transaction(function () use ($quotation, $user) {
            $shipment = Shipment::query()->create([
                'reference' => $this->shipmentService->nextReference(),
                'quotation_id' => $quotation->id,
                'customer_id' => $quotation->customer_id,
                'status' => 'created',
                'origin_country' => $quotation->origin_country,
                'destination_country' => $quotation->destination_country,
                'service_type' => $quotation->service_type,
                'tracking_number' => null,
                'pieces' => 1,
                'created_by' => $user->id,
                'notes' => "Converted from quotation {$quotation->reference}",
            ]);

            $shipment->update(['tracking_number' => $shipment->reference]);
            $this->shipmentService->recordInitialHistory($shipment, $user, "Converted from {$quotation->reference}");

            $quotation->update([
                'status' => 'converted',
                'converted_shipment_id' => $shipment->id,
            ]);

            $this->activityLog->log(
                'quotations.converted',
                "Converted quotation {$quotation->reference} to shipment {$shipment->reference}",
                $quotation,
                ['shipment_id' => $shipment->id],
            );

            return $shipment;
        });
    }
}
