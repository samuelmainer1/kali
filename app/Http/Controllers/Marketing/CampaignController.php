<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use App\Services\MarketingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function __construct(private readonly MarketingService $marketing)
    {
    }

    public function index(Request $request): Response
    {
        $campaigns = MarketingCampaign::query()
            ->with('creator:id,name')
            ->withCount('leads')
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('reference', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('channel'), fn ($q) => $q->where('channel', $request->string('channel')))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (MarketingCampaign $campaign) => [
                'id' => $campaign->id,
                'reference' => $campaign->reference,
                'name' => $campaign->name,
                'channel' => $campaign->channel,
                'status' => $campaign->status,
                'status_label' => MarketingCampaign::label($campaign->status),
                'budget' => $campaign->budget,
                'currency' => $campaign->currency,
                'start_date' => $campaign->start_date?->toDateString(),
                'end_date' => $campaign->end_date?->toDateString(),
                'leads_count' => $campaign->leads_count,
                'creator' => $campaign->creator?->name,
            ]);

        return Inertia::render('Marketing/Campaigns/Index', [
            'campaigns' => $campaigns,
            'filters' => $request->only(['search', 'status', 'channel']),
            'statuses' => MarketingCampaign::STATUSES,
            'channels' => MarketingCampaign::CHANNELS,
            'stats' => [
                'active' => MarketingCampaign::query()->where('status', 'active')->count(),
                'scheduled' => MarketingCampaign::query()->where('status', 'scheduled')->count(),
                'draft' => MarketingCampaign::query()->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Marketing/Campaigns/Form', [
            'campaign' => null,
            'statuses' => MarketingCampaign::STATUSES,
            'channels' => MarketingCampaign::CHANNELS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $campaign = $this->marketing->createCampaign($request->user(), $this->validated($request));

        return redirect()
            ->route('marketing.campaigns.show', $campaign)
            ->with('success', 'Campaign created.');
    }

    public function show(MarketingCampaign $campaign): Response
    {
        $campaign->load(['creator:id,name', 'leads' => fn ($q) => $q->latest()->limit(20)]);

        return Inertia::render('Marketing/Campaigns/Show', [
            'campaign' => [
                'id' => $campaign->id,
                'reference' => $campaign->reference,
                'name' => $campaign->name,
                'channel' => $campaign->channel,
                'status' => $campaign->status,
                'status_label' => MarketingCampaign::label($campaign->status),
                'audience' => $campaign->audience,
                'content' => $campaign->content,
                'budget' => $campaign->budget,
                'currency' => $campaign->currency,
                'start_date' => $campaign->start_date?->toDateString(),
                'end_date' => $campaign->end_date?->toDateString(),
                'metrics' => $campaign->metrics,
                'notes' => $campaign->notes,
                'creator' => $campaign->creator?->name,
                'leads' => $campaign->leads->map(fn ($lead) => [
                    'id' => $lead->id,
                    'name' => $lead->name,
                    'status' => $lead->status,
                    'email' => $lead->email,
                    'company' => $lead->company,
                ]),
            ],
        ]);
    }

    public function edit(MarketingCampaign $campaign): Response
    {
        return Inertia::render('Marketing/Campaigns/Form', [
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'channel' => $campaign->channel,
                'status' => $campaign->status,
                'audience' => $campaign->audience,
                'content' => $campaign->content,
                'budget' => $campaign->budget,
                'currency' => $campaign->currency,
                'start_date' => $campaign->start_date?->toDateString(),
                'end_date' => $campaign->end_date?->toDateString(),
                'notes' => $campaign->notes,
            ],
            'statuses' => MarketingCampaign::STATUSES,
            'channels' => MarketingCampaign::CHANNELS,
        ]);
    }

    public function update(Request $request, MarketingCampaign $campaign): RedirectResponse
    {
        $this->marketing->updateCampaign($campaign, $this->validated($request));

        return redirect()
            ->route('marketing.campaigns.show', $campaign)
            ->with('success', 'Campaign updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel' => ['required', Rule::in(MarketingCampaign::CHANNELS)],
            'status' => ['required', Rule::in(MarketingCampaign::STATUSES)],
            'audience' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
