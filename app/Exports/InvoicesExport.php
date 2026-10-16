<?php

namespace App\Exports;

use App\Models\Invoice;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class InvoicesExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return Invoice::query()
            ->with('customer:id,name')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Invoice $invoice) => [
                $invoice->reference,
                $invoice->customer?->name,
                $invoice->status,
                $invoice->currency,
                $invoice->total,
                $invoice->issue_date?->toDateString(),
                $invoice->due_date?->toDateString(),
            ]);
    }

    public function headings(): array
    {
        return ['Reference', 'Customer', 'Status', 'Currency', 'Total', 'Issue date', 'Due date'];
    }
}
