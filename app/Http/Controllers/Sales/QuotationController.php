<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\ShippingRate;
use App\Services\QuotationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(private readonly QuotationService $quotations) {}

    public function index(Request $request): Response
    {
        $items = Quotation::query()
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
            ->through(fn (Quotation $quotation) => [
                'id' => $quotation->id,
                'reference' => $quotation->reference,
                'customer' => $quotation->customer?->name,
                'status' => $quotation->status,
                'total' => $quotation->total,
                'currency' => $quotation->currency,
                'service_type' => $quotation->service_type,
                'creator' => $quotation->creator?->name,
                'valid_until' => $quotation->valid_until?->toDateString(),
                'created_at' => $quotation->created_at?->toDateString(),
            ]);

        return Inertia::render('Sales/Quotations/Index', [
            'quotations' => $items,
            'filters' => $request->only(['search', 'status']),
            'statuses' => Quotation::STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Sales/Quotations/Form', [
            'quotation' => null,
            'customers' => $this->customerOptions(),
            'serviceTypes' => Quotation::SERVICE_TYPES,
            'rates' => $this->rateOptions(),
            'preselectedCustomerId' => $request->integer('customer_id') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $totals = $this->quotations->calculateTotals($data['items']);

        $quotation = DB::transaction(function () use ($request, $data, $totals) {
            $quotation = Quotation::query()->create([
                'reference' => $this->quotations->nextReference('QT'),
                'customer_id' => $data['customer_id'],
                'contact_id' => $data['contact_id'] ?? null,
                'created_by' => $request->user()->id,
                'status' => 'draft',
                'valid_until' => $data['valid_until'] ?? null,
                'currency' => $data['currency'] ?? 'KES',
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'origin_country' => $data['origin_country'] ?? null,
                'destination_country' => $data['destination_country'] ?? null,
                'service_type' => $data['service_type'] ?? null,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
            ]);

            $quotation->items()->createMany($totals['items']);

            return $quotation;
        });

        return redirect()
            ->route('sales.quotations.show', $quotation)
            ->with('success', 'Quotation created.');
    }

    public function show(Quotation $quotation): Response
    {
        $quotation->load(['customer', 'contact', 'creator:id,name', 'items', 'shipment:id,reference,status']);

        return Inertia::render('Sales/Quotations/Show', [
            'quotation' => [
                'id' => $quotation->id,
                'reference' => $quotation->reference,
                'status' => $quotation->status,
                'valid_until' => $quotation->valid_until?->toDateString(),
                'currency' => $quotation->currency,
                'subtotal' => $quotation->subtotal,
                'tax_amount' => $quotation->tax_amount,
                'total' => $quotation->total,
                'origin_country' => $quotation->origin_country,
                'destination_country' => $quotation->destination_country,
                'service_type' => $quotation->service_type,
                'notes' => $quotation->notes,
                'terms' => $quotation->terms,
                'rejection_reason' => $quotation->rejection_reason,
                'is_editable' => $quotation->isEditable(),
                'customer' => $quotation->customer,
                'contact' => $quotation->contact,
                'creator' => $quotation->creator,
                'items' => $quotation->items,
                'shipment' => $quotation->shipment,
            ],
        ]);
    }

    public function edit(Quotation $quotation): Response
    {
        abort_unless($quotation->isEditable(), 403, 'This quotation can no longer be edited.');

        $quotation->load(['items', 'customer.contacts']);

        return Inertia::render('Sales/Quotations/Form', [
            'quotation' => [
                'id' => $quotation->id,
                'customer_id' => $quotation->customer_id,
                'contact_id' => $quotation->contact_id,
                'valid_until' => $quotation->valid_until?->toDateString(),
                'currency' => $quotation->currency,
                'origin_country' => $quotation->origin_country,
                'destination_country' => $quotation->destination_country,
                'service_type' => $quotation->service_type,
                'notes' => $quotation->notes,
                'terms' => $quotation->terms,
                'items' => $quotation->items->map(fn ($item) => [
                    'description' => $item->description,
                    'quantity' => (float) $item->quantity,
                    'unit' => $item->unit,
                    'unit_price' => (float) $item->unit_price,
                    'weight_kg' => $item->weight_kg !== null ? (float) $item->weight_kg : null,
                ]),
            ],
            'customers' => $this->customerOptions(),
            'serviceTypes' => Quotation::SERVICE_TYPES,
            'rates' => $this->rateOptions(),
            'preselectedCustomerId' => null,
        ]);
    }

    public function update(Request $request, Quotation $quotation): RedirectResponse
    {
        abort_unless($quotation->isEditable(), 403);

        $data = $this->validated($request);
        $totals = $this->quotations->calculateTotals($data['items']);

        DB::transaction(function () use ($quotation, $data, $totals) {
            $quotation->update([
                'customer_id' => $data['customer_id'],
                'contact_id' => $data['contact_id'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
                'currency' => $data['currency'] ?? 'KES',
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'origin_country' => $data['origin_country'] ?? null,
                'destination_country' => $data['destination_country'] ?? null,
                'service_type' => $data['service_type'] ?? null,
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? null,
                'status' => 'draft',
            ]);

            $quotation->items()->delete();
            $quotation->items()->createMany($totals['items']);
        });

        return redirect()
            ->route('sales.quotations.show', $quotation)
            ->with('success', 'Quotation updated.');
    }

    public function submit(Quotation $quotation): RedirectResponse
    {
        $this->quotations->submitForApproval($quotation);

        return back()->with('success', 'Quotation submitted for approval.');
    }

    public function approve(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->quotations->approve($quotation, $request->user());

        return back()->with('success', 'Quotation approved.');
    }

    public function reject(Request $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->quotations->reject($quotation, $request->user(), $data['rejection_reason']);

        return back()->with('success', 'Quotation rejected.');
    }

    public function convert(Request $request, Quotation $quotation): RedirectResponse
    {
        $shipment = $this->quotations->convertToShipment($quotation, $request->user());

        return redirect()
            ->route('operations.shipments.show', $shipment)
            ->with('success', "Converted to shipment {$shipment->reference}.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'contact_id' => ['nullable', 'exists:customer_contacts,id'],
            'valid_until' => ['nullable', 'date'],
            'currency' => ['required', 'string', 'size:3'],
            'origin_country' => ['nullable', 'string', 'max:120'],
            'destination_country' => ['nullable', 'string', 'max:120'],
            'service_type' => ['nullable', Rule::in(Quotation::SERVICE_TYPES)],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:40'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.weight_kg' => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    private function customerOptions()
    {
        return Customer::query()
            ->with(['contacts:id,customer_id,name,is_primary'])
            ->whereIn('status', ['lead', 'active'])
            ->orderBy('name')
            ->get(['id', 'name', 'status'])
            ->map(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'status' => $customer->status,
                'contacts' => $customer->contacts->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'is_primary' => $c->is_primary,
                ]),
            ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rateOptions(): array
    {
        return ShippingRate::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (ShippingRate $rate) => [
                'id' => $rate->id,
                'label' => $rate->name.' · '.$rate->origin.' → '.$rate->destination.' · '.$rate->currency.' '.number_format((float) $rate->price, 2),
                'price' => (float) $rate->price,
                'currency' => $rate->currency,
                'description' => $rate->name.': '.$rate->origin.' to '.$rate->destination,
            ])
            ->all();
    }
}
