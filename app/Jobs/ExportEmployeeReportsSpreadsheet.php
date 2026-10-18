<?php

namespace App\Jobs;

use App\Exports\EmployeeReportsExport;
use App\Support\DocumentStorage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Maatwebsite\Excel\Facades\Excel;

class ExportEmployeeReportsSpreadsheet implements ShouldQueue
{
    use Queueable;

    public const PATH = 'exports/employee-reports.xlsx';

    public function handle(): void
    {
        Excel::store(new EmployeeReportsExport, self::PATH, DocumentStorage::name());
    }
}
