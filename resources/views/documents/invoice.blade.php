<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0B1220; font-size: 12px; }
        h1 { font-size: 22px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border-bottom: 1px solid #e2e8f0; text-align: left; padding: 6px 4px; }
        .right { text-align: right; }
        .muted { color: #64748b; }
    </style>
</head>
<body>
    <h1>{{ $company->company_name }}</h1>
    <p class="muted">
        {{ $company->address }}<br>
        {{ $company->phone }} · {{ $company->email }}
    </p>
    <h2>Invoice {{ $invoice->reference }}</h2>
    <p>
        {{ $invoice->customer?->name }}<br>
        Status: {{ $invoice->status }}<br>
        Issue date: {{ $invoice->issue_date?->toDateString() ?: '—' }}
        · Due date: {{ $invoice->due_date?->toDateString() ?: '—' }}
    </p>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="right">{{ $item->quantity }}</td>
                    <td class="right">{{ $item->unit_price }}</td>
                    <td class="right">{{ $item->line_total }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <p class="right"><strong>{{ $invoice->currency }} {{ $invoice->total }}</strong></p>
</body>
</html>
