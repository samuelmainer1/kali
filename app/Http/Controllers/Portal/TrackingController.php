<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $shipments = Shipment::query()
            ->with('customer:id,name')
            ->forCustomerUser($request->user())
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('tracking_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($customers) => $customers->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Shipment $shipment) => [
                'id' => $shipment->id,
                'reference' => $shipment->reference,
                'tracking_number' => $shipment->tracking_number,
                'customer' => $shipment->customer?->name,
                'status_label' => Shipment::label($shipment->status),
                'origin_country' => $shipment->origin_country,
                'destination_country' => $shipment->destination_country,
            ]);

        return Inertia::render('Portal/Shipments', [
            'shipments' => $shipments,
            'filters' => ['search' => $search],
        ]);
    }

    public function show(Request $request, Shipment $shipment): Response
    {
        abort_unless($shipment->customer?->email === $request->user()->email, 403);

        $shipment->load(['statusHistories.changer:id,name', 'documents', 'driver:id,name', 'vehicle:id,registration,name', 'proofOfDelivery']);

        return Inertia::render('Portal/Shipment', [
            'shipment' => [
                'id' => $shipment->id,
                'reference' => $shipment->reference,
                'tracking_number' => $shipment->tracking_number,
                'status_label' => Shipment::label($shipment->status),
                'origin_country' => $shipment->origin_country,
                'destination_country' => $shipment->destination_country,
                'current_location' => $shipment->current_location,
                'driver' => $shipment->driver?->name,
                'vehicle' => $shipment->vehicle ? $shipment->vehicle->registration.' · '.$shipment->vehicle->name : null,
                'proof' => $shipment->proofOfDelivery ? [
                    'received_by' => $shipment->proofOfDelivery->received_by,
                    'received_at' => $shipment->proofOfDelivery->received_at?->format('d M Y H:i'),
                    'notes' => $shipment->proofOfDelivery->notes,
                    'has_photo' => (bool) $shipment->proofOfDelivery->photo_path,
                ] : null,
                'lifecycle' => Shipment::STATUSES,
                'status' => $shipment->status,
                'history' => $shipment->statusHistories->map(fn ($history) => [
                    'id' => $history->id,
                    'to_status' => $history->to_status,
                    'notes' => $history->notes,
                    'created_at_human' => $history->created_at?->diffForHumans(),
                ]),
                'documents' => $shipment->documents->map(fn (ShipmentDocument $document) => [
                    'id' => $document->id,
                    'type_label' => $document->typeLabel(),
                    'original_name' => $document->original_name,
                ]),
            ],
        ]);
    }
}
