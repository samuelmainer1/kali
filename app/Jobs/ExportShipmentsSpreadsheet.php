<?php

namespace App\Jobs;

use App\Exports\ShipmentsExport;
use App\Support\DocumentStorage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Maatwebsite\Excel\Facades\Excel;

class ExportShipmentsSpreadsheet implements ShouldQueue
{
    use Queueable;

    public const PATH = 'exports/shipments.xlsx';

    public function handle(): void
    {
        Excel::store(new ShipmentsExport, self::PATH, DocumentStorage::name());
    }
}
