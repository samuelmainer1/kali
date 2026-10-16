<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentDocument;
use App\Support\DocumentStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShipmentDocumentController extends Controller
{
    public function store(Request $request, Shipment $shipment): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(ShipmentDocument::TYPES))],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('file');
        $path = $file->store("shipments/{$shipment->id}", DocumentStorage::name());

        $shipment->documents()->create([
            'type' => $data['type'],
            'disk' => DocumentStorage::name(),
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Document stored on the private disk.');
    }

    public function download(Request $request, Shipment $shipment, ShipmentDocument $document): StreamedResponse
    {
        abort_unless($document->shipment_id === $shipment->id, 404);

        $user = $request->user();
        $canView = $user->can('shipments.view')
            || ($user->can('portal.shipments') && $shipment->customer?->email === $user->email);

        abort_unless($canView, 403);
        abort_unless(DocumentStorage::disk()->exists($document->path), 404);

        return DocumentStorage::disk()->download($document->path, $document->original_name);
    }
}
