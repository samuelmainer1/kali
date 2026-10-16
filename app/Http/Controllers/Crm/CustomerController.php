<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function index(Request $request): Response
    {
        $customers = Customer::query()
            ->with(['salesperson:id,name', 'contacts' => fn ($q) => $q->where('is_primary', true)])
            ->withCount(['contacts', 'quotations'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('trading_name', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'trading_name' => $customer->trading_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'country' => $customer->country,
                'status' => $customer->status,
                'salesperson' => $customer->salesperson?->name,
                'contacts_count' => $customer->contacts_count,
                'quotations_count' => $customer->quotations_count,
                'primary_contact' => $customer->contacts->first()?->name,
            ]);

        return Inertia::render('Crm/Customers/Index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'status']),
            'statuses' => Customer::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Crm/Customers/Form', [
            'customer' => null,
            'salespeople' => $this->salespeople(),
            'statuses' => Customer::STATUSES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $customer = DB::transaction(function () use ($data) {
            $customer = Customer::query()->create(collect($data)->except(['contacts', 'addresses'])->all());
            $this->syncRelations($customer, $data['contacts'] ?? [], $data['addresses'] ?? []);

            return $customer;
        });

        $this->activityLog->log('customers.created', "Created customer {$customer->name}", $customer);

        return redirect()
            ->route('crm.customers.show', $customer)
            ->with('success', 'Customer created.');
    }

    public function show(Customer $customer): Response
    {
        $customer->load([
            'salesperson:id,name,email',
            'contacts',
            'addresses',
            'quotations' => fn ($q) => $q->latest()->limit(10),
        ]);

        return Inertia::render('Crm/Customers/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'trading_name' => $customer->trading_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'website' => $customer->website,
                'country' => $customer->country,
                'tax_number' => $customer->tax_number,
                'status' => $customer->status,
                'notes' => $customer->notes,
                'assigned_salesperson_id' => $customer->assigned_salesperson_id,
                'salesperson' => $customer->salesperson,
                'contacts' => $customer->contacts,
                'addresses' => $customer->addresses,
                'quotations' => $customer->quotations->map(fn ($q) => [
                    'id' => $q->id,
                    'reference' => $q->reference,
                    'status' => $q->status,
                    'total' => $q->total,
                    'currency' => $q->currency,
                    'created_at' => $q->created_at?->toDateString(),
                ]),
            ],
        ]);
    }

    public function edit(Customer $customer): Response
    {
        $customer->load(['contacts', 'addresses']);

        return Inertia::render('Crm/Customers/Form', [
            'customer' => $customer,
            'salespeople' => $this->salespeople(),
            'statuses' => Customer::STATUSES,
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $this->validated($request, $customer->id);

        DB::transaction(function () use ($customer, $data) {
            $customer->update(collect($data)->except(['contacts', 'addresses'])->all());
            $customer->contacts()->delete();
            $customer->addresses()->delete();
            $this->syncRelations($customer, $data['contacts'] ?? [], $data['addresses'] ?? []);
        });

        $this->activityLog->log('customers.updated', "Updated customer {$customer->name}", $customer);

        return redirect()
            ->route('crm.customers.show', $customer)
            ->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->quotations()->exists()) {
            return back()->with('error', 'Cannot delete a customer with quotations. Set status to inactive instead.');
        }

        $name = $customer->name;
        $customer->delete();
        $this->activityLog->log('customers.deleted', "Deleted customer {$name}");

        return redirect()
            ->route('crm.customers.index')
            ->with('success', 'Customer deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $customerId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trading_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:120'],
            'tax_number' => ['nullable', 'string', 'max:80'],
            'status' => ['required', Rule::in(Customer::STATUSES)],
            'assigned_salesperson_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'contacts' => ['array'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
            'contacts.*.job_title' => ['nullable', 'string', 'max:120'],
            'contacts.*.is_primary' => ['boolean'],
            'addresses' => ['array'],
            'addresses.*.label' => ['required', 'string', 'max:50'],
            'addresses.*.line1' => ['required', 'string', 'max:255'],
            'addresses.*.line2' => ['nullable', 'string', 'max:255'],
            'addresses.*.city' => ['nullable', 'string', 'max:120'],
            'addresses.*.state' => ['nullable', 'string', 'max:120'],
            'addresses.*.postal_code' => ['nullable', 'string', 'max:40'],
            'addresses.*.country' => ['required', 'string', 'max:120'],
            'addresses.*.is_default' => ['boolean'],
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $contacts
     * @param  list<array<string, mixed>>  $addresses
     */
    private function syncRelations(Customer $customer, array $contacts, array $addresses): void
    {
        foreach ($contacts as $contact) {
            $customer->contacts()->create([
                'name' => $contact['name'],
                'email' => $contact['email'] ?? null,
                'phone' => $contact['phone'] ?? null,
                'job_title' => $contact['job_title'] ?? null,
                'is_primary' => (bool) ($contact['is_primary'] ?? false),
            ]);
        }

        foreach ($addresses as $address) {
            $customer->addresses()->create([
                'label' => $address['label'],
                'line1' => $address['line1'],
                'line2' => $address['line2'] ?? null,
                'city' => $address['city'] ?? null,
                'state' => $address['state'] ?? null,
                'postal_code' => $address['postal_code'] ?? null,
                'country' => $address['country'],
                'is_default' => (bool) ($address['is_default'] ?? false),
            ]);
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id:int,name:string}>
     */
    private function salespeople()
    {
        return User::role(['sales', 'administrator', 'management'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
