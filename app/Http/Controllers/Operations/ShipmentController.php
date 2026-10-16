<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Shipment;
use App\Services\ActivityLogService;
use App\Services\ShipmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShipmentController extends Controller
{
    public function __construct(
        private readonly ShipmentService $shipments,
        private readonly ActivityLogService $activityLog,
    ) {
    }

    public function index(Request $request): Response
    {
        $shipments = Shipment::query()
            ->with(['customer:id,name', 'branch:id,name'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('tracking_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Shipment $shipment) => [
                'id' => $shipment->id,
                'reference' => $shipment->reference,
                'tracking_number' => $shipment->tracking_number,
                'customer' => $shipment->customer?->name,
                'branch' => $shipment->branch?->name,
                'status' => $shipment->status,
                'status_label' => Shipment::label($shipment->status),
                'origin_country' => $shipment->origin_country,
                'destination_country' => $shipment->destination_country,
                'service_type' => $shipment->service_type,
                'pieces' => $shipment->pieces,
                'weight_kg' => $shipment->weight_kg,
                'created_at' => $shipment->created_at?->toDateString(),
            ]);

        return Inertia::render('Operations/Shipments/Index', [
            'shipments' => $shipments,
            'filters' => $request->only(['search', 'status']),
            'statuses' => Shipment::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Operations/Shipments/Form', [
            'shipment' => null,
            'customers' => Customer::query()->whereIn('status', ['lead', 'active'])->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'statuses' => Shipment::STATUSES,
            'serviceTypes' => ['air', 'sea', 'road', 'express', 'other'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'origin_country' => ['nullable', 'string', 'max:120'],
            'destination_country' => ['nullable', 'string', 'max:120'],
            'current_location' => ['nullable', 'string', 'max:120'],
            'service_type' => ['nullable', 'string', 'max:40'],
            'pieces' => ['required', 'integer', 'min:1'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'tracking_number' => ['nullable', 'string', 'max:80', 'unique:shipments,tracking_number'],
            'expected_departure' => ['nullable', 'date'],
            'expected_arrival' => ['nullable', 'date', 'after_or_equal:expected_departure'],
            'notes' => ['nullable', 'string'],
        ]);

        $shipment = Shipment::query()->create([
            ...$data,
            'reference' => $this->shipments->nextReference(),
            'status' => 'created',
            'created_by' => $request->user()->id,
            'tracking_number' => $data['tracking_number'] ?? null,
        ]);

        if (! $shipment->tracking_number) {
            $shipment->update(['tracking_number' => $shipment->reference]);
        }

        $this->shipments->recordInitialHistory($shipment, $request->user());
        $this->activityLog->log('shipments.created', "Created shipment {$shipment->reference}", $shipment);

        return redirect()
            ->route('operations.shipments.show', $shipment)
            ->with('success', 'Shipment created.');
    }

    public function show(Shipment $shipment): Response
    {
        $shipment->load([
            'customer:id,name,email,phone',
            'branch:id,name',
            'quotation:id,reference,status',
            'creator:id,name',
            'statusHistories.changer:id,name',
            'inventoryItems',
            'cargoMovements' => fn ($q) => $q->with('performer:id,name')->limit(20),
        ]);

        return Inertia::render('Operations/Shipments/Show', [
            'shipment' => [
                'id' => $shipment->id,
                'reference' => $shipment->reference,
                'tracking_number' => $shipment->tracking_number,
                'status' => $shipment->status,
                'status_label' => Shipment::label($shipment->status),
                'next_status' => $shipment->nextStatus(),
                'next_status_label' => $shipment->nextStatus() ? Shipment::label($shipment->nextStatus()) : null,
                'origin_country' => $shipment->origin_country,
                'destination_country' => $shipment->destination_country,
                'current_location' => $shipment->current_location,
                'service_type' => $shipment->service_type,
                'pieces' => $shipment->pieces,
                'weight_kg' => $shipment->weight_kg,
                'expected_departure' => $shipment->expected_departure?->toDateString(),
                'expected_arrival' => $shipment->expected_arrival?->toDateString(),
                'delivered_at' => $shipment->delivered_at?->toDateTimeString(),
                'notes' => $shipment->notes,
                'customer' => $shipment->customer,
                'branch' => $shipment->branch,
                'quotation' => $shipment->quotation,
                'creator' => $shipment->creator,
                'lifecycle' => Shipment::STATUSES,
                'history' => $shipment->statusHistories->map(fn ($h) => [
                    'id' => $h->id,
                    'from_status' => $h->from_status,
                    'to_status' => $h->to_status,
                    'notes' => $h->notes,
                    'changed_by' => $h->changer?->name,
                    'created_at' => $h->created_at?->toDateTimeString(),
                    'created_at_human' => $h->created_at?->diffForHumans(),
                ]),
                'inventory_items' => $shipment->inventoryItems,
                'cargo_movements' => $shipment->cargoMovements->map(fn ($m) => [
                    'id' => $m->id,
                    'type' => $m->type,
                    'quantity' => $m->quantity,
                    'notes' => $m->notes,
                    'performed_by' => $m->performer?->name,
                    'moved_at' => $m->moved_at?->toDateTimeString(),
                ]),
            ],
        ]);
    }

    public function edit(Shipment $shipment): Response
    {
        return Inertia::render('Operations/Shipments/Form', [
            'shipment' => $shipment->only([
                'id', 'customer_id', 'branch_id', 'origin_country', 'destination_country',
                'current_location', 'service_type', 'pieces', 'weight_kg', 'tracking_number',
                'expected_departure', 'expected_arrival', 'notes', 'status',
            ]),
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => Shipment::STATUSES,
            'serviceTypes' => ['air', 'sea', 'road', 'express', 'other'],
        ]);
    }

    public function update(Request $request, Shipment $shipment): RedirectResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'origin_country' => ['nullable', 'string', 'max:120'],
            'destination_country' => ['nullable', 'string', 'max:120'],
            'current_location' => ['nullable', 'string', 'max:120'],
            'service_type' => ['nullable', 'string', 'max:40'],
            'pieces' => ['required', 'integer', 'min:1'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'tracking_number' => ['nullable', 'string', 'max:80', Rule::unique('shipments', 'tracking_number')->ignore($shipment->id)],
            'expected_departure' => ['nullable', 'date'],
            'expected_arrival' => ['nullable', 'date', 'after_or_equal:expected_departure'],
            'notes' => ['nullable', 'string'],
        ]);

        $shipment->update($data);
        $this->activityLog->log('shipments.updated', "Updated shipment {$shipment->reference}", $shipment);

        return redirect()
            ->route('operations.shipments.show', $shipment)
            ->with('success', 'Shipment updated.');
    }

    public function advance(Request $request, Shipment $shipment): RedirectResponse
    {
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'current_location' => ['nullable', 'string', 'max:120'],
        ]);

        $this->shipments->advanceStatus(
            $shipment,
            $request->user(),
            $data['notes'] ?? null,
            $data['current_location'] ?? null,
        );

        return back()->with('success', 'Shipment status advanced.');
    }
}
