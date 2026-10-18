<?php

namespace App\Exports;

use App\Models\Shipment;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ShipmentsExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return Shipment::query()
            ->with('customer:id,name')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Shipment $shipment) => [
                $shipment->reference,
                $shipment->tracking_number,
                $shipment->customer?->name,
                $shipment->status,
                $shipment->origin_country,
                $shipment->destination_country,
                $shipment->pieces,
                $shipment->weight_kg,
                $shipment->service_type,
            ]);
    }

    public function headings(): array
    {
        return [
            'Job number',
            'Air waybill',
            'Customer',
            'Status',
            'Origin',
            'Destination',
            'Pieces',
            'Weight kg',
            'Service',
        ];
    }
}
