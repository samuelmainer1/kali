<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0B1220; font-size: 12px; }
        h1 { font-size: 22px; margin: 0; }
        h2 { font-size: 16px; margin-bottom: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border-bottom: 1px solid #e2e8f0; text-align: left; padding: 6px 4px; }
        .muted { color: #64748b; }
    </style>
</head>
<body>
    <h1>{{ $company->company_name }}</h1>
    <p class="muted">
        {{ $company->address }}<br>
        {{ $company->phone }} · {{ $company->email }}
    </p>
    <h2>Cargo manifest {{ $shipment->reference }}</h2>
    <p>
        Customer: {{ $shipment->customer?->name ?: '—' }}<br>
        Air waybill: {{ $shipment->tracking_number ?: '—' }}<br>
        Status: {{ str_replace('_', ' ', $shipment->status) }}<br>
        Route: {{ $shipment->origin_country ?: '—' }} → {{ $shipment->destination_country ?: '—' }}<br>
        Location: {{ $shipment->current_location ?: '—' }}<br>
        Service: {{ $shipment->service_type ?: '—' }}
        · Pieces: {{ $shipment->pieces }}
        · Weight: {{ $shipment->weight_kg ?: '—' }} kg<br>
        Branch: {{ $shipment->branch?->name ?: '—' }}
    </p>
    <table>
        <thead>
            <tr>
                <th>Document</th>
                <th>File</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($shipment->documents as $document)
                <tr>
                    <td>{{ $document->typeLabel() }}</td>
                    <td>{{ $document->original_name }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="2">No air waybill, packing list, or proof of delivery stored yet.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
    @if ($shipment->notes)
        <p><strong>Notes</strong><br>{{ $shipment->notes }}</p>
    @endif
</body>
</html>
