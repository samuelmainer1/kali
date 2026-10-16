<?php

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\Invoice;
use App\Support\DocumentStorage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateInvoicePdf implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $invoiceId) {}

    public function handle(): void
    {
        $invoice = Invoice::query()->with(['customer', 'items'])->findOrFail($this->invoiceId);
        $company = CompanySetting::current();

        $pdf = Pdf::loadView('documents.invoice', [
            'invoice' => $invoice,
            'company' => $company,
        ]);

        DocumentStorage::disk()->put($this->path(), $pdf->output());
    }

    public function path(): string
    {
        return "invoices/{$this->invoiceId}.pdf";
    }
}
