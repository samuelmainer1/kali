<?php

namespace App\Jobs;

use App\Exports\InvoicesExport;
use App\Support\DocumentStorage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Maatwebsite\Excel\Facades\Excel;

class ExportInvoicesSpreadsheet implements ShouldQueue
{
    use Queueable;

    public const PATH = 'exports/invoices.xlsx';

    public function handle(): void
    {
        Excel::store(new InvoicesExport, self::PATH, DocumentStorage::name());
    }
}
