<?php

namespace App\Console\Commands;

use App\Services\InvoiceService;
use Illuminate\Console\Command;

class FlagOverdueInvoices extends Command
{
    protected $signature = 'invoices:flag-overdue';

    protected $description = 'Mark past-due sent invoices as overdue and notify finance';

    public function handle(InvoiceService $invoices): int
    {
        $count = $invoices->flagOverdueInvoices();
        $this->info("Flagged {$count} invoice(s) as overdue.");

        return self::SUCCESS;
    }
}
