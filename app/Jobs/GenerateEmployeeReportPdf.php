<?php

namespace App\Jobs;

use App\Models\CompanySetting;
use App\Models\EmployeeReport;
use App\Support\DocumentStorage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateEmployeeReportPdf implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $reportId) {}

    public function handle(): void
    {
        $report = EmployeeReport::query()
            ->with(['author', 'department', 'branch', 'reviewer'])
            ->findOrFail($this->reportId);
        $company = CompanySetting::current();

        $pdf = Pdf::loadView('documents.employee-report', [
            'report' => $report,
            'company' => $company,
        ]);

        DocumentStorage::disk()->put($this->path(), $pdf->output());
    }

    public function path(): string
    {
        return "reports/{$this->reportId}.pdf";
    }
}
