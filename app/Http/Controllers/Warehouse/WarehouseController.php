<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CargoMovement;
use App\Models\InventoryItem;
use App\Models\Shipment;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function index(): Response
    {
        $inventory = InventoryItem::query()
            ->with(['branch:id,name', 'shipment:id,reference,status'])
            ->latest()
            ->paginate(12)
            ->through(fn (InventoryItem $item) => [
                'id' => $item->id,
                'sku' => $item->sku,
                'name' => $item->name,
                'quantity_on_hand' => $item->quantity_on_hand,
                'unit' => $item->unit,
                'location_code' => $item->location_code,
                'status' => $item->status,
                'branch' => $item->branch?->name,
                'shipment' => $item->shipment?->reference,
                'shipment_status' => $item->shipment?->status,
            ]);

        $movements = CargoMovement::query()
            ->with(['inventoryItem:id,sku,name', 'shipment:id,reference', 'performer:id,name', 'branch:id,name'])
            ->latest('moved_at')
            ->limit(15)
            ->get()
            ->map(fn (CargoMovement $movement) => [
                'id' => $movement->id,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'sku' => $movement->inventoryItem?->sku,
                'item_name' => $movement->inventoryItem?->name,
                'shipment' => $movement->shipment?->reference,
                'branch' => $movement->branch?->name,
                'performed_by' => $movement->performer?->name,
                'notes' => $movement->notes,
                'moved_at' => $movement->moved_at?->diffForHumans(),
            ]);

        $warehouseShipments = Shipment::query()
            ->where('status', 'warehouse')
            ->with('customer:id,name')
            ->latest()
            ->limit(8)
            ->get(['id', 'reference', 'customer_id', 'current_location', 'pieces', 'weight_kg']);

        return Inertia::render('Warehouse/Index', [
            'inventory' => $inventory,
            'movements' => $movements,
            'warehouseShipments' => $warehouseShipments,
            'stats' => [
                'lots' => InventoryItem::query()->count(),
                'available_qty' => (float) InventoryItem::query()->where('status', 'available')->sum('quantity_on_hand'),
                'held_lots' => InventoryItem::query()->where('status', 'held')->count(),
                'inbound_today' => CargoMovement::query()->where('type', 'inbound')->whereDate('moved_at', today())->count(),
                'outbound_today' => CargoMovement::query()->where('type', 'outbound')->whereDate('moved_at', today())->count(),
            ],
            'options' => $this->formOptions(),
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sku' => ['required', 'string', 'max:80', 'unique:inventory_items,sku'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity_on_hand' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:40'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'shipment_id' => ['nullable', 'exists:shipments,id'],
            'location_code' => ['nullable', 'string', 'max:80'],
            'status' => ['required', Rule::in(InventoryItem::STATUSES)],
        ]);

        $item = InventoryItem::query()->create($data);

        if ((float) $item->quantity_on_hand > 0) {
            CargoMovement::query()->create([
                'type' => 'inbound',
                'inventory_item_id' => $item->id,
                'shipment_id' => $item->shipment_id,
                'branch_id' => $item->branch_id,
                'quantity' => $item->quantity_on_hand,
                'reference' => $item->sku,
                'notes' => 'Initial stock entry',
                'performed_by' => $request->user()->id,
                'moved_at' => now(),
            ]);
        }

        $this->activityLog->log('warehouse.item_created', "Created inventory item {$item->sku}", $item);

        return back()->with('success', 'Inventory item created.');
    }

    public function storeMovement(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(CargoMovement::TYPES)],
            'inventory_item_id' => ['required', 'exists:inventory_items,id'],
            'shipment_id' => ['nullable', 'exists:shipments,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $data) {
            $item = InventoryItem::query()->lockForUpdate()->findOrFail($data['inventory_item_id']);
            $qty = (float) $data['quantity'];
            $onHand = (float) $item->quantity_on_hand;

            $newQty = match ($data['type']) {
                'inbound' => $onHand + $qty,
                'outbound' => $onHand - $qty,
                'adjustment' => $qty,
            };

            if ($newQty < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Insufficient quantity on hand for outbound movement.',
                ]);
            }

            $item->update([
                'quantity_on_hand' => $newQty,
                'status' => $newQty <= 0 ? 'dispatched' : $item->status,
                'branch_id' => $data['branch_id'] ?? $item->branch_id,
                'shipment_id' => $data['shipment_id'] ?? $item->shipment_id,
            ]);

            CargoMovement::query()->create([
                ...$data,
                'performed_by' => $request->user()->id,
                'moved_at' => now(),
            ]);
        });

        $this->activityLog->log('warehouse.movement_created', 'Recorded cargo movement', null, $data);

        return back()->with('success', 'Cargo movement recorded.');
    }

    public function formOptions(): array
    {
        return [
            'branches' => Branch::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'shipments' => Shipment::query()->latest()->limit(50)->get(['id', 'reference', 'status']),
            'items' => InventoryItem::query()->orderBy('sku')->get(['id', 'sku', 'name', 'quantity_on_hand']),
            'statuses' => InventoryItem::STATUSES,
            'types' => CargoMovement::TYPES,
        ];
    }
}
