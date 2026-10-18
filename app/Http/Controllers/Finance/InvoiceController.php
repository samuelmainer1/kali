<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Jobs\ExportInvoicesSpreadsheet;
use App\Jobs\GenerateInvoicePdf;
use App\Models\CompanySetting;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Services\InvoiceService;
use App\Support\DocumentStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoices) {}

    public function index(Request $request): Response
    {
        $invoices = Invoice::query()
            ->with(['customer:id,name', 'creator:id,name'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'reference' => $invoice->reference,
                'customer' => $invoice->customer?->name,
                'status' => $invoice->status,
                'status_label' => Invoice::label($invoice->status),
                'currency' => $invoice->currency,
                'total' => $invoice->total,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'created_by' => $invoice->creator?->name,
            ]);

        return Inertia::render('Finance/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status']),
            'statuses' => Invoice::STATUSES,
            'stats' => [
                'draft' => Invoice::query()->where('status', 'draft')->count(),
                'sent' => Invoice::query()->where('status', 'sent')->count(),
                'paid' => Invoice::query()->where('status', 'paid')->count(),
                'overdue' => Invoice::query()->where('status', 'overdue')->count(),
            ],
            'export_ready' => DocumentStorage::disk()->exists(ExportInvoicesSpreadsheet::PATH),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Finance/Invoices/Form', [
            'invoice' => null,
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name']),
            'prefill' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $invoice = $this->invoices->create($request->user(), $data, $data['items']);

        return redirect()
            ->route('finance.invoices.show', $invoice)
            ->with('success', 'Invoice created.');
    }

    public function fromQuotation(Request $request, Quotation $quotation): RedirectResponse
    {
        abort_unless($request->user()->can('invoices.manage'), 403);

        $invoice = $this->invoices->createFromQuotation($quotation, $request->user());

        return redirect()
            ->route('finance.invoices.show', $invoice)
            ->with('success', "Invoice {$invoice->reference} created from quotation.");
    }

    public function show(Invoice $invoice): Response
    {
        $invoice->load([
            'customer:id,name,email,phone,tax_number,country',
            'quotation:id,reference',
            'shipment:id,reference',
            'creator:id,name',
            'items',
        ]);

        return Inertia::render('Finance/Invoices/Show', [
            'invoice' => $this->detailPayload($invoice),
            'company' => $this->companyPayload(),
            'pdf_ready' => DocumentStorage::disk()->exists((new GenerateInvoicePdf($invoice->id))->path()),
        ]);
    }

    public function print(Invoice $invoice): Response
    {
        $invoice->load([
            'customer:id,name,email,phone,tax_number,country',
            'quotation:id,reference',
            'shipment:id,reference',
            'items',
        ]);

        return Inertia::render('Finance/Invoices/Print', [
            'invoice' => $this->detailPayload($invoice),
            'company' => $this->companyPayload(),
        ]);
    }

    public function queuePdf(Invoice $invoice): RedirectResponse
    {
        GenerateInvoicePdf::dispatch($invoice->id);

        return back()->with('success', 'Invoice PDF queued.');
    }

    public function downloadPdf(Invoice $invoice): StreamedResponse
    {
        $path = (new GenerateInvoicePdf($invoice->id))->path();
        abort_unless(DocumentStorage::disk()->exists($path), 404);

        return DocumentStorage::disk()->download($path, $invoice->reference.'.pdf');
    }

    public function queueExport(): RedirectResponse
    {
        ExportInvoicesSpreadsheet::dispatch();

        return back()->with('success', 'Invoice spreadsheet queued.');
    }

    public function downloadExport(): StreamedResponse
    {
        abort_unless(DocumentStorage::disk()->exists(ExportInvoicesSpreadsheet::PATH), 404);

        return DocumentStorage::disk()->download(ExportInvoicesSpreadsheet::PATH, 'invoices.xlsx');
    }

    public function edit(Invoice $invoice): Response
    {
        abort_unless($invoice->isEditable(), 403);

        $invoice->load('items');

        return Inertia::render('Finance/Invoices/Form', [
            'invoice' => [
                'id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'currency' => $invoice->currency,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'notes' => $invoice->notes,
                'terms' => $invoice->terms,
                'items' => $invoice->items->map(fn ($item) => [
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => $item->unit_price,
                ]),
            ],
            'customers' => Customer::query()->orderBy('name')->get(['id', 'name']),
            'prefill' => null,
        ]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $this->validated($request);
        $this->invoices->update($invoice, $data, $data['items']);

        return redirect()
            ->route('finance.invoices.show', $invoice)
            ->with('success', 'Invoice updated.');
    }

    public function markStatus(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['sent', 'paid', 'overdue', 'cancelled'])],
        ]);

        $this->invoices->markStatus($invoice, $data['status']);

        return back()->with('success', 'Invoice status updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'currency' => ['required', 'string', 'size:3'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:40'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function detailPayload(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'reference' => $invoice->reference,
            'status' => $invoice->status,
            'status_label' => Invoice::label($invoice->status),
            'currency' => $invoice->currency,
            'subtotal' => $invoice->subtotal,
            'tax_amount' => $invoice->tax_amount,
            'total' => $invoice->total,
            'issue_date' => $invoice->issue_date?->toDateString(),
            'due_date' => $invoice->due_date?->toDateString(),
            'paid_at' => $invoice->paid_at?->toDateTimeString(),
            'notes' => $invoice->notes,
            'terms' => $invoice->terms,
            'is_editable' => $invoice->isEditable(),
            'customer' => $invoice->customer,
            'quotation' => $invoice->quotation,
            'shipment' => $invoice->shipment,
            'creator' => $invoice->creator?->name,
            'items' => $invoice->items,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function companyPayload(): array
    {
        $company = CompanySetting::current();

        return [
            'company_name' => $company->company_name,
            'trading_name' => $company->trading_name,
            'email' => $company->email,
            'phone' => $company->phone,
            'website' => $company->website,
            'address' => $company->address,
        ];
    }
}
