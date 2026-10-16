<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use App\Models\User;
use App\Services\MarketingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function __construct(private readonly MarketingService $marketing)
    {
    }

    public function index(Request $request): Response
    {
        $leads = MarketingLead::query()
            ->with(['campaign:id,name,reference', 'assignee:id,name', 'customer:id,name'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (MarketingLead $lead) => [
                'id' => $lead->id,
                'name' => $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'company' => $lead->company,
                'source' => $lead->source,
                'status' => $lead->status,
                'status_label' => MarketingLead::label($lead->status),
                'campaign' => $lead->campaign?->reference,
                'assignee' => $lead->assignee?->name,
            ]);

        return Inertia::render('Marketing/Leads/Index', [
            'leads' => $leads,
            'filters' => $request->only(['search', 'status']),
            'statuses' => MarketingLead::STATUSES,
            'stats' => [
                'new' => MarketingLead::query()->where('status', 'new')->count(),
                'qualified' => MarketingLead::query()->where('status', 'qualified')->count(),
                'converted' => MarketingLead::query()->where('status', 'converted')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Marketing/Leads/Form', [
            'lead' => null,
            'options' => $this->options(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $lead = $this->marketing->createLead($this->validated($request));

        return redirect()
            ->route('marketing.leads.index')
            ->with('success', "Lead {$lead->name} created.");
    }

    public function edit(MarketingLead $lead): Response
    {
        return Inertia::render('Marketing/Leads/Form', [
            'lead' => $lead->only([
                'id', 'name', 'email', 'phone', 'company', 'source', 'status',
                'campaign_id', 'customer_id', 'assigned_to', 'notes',
            ]),
            'options' => $this->options(),
        ]);
    }

    public function update(Request $request, MarketingLead $lead): RedirectResponse
    {
        $this->marketing->updateLead($lead, $this->validated($request));

        return redirect()
            ->route('marketing.leads.index')
            ->with('success', 'Lead updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:120'],
            'status' => ['required', Rule::in(MarketingLead::STATUSES)],
            'campaign_id' => ['nullable', 'exists:marketing_campaigns,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'statuses' => MarketingLead::STATUSES,
            'campaigns' => MarketingCampaign::query()->latest()->get(['id', 'name', 'reference']),
            'customers' => Customer::query()->orderBy('name')->limit(100)->get(['id', 'name']),
            'users' => User::role(['marketing', 'sales', 'administrator'])->orderBy('name')->get(['id', 'name']),
        ];
    }
}
