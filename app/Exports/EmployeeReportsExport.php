<?php

namespace App\Exports;

use App\Models\EmployeeReport;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class EmployeeReportsExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return EmployeeReport::query()
            ->with(['author:id,name', 'department:id,name'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (EmployeeReport $report) => [
                $report->reference,
                $report->author?->name,
                $report->department?->name,
                $report->period_type,
                $report->period_start?->toDateString(),
                $report->period_end?->toDateString(),
                $report->title,
                $report->status,
            ]);
    }

    public function headings(): array
    {
        return ['Reference', 'Author', 'Department', 'Period', 'Start', 'End', 'Title', 'Status'];
    }
}
