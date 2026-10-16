<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextReference(): string
    {
        $year = now()->format('Y');
        $latest = Invoice::query()
            ->where('reference', 'like', "INV-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('INV-%s-%04d', $year, $sequence);
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array{subtotal: float, tax_amount: float, total: float, items: list<array<string, mixed>>}
     */
    public function calculateTotals(array $items, float $taxRate = 0): array
    {
        $normalized = [];
        $subtotal = 0.0;

        foreach (array_values($items) as $index => $item) {
            $qty = (float) ($item['quantity'] ?? 0);
            $price = (float) ($item['unit_price'] ?? 0);
            $line = round($qty * $price, 2);
            $subtotal += $line;

            $normalized[] = [
                'description' => $item['description'],
                'quantity' => $qty,
                'unit' => $item['unit'] ?? null,
                'unit_price' => $price,
                'line_total' => $line,
                'sort_order' => $index,
            ];
        }

        $tax = round($subtotal * $taxRate, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => $tax,
            'total' => round($subtotal + $tax, 2),
            'items' => $normalized,
        ];
    }

    public function create(User $user, array $data, array $items): Invoice
    {
        $totals = $this->calculateTotals($items);

        return DB::transaction(function () use ($user, $data, $totals) {
            $invoice = Invoice::query()->create([
                ...$data,
                'reference' => $this->nextReference(),
                'status' => 'draft',
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'created_by' => $user->id,
                'issue_date' => $data['issue_date'] ?? now()->toDateString(),
            ]);

            $invoice->items()->createMany($totals['items']);
            $this->activityLog->log('invoices.created', "Created invoice {$invoice->reference}", $invoice);

            return $invoice->fresh('items');
        });
    }

    public function createFromQuotation(Quotation $quotation, User $user): Invoice
    {
        if (! in_array($quotation->status, ['approved', 'converted'], true)) {
            throw ValidationException::withMessages([
                'quotation' => 'Only approved or converted quotations can be invoiced.',
            ]);
        }

        if (Invoice::query()->where('quotation_id', $quotation->id)->exists()) {
            throw ValidationException::withMessages([
                'quotation' => 'An invoice already exists for this quotation.',
            ]);
        }

        $quotation->load('items');

        $items = $quotation->items->map(fn ($item) => [
            'description' => $item->description,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'unit_price' => $item->unit_price,
        ])->all();

        return $this->create($user, [
            'customer_id' => $quotation->customer_id,
            'quotation_id' => $quotation->id,
            'shipment_id' => $quotation->converted_shipment_id,
            'currency' => $quotation->currency ?: 'KES',
            'due_date' => now()->addDays(30)->toDateString(),
            'notes' => $quotation->notes,
            'terms' => $quotation->terms,
        ], $items);
    }

    public function update(Invoice $invoice, array $data, array $items): Invoice
    {
        if (! $invoice->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Only draft invoices can be edited.',
            ]);
        }

        $totals = $this->calculateTotals($items);

        return DB::transaction(function () use ($invoice, $data, $totals) {
            $invoice->update([
                ...$data,
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
            ]);

            $invoice->items()->delete();
            $invoice->items()->createMany($totals['items']);

            $this->activityLog->log('invoices.updated', "Updated invoice {$invoice->reference}", $invoice);

            return $invoice->fresh('items');
        });
    }

    public function markStatus(Invoice $invoice, string $status): Invoice
    {
        if (! in_array($status, ['sent', 'paid', 'overdue', 'cancelled'], true)) {
            throw ValidationException::withMessages(['status' => 'Invalid invoice status.']);
        }

        if ($invoice->status === 'cancelled') {
            throw ValidationException::withMessages(['status' => 'Cancelled invoices cannot change status.']);
        }

        $invoice->update([
            'status' => $status,
            'paid_at' => $status === 'paid' ? now() : ($status === 'sent' ? null : $invoice->paid_at),
            'issue_date' => $invoice->issue_date ?? now()->toDateString(),
        ]);

        $this->activityLog->log('invoices.status_changed', "Invoice {$invoice->reference} marked {$status}", $invoice);

        $fresh = $invoice->fresh(['customer:id,name']);

        if ($status === 'overdue') {
            $this->notifyOverdue($fresh);
        }

        return $fresh;
    }

    /**
     * Flag past-due sent invoices as overdue and notify finance.
     */
    public function flagOverdueInvoices(): int
    {
        $invoices = Invoice::query()
            ->where('status', 'sent')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get();

        foreach ($invoices as $invoice) {
            $invoice->update(['status' => 'overdue']);
            $this->activityLog->log('invoices.status_changed', "Invoice {$invoice->reference} marked overdue", $invoice);
            $this->notifyOverdue($invoice->fresh(['customer:id,name']));
        }

        return $invoices->count();
    }

    private function notifyOverdue(Invoice $invoice): void
    {
        $title = "Invoice overdue: {$invoice->reference}";
        $body = "Invoice {$invoice->reference}"
            .($invoice->customer ? " for {$invoice->customer->name}" : '')
            .' is overdue'
            .($invoice->due_date ? ' (due '.$invoice->due_date->toDateString().')' : '')
            .'.';
        $link = url(route('finance.invoices.show', $invoice, false));

        $recipients = app(AppNotificationService::class)->usersWithPermission('invoices.manage');

        if ($invoice->created_by) {
            $creator = User::query()->find($invoice->created_by);
            if ($creator) {
                $recipients = $recipients->push($creator)->unique('id')->values();
            }
        }

        app(AppNotificationService::class)->notifyMany(
            $recipients,
            'invoice.overdue',
            $title,
            $body,
            $link,
            "invoice-overdue-{$invoice->id}",
            ['invoice_id' => $invoice->id],
        );
    }
}
