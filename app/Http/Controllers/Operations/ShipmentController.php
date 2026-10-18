<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Jobs\ExportShipmentsSpreadsheet;
use App\Jobs\GenerateCargoManifestPdf;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Shipment;
use App\Models\ShipmentDocument;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\ActivityLogService;
use App\Services\ShipmentService;
use App\Support\DocumentStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShipmentController extends Controller
{
    public function __construct(
        private readonly ShipmentService $shipments,
        private readonly ActivityLogService $activityLog,
    ) {}

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
            'export_ready' => DocumentStorage::disk()->exists(ExportShipmentsSpreadsheet::PATH),
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
            'documents',
            'driver:id,name',
            'vehicle:id,registration,name',
            'proofOfDelivery.recorder:id,name',
            'customerNotices',
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
                'driver' => $shipment->driver,
                'vehicle' => $shipment->vehicle,
                'proof' => $shipment->proofOfDelivery ? [
                    'received_by' => $shipment->proofOfDelivery->received_by,
                    'received_at' => $shipment->proofOfDelivery->received_at?->format('d M Y H:i'),
                    'notes' => $shipment->proofOfDelivery->notes,
                    'photo_name' => $shipment->proofOfDelivery->photo_name,
                    'has_photo' => (bool) $shipment->proofOfDelivery->photo_path,
                    'recorded_by' => $shipment->proofOfDelivery->recorder?->name,
                ] : null,
                'customer_notices' => $shipment->customerNotices->map(fn ($notice) => [
                    'id' => $notice->id,
                    'channel' => $notice->channel,
                    'destination' => $notice->destination,
                    'status' => $notice->status === 'sent' ? 'Sent' : 'Waiting for SMS or WhatsApp gateway',
                    'subject' => $notice->subject,
                    'created_at' => $notice->created_at?->format('d M Y H:i'),
                ]),
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
                'documents' => $shipment->documents->map(fn ($document) => [
                    'id' => $document->id,
                    'type' => $document->type,
                    'type_label' => $document->typeLabel(),
                    'original_name' => $document->original_name,
                ]),
                'document_types' => ShipmentDocument::TYPES,
                'manifest_ready' => DocumentStorage::disk()->exists((new GenerateCargoManifestPdf($shipment->id))->path()),
                'inventory_items' => $shipment->inventoryItems,
                'drivers' => User::query()
                    ->where('is_active', true)
                    ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'customer'))
                    ->with('department:id,name')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (User $driver) => [
                        'id' => $driver->id,
                        'name' => $driver->name,
                        'department' => $driver->department?->name,
                    ]),
                'vehicles' => Vehicle::query()->where('is_active', true)->orderBy('registration')->get(['id', 'registration', 'name']),
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

    public function assign(Request $request, Shipment $shipment): RedirectResponse
    {
        $data = $request->validate([
            'driver_id' => ['nullable', 'exists:users,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
        ]);

        if (! empty($data['driver_id'])) {
            $driver = User::query()->findOrFail($data['driver_id']);
            if (! $driver->is_active || $driver->hasRole('customer')) {
                return back()->withErrors(['driver_id' => 'Choose a staff member.'])->withInput();
            }
        }

        $shipment->update([
            'driver_id' => $data['driver_id'] ?: null,
            'vehicle_id' => $data['vehicle_id'] ?: null,
        ]);

        $this->activityLog->log('shipments.assigned', "Assigned driver and vehicle on {$shipment->reference}", $shipment);

        return back()->with('success', 'Driver and vehicle saved. Only the selected driver is assigned.');
    }

    public function storeProof(Request $request, Shipment $shipment): RedirectResponse
    {
        if (! in_array($shipment->status, ['out_for_delivery', 'delivered'], true)) {
            return back()->withErrors(['received_by' => 'Record proof when the shipment is out for delivery or delivered.']);
        }

        $data = $request->validate([
            'received_by' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:10240'],
        ]);

        if ($shipment->status === 'out_for_delivery') {
            $this->shipments->advanceStatus($shipment, $request->user(), 'Proof of delivery recorded');
            $shipment->refresh();
        }

        $proof = $shipment->proofOfDelivery()->firstOrNew([]);
        $proof->fill([
            'received_by' => $data['received_by'],
            'received_at' => now(),
            'notes' => $data['notes'] ?? null,
            'recorded_by' => $request->user()->id,
        ]);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $proof->photo_path = $file->store("shipments/{$shipment->id}/pod", DocumentStorage::name());
            $proof->photo_disk = DocumentStorage::name();
            $proof->photo_name = $file->getClientOriginalName();
        }

        $proof->shipment_id = $shipment->id;
        $proof->save();

        $this->activityLog->log('shipments.pod', "Recorded proof of delivery for {$shipment->reference}", $shipment);

        return back()->with('success', 'Proof of delivery saved.');
    }

    public function downloadProof(Request $request, Shipment $shipment): StreamedResponse
    {
        $proof = $shipment->proofOfDelivery;
        abort_unless($proof?->photo_path, 404);

        $user = $request->user();
        $canView = $user->can('shipments.view')
            || ($user->can('portal.shipments') && $shipment->customer?->email === $user->email);
        abort_unless($canView, 403);
        abort_unless(DocumentStorage::disk()->exists($proof->photo_path), 404);

        return DocumentStorage::disk()->download($proof->photo_path, $proof->photo_name ?: 'proof-of-delivery.jpg');
    }

    public function queueManifest(Shipment $shipment): RedirectResponse
    {
        GenerateCargoManifestPdf::dispatch($shipment->id);

        return back()->with('success', 'Cargo manifest queued.');
    }

    public function downloadManifest(Shipment $shipment): StreamedResponse
    {
        $path = (new GenerateCargoManifestPdf($shipment->id))->path();
        abort_unless(DocumentStorage::disk()->exists($path), 404);

        return DocumentStorage::disk()->download($path, $shipment->reference.'-manifest.pdf');
    }

    public function queueExport(): RedirectResponse
    {
        ExportShipmentsSpreadsheet::dispatch();

        return back()->with('success', 'Shipment spreadsheet queued.');
    }

    public function downloadExport(): StreamedResponse
    {
        abort_unless(DocumentStorage::disk()->exists(ExportShipmentsSpreadsheet::PATH), 404);

        return DocumentStorage::disk()->download(ExportShipmentsSpreadsheet::PATH, 'shipments.xlsx');
    }
}
