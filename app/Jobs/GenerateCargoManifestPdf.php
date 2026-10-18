<?php

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\Shipment;
use App\Support\DocumentStorage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateCargoManifestPdf implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $shipmentId) {}

    public function handle(): void
    {
        $shipment = Shipment::query()
            ->with(['customer', 'branch', 'documents'])
            ->findOrFail($this->shipmentId);
        $company = CompanySetting::current();

        $pdf = Pdf::loadView('documents.manifest', [
            'shipment' => $shipment,
            'company' => $company,
        ]);

        DocumentStorage::disk()->put($this->path(), $pdf->output());
    }

    public function path(): string
    {
        return "manifests/{$this->shipmentId}.pdf";
    }
}
