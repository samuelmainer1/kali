<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmQuotationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sales_can_create_customer_and_quotation_lifecycle(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($sales)
            ->post(route('crm.customers.store'), [
                'name' => 'Test Logistics Co',
                'trading_name' => 'Test Logistics',
                'email' => 'info@testlogistics.test',
                'phone' => '+254700111222',
                'website' => null,
                'country' => 'Kenya',
                'tax_number' => null,
                'status' => 'active',
                'assigned_salesperson_id' => $sales->id,
                'notes' => null,
                'contacts' => [
                    ['name' => 'Alice', 'email' => 'alice@test.com', 'phone' => null, 'job_title' => 'Buyer', 'is_primary' => true],
                ],
                'addresses' => [
                    ['label' => 'shipping', 'line1' => 'Westlands', 'line2' => null, 'city' => 'Nairobi', 'state' => null, 'postal_code' => null, 'country' => 'Kenya', 'is_default' => true],
                ],
            ])
            ->assertRedirect();

        $customer = Customer::query()->where('email', 'info@testlogistics.test')->first();
        $this->assertNotNull($customer);

        $this->actingAs($sales)
            ->post(route('sales.quotations.store'), [
                'customer_id' => $customer->id,
                'contact_id' => $customer->contacts()->first()->id,
                'valid_until' => now()->addDays(10)->toDateString(),
                'currency' => 'KES',
                'origin_country' => 'Kenya',
                'destination_country' => 'Uganda',
                'service_type' => 'road',
                'notes' => null,
                'terms' => null,
                'items' => [
                    ['description' => 'Road freight', 'quantity' => 1, 'unit' => 'trip', 'unit_price' => 45000, 'weight_kg' => 500],
                ],
            ])
            ->assertRedirect();

        $quotation = Quotation::query()->first();
        $this->assertSame('draft', $quotation->status);

        $this->actingAs($sales)
            ->post(route('sales.quotations.submit', $quotation))
            ->assertRedirect();
        $this->assertSame('pending_approval', $quotation->fresh()->status);

        $this->actingAs($manager)
            ->post(route('sales.quotations.approve', $quotation))
            ->assertRedirect();
        $this->assertSame('approved', $quotation->fresh()->status);

        $convert = $this->actingAs($sales)
            ->post(route('sales.quotations.convert', $quotation));

        $quotation->refresh();
        $this->assertSame('converted', $quotation->status);
        $this->assertNotNull($quotation->converted_shipment_id);
        $convert->assertRedirect(route('operations.shipments.show', $quotation->converted_shipment_id));
        $this->assertDatabaseHas('shipments', [
            'id' => $quotation->converted_shipment_id,
            'customer_id' => $customer->id,
            'status' => 'created',
        ]);
        $this->assertDatabaseHas('shipment_status_histories', [
            'shipment_id' => $quotation->converted_shipment_id,
            'to_status' => 'created',
        ]);
    }

    public function test_customer_role_cannot_access_crm(): void
    {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $this->actingAs($customerUser)
            ->get(route('crm.customers.index'))
            ->assertForbidden();
    }
}
