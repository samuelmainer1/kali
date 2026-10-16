<?php

namespace App\Services;

use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use App\Models\User;

class MarketingService
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function nextCampaignReference(): string
    {
        $year = now()->format('Y');
        $latest = MarketingCampaign::query()
            ->where('reference', 'like', "MC-{$year}-%")
            ->orderByDesc('id')
            ->value('reference');

        $sequence = 1;
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return sprintf('MC-%s-%04d', $year, $sequence);
    }

    public function createCampaign(User $user, array $data): MarketingCampaign
    {
        $campaign = MarketingCampaign::query()->create([
            ...$data,
            'reference' => $this->nextCampaignReference(),
            'created_by' => $user->id,
        ]);

        $this->activityLog->log('marketing.campaign_created', "Created campaign {$campaign->reference}", $campaign);

        return $campaign;
    }

    public function updateCampaign(MarketingCampaign $campaign, array $data): MarketingCampaign
    {
        $campaign->update($data);
        $this->activityLog->log('marketing.campaign_updated', "Updated campaign {$campaign->reference}", $campaign);

        return $campaign->fresh();
    }

    public function createLead(array $data): MarketingLead
    {
        $lead = MarketingLead::query()->create($data);
        $this->activityLog->log('marketing.lead_created', "Created lead {$lead->name}", $lead);

        return $lead;
    }

    public function updateLead(MarketingLead $lead, array $data): MarketingLead
    {
        $lead->update($data);
        $this->activityLog->log('marketing.lead_updated', "Updated lead {$lead->name}", $lead);

        return $lead->fresh();
    }
}
