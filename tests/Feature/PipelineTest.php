<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sales_can_create_and_advance_opportunity(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $customer = Customer::query()->create([
            'name' => 'ABC Logistics',
            'status' => 'lead',
            'country' => 'Kenya',
            'assigned_salesperson_id' => $sales->id,
        ]);

        $this->actingAs($sales)
            ->post(route('pipeline.store'), [
                'title' => 'Express air charter',
                'customer_id' => $customer->id,
                'owner_id' => $sales->id,
                'stage' => 'new_lead',
                'expected_value' => 150000,
                'currency' => 'KES',
                'next_follow_up' => now()->addDays(3)->toDateString(),
                'quotation_id' => null,
                'notes' => 'First contact pending',
                'lost_reason' => null,
            ])
            ->assertRedirect();

        $opportunity = Opportunity::query()->first();
        $this->assertNotNull($opportunity);
        $this->assertStringStartsWith('OP-', $opportunity->reference);

        $this->actingAs($sales)
            ->post(route('pipeline.stage', $opportunity), [
                'stage' => 'contacted',
            ])
            ->assertRedirect();

        $this->assertSame('contacted', $opportunity->fresh()->stage);
    }

    public function test_sales_cannot_view_other_owners_deals(): void
    {
        $salesA = User::factory()->create();
        $salesA->assignRole('sales');
        $salesB = User::factory()->create();
        $salesB->assignRole('sales');

        $customer = Customer::query()->create([
            'name' => 'Private Deal Co',
            'status' => 'lead',
            'country' => 'Kenya',
        ]);

        $opportunity = Opportunity::query()->create([
            'reference' => 'OP-2026-0099',
            'title' => 'Hidden deal',
            'customer_id' => $customer->id,
            'owner_id' => $salesA->id,
            'created_by' => $salesA->id,
            'stage' => 'new_lead',
            'expected_value' => 10000,
            'currency' => 'KES',
        ]);

        $this->actingAs($salesB)
            ->get(route('pipeline.show', $opportunity))
            ->assertForbidden();

        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($manager)
            ->get(route('pipeline.show', $opportunity))
            ->assertOk();
    }

    public function test_dashboard_no_longer_shares_announcement_list_but_pipeline_summary(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Index')
                ->missing('announcements')
                ->has('pipelineSummary')
                ->where('announcementBell.enabled', true));
    }
}
