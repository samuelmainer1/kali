<?php

namespace App\Services;

use App\Models\CargoMovement;
use App\Models\InventoryItem;
use App\Models\Shipment;
use App\Models\ShipmentCustomerNotice;
use App\Models\ShipmentStatusHistory;
use App\Models\User;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShipmentService
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = Shipment::query()
            ->where('reference', 'like', "SH-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('SH-%s-%04d', $year, $sequence);
    }

    public function recordInitialHistory(Shipment $shipment, User $user, ?string $notes = null): void
    {
        ShipmentStatusHistory::query()->create([
            'shipment_id' => $shipment->id,
            'from_status' => null,
            'to_status' => $shipment->status,
            'notes' => $notes ?? 'Shipment created',
            'changed_by' => $user->id,
            'created_at' => now(),
        ]);
    }

    public function advanceStatus(Shipment $shipment, User $user, ?string $notes = null, ?string $location = null): Shipment
    {
        $next = $shipment->nextStatus();
        if (! $next) {
            throw ValidationException::withMessages([
                'status' => 'Shipment is already at the final status (delivered).',
            ]);
        }

        return DB::transaction(function () use ($shipment, $user, $notes, $location, $next) {
            $from = $shipment->status;

            $shipment->update([
                'status' => $next,
                'current_location' => $location ?: $shipment->current_location,
                'delivered_at' => $next === 'delivered' ? now() : $shipment->delivered_at,
            ]);

            ShipmentStatusHistory::query()->create([
                'shipment_id' => $shipment->id,
                'from_status' => $from,
                'to_status' => $next,
                'notes' => $notes,
                'changed_by' => $user->id,
                'created_at' => now(),
            ]);

            if ($next === 'warehouse') {
                $this->ensureWarehouseInventory($shipment, $user);
            }

            if (in_array($next, ['booked', 'departed'], true)) {
                $this->markInventoryDispatched($shipment, $user, $next);
            }

            $this->activityLog->log(
                'shipments.status_changed',
                "Shipment {$shipment->reference}: {$from} → {$next}",
                $shipment,
                compact('from', 'next', 'notes'),
            );

            $fresh = $shipment->fresh(['statusHistories.changer', 'inventoryItems', 'customer.salesperson', 'creator']);
            $this->notifyStatusChange($fresh, $from, $next, $user);

            return $fresh;
        });
    }

    private function notifyStatusChange(Shipment $shipment, string $from, string $next, User $actor): void
    {
        $recipients = collect();

        if ($shipment->created_by) {
            $creator = User::query()->find($shipment->created_by);
            if ($creator) {
                $recipients->push($creator);
            }
        }

        if ($shipment->customer?->assigned_salesperson_id) {
            $sales = User::query()->find($shipment->customer->assigned_salesperson_id);
            if ($sales) {
                $recipients->push($sales);
            }
        }

        $recipients = $recipients
            ->filter()
            ->unique('id')
            ->values();

        $title = "Shipment updated: {$shipment->reference}";
        $body = "Shipment {$shipment->reference} moved from {$from} to {$next}.";
        $link = url(route('operations.shipments.show', $shipment, false));

        app(AppNotificationService::class)->notifyMany(
            $recipients,
            'shipment.status',
            $title,
            $body,
            $link,
            "shipment-status-{$shipment->id}-{$next}",
            ['shipment_id' => $shipment->id, 'from' => $from, 'to' => $next],
            true,
            $actor->id,
        );

        $this->notifyCustomer($shipment, $next);
    }

    public function notifyCustomer(Shipment $shipment, string $status): void
    {
        $shipment->loadMissing(['customer', 'driver', 'vehicle']);
        $customer = $shipment->customer;
        if (! $customer) {
            return;
        }

        $label = Shipment::label($status);
        $subject = "Shipment {$shipment->reference} is now {$label}";
        $message = "Your shipment {$shipment->reference} is now {$label}.";
        if ($shipment->current_location) {
            $message .= " Current location: {$shipment->current_location}.";
        }
        if ($status === 'out_for_delivery' && $shipment->driver) {
            $message .= " Driver: {$shipment->driver->name}.";
            if ($shipment->vehicle) {
                $message .= " Vehicle: {$shipment->vehicle->registration}.";
            }
        }

        $dispatcher = app(NotificationDispatcher::class);

        if ($customer->email) {
            $dispatcher->via('email')->send($customer->email, $subject, $message, [
                'shipment_id' => $shipment->id,
                'status' => $status,
            ]);
            ShipmentCustomerNotice::query()->create([
                'shipment_id' => $shipment->id,
                'channel' => 'email',
                'destination' => $customer->email,
                'status' => 'sent',
                'subject' => $subject,
                'body' => $message,
            ]);

            $portalUser = User::query()->where('email', $customer->email)->where('is_active', true)->first();
            if ($portalUser) {
                app(AppNotificationService::class)->notify(
                    $portalUser,
                    'shipment.customer',
                    $subject,
                    $message,
                    url(route('portal.shipments.show', $shipment, false)),
                    "shipment-customer-{$shipment->id}-{$status}",
                    ['shipment_id' => $shipment->id, 'status' => $status],
                    false,
                );
            }
        }

        if ($customer->phone) {
            foreach (['sms', 'whatsapp'] as $channel) {
                $dispatcher->via($channel)->send($customer->phone, $subject, $message, [
                    'shipment_id' => $shipment->id,
                    'status' => $status,
                ]);
                ShipmentCustomerNotice::query()->create([
                    'shipment_id' => $shipment->id,
                    'channel' => $channel,
                    'destination' => $customer->phone,
                    'status' => 'pending_gateway',
                    'subject' => $subject,
                    'body' => $message,
                ]);
            }
        }
    }

    private function ensureWarehouseInventory(Shipment $shipment, User $user): void
    {
        $item = InventoryItem::query()->firstOrCreate(
            ['sku' => $shipment->reference],
            [
                'name' => "Cargo for {$shipment->reference}",
                'description' => $shipment->notes,
                'quantity_on_hand' => $shipment->pieces ?: 1,
                'unit' => 'pcs',
                'branch_id' => $shipment->branch_id,
                'shipment_id' => $shipment->id,
                'location_code' => $shipment->current_location ?: 'WH-IN',
                'status' => 'held',
            ]
        );

        if (! $item->wasRecentlyCreated) {
            return;
        }

        CargoMovement::query()->create([
            'type' => 'inbound',
            'inventory_item_id' => $item->id,
            'shipment_id' => $shipment->id,
            'branch_id' => $shipment->branch_id,
            'quantity' => $item->quantity_on_hand,
            'reference' => $shipment->reference,
            'notes' => 'Auto inbound when shipment entered warehouse',
            'performed_by' => $user->id,
            'moved_at' => now(),
        ]);
    }

    private function markInventoryDispatched(Shipment $shipment, User $user, string $status): void
    {
        $items = InventoryItem::query()
            ->where('shipment_id', $shipment->id)
            ->where('status', '!=', 'dispatched')
            ->get();

        foreach ($items as $item) {
            $qty = (float) $item->quantity_on_hand;
            $item->update([
                'status' => 'dispatched',
                'quantity_on_hand' => 0,
            ]);

            CargoMovement::query()->create([
                'type' => 'outbound',
                'inventory_item_id' => $item->id,
                'shipment_id' => $shipment->id,
                'branch_id' => $shipment->branch_id,
                'quantity' => $qty,
                'reference' => $shipment->reference,
                'notes' => "Auto outbound on shipment status {$status}",
                'performed_by' => $user->id,
                'moved_at' => now(),
            ]);
        }
    }
}
