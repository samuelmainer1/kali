<?php

namespace Tests\Feature;

use App\Models\MarketingCampaign;
use App\Models\MarketingLead;
use App\Models\SupportTicket;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportMarketingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_customer_can_open_ticket_and_care_can_manage(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $care = User::factory()->create();
        $care->assignRole('customer_care');

        $this->actingAs($customer)
            ->post(route('support.store'), [
                'subject' => 'Delay on delivery',
                'description' => 'Shipment has not arrived as expected.',
                'priority' => 'high',
                'category' => 'shipment',
                'customer_id' => null,
                'shipment_id' => null,
            ])
            ->assertRedirect();

        $ticket = SupportTicket::query()->first();
        $this->assertNotNull($ticket);
        $this->assertSame('open', $ticket->status);
        $this->assertSame($customer->id, $ticket->requester_id);

        $this->actingAs($care)
            ->put(route('support.update', $ticket), [
                'status' => 'in_progress',
                'priority' => 'high',
                'assigned_to' => $care->id,
            ])
            ->assertRedirect();

        $this->actingAs($care)
            ->post(route('support.reply', $ticket), [
                'body' => 'We are checking with operations.',
                'is_internal' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('support_ticket_replies', [
            'support_ticket_id' => $ticket->id,
            'user_id' => $care->id,
            'is_internal' => 0,
        ]);
    }

    public function test_customer_cannot_see_other_tickets(): void
    {
        $a = User::factory()->create();
        $a->assignRole('customer');
        $b = User::factory()->create();
        $b->assignRole('customer');

        $ticket = SupportTicket::query()->create([
            'reference' => 'TK-2026-0001',
            'subject' => 'Private',
            'description' => 'Only for A',
            'status' => 'open',
            'priority' => 'medium',
            'category' => 'general',
            'requester_id' => $a->id,
        ]);

        $this->actingAs($b)
            ->get(route('support.show', $ticket))
            ->assertForbidden();
    }

    public function test_marketing_can_create_campaign_and_lead(): void
    {
        $marketer = User::factory()->create();
        $marketer->assignRole('marketing');

        $this->actingAs($marketer)
            ->post(route('marketing.campaigns.store'), [
                'name' => 'Q3 Nairobi promo',
                'channel' => 'whatsapp',
                'status' => 'active',
                'audience' => 'SME importers in Nairobi',
                'content' => 'Special air freight rates this month.',
                'budget' => 50000,
                'currency' => 'KES',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonth()->toDateString(),
                'notes' => null,
            ])
            ->assertRedirect();

        $campaign = MarketingCampaign::query()->first();
        $this->assertNotNull($campaign);
        $this->assertStringStartsWith('MC-', $campaign->reference);

        $this->actingAs($marketer)
            ->post(route('marketing.leads.store'), [
                'name' => 'Jane Prospect',
                'email' => 'jane@prospect.test',
                'phone' => '+254700111222',
                'company' => 'Prospect Ltd',
                'source' => 'WhatsApp campaign',
                'status' => 'new',
                'campaign_id' => $campaign->id,
                'customer_id' => null,
                'assigned_to' => $marketer->id,
                'notes' => 'Interested in sea freight',
            ])
            ->assertRedirect(route('marketing.leads.index'));

        $this->assertDatabaseHas('marketing_leads', [
            'name' => 'Jane Prospect',
            'campaign_id' => $campaign->id,
            'status' => 'new',
        ]);
        $this->assertSame(1, MarketingLead::query()->count());
    }

    public function test_customer_cannot_access_marketing(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('marketing.campaigns.index'))
            ->assertForbidden();
    }
}
