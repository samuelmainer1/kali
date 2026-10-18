<?php

namespace Tests\Feature\Crm;

use App\Models\Customer;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCreateAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sales_customer_care_marketing_and_management_can_add_customers(): void
    {
        foreach (['sales', 'customer_care', 'marketing', 'management'] as $role) {
            $user = User::factory()->create();
            $user->assignRole($role);

            $this->actingAs($user)
                ->get(route('crm.customers.create'))
                ->assertOk();

            $this->actingAs($user)
                ->post(route('crm.customers.store'), [
                    'name' => "Customer from {$role}",
                    'country' => 'Kenya',
                    'status' => 'lead',
                    'contacts' => [],
                    'addresses' => [],
                ])
                ->assertRedirect();

            $this->assertDatabaseHas('customers', [
                'name' => "Customer from {$role}",
            ]);
        }

        $this->assertSame(4, Customer::query()->count());
    }

    public function test_warehouse_still_cannot_add_customers(): void
    {
        $user = User::factory()->create();
        $user->assignRole('warehouse');

        $this->actingAs($user)
            ->get(route('crm.customers.create'))
            ->assertForbidden();
    }
}
