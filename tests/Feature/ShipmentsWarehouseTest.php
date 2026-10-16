<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Shipment;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentsWarehouseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_operations_can_create_shipment_and_advance_into_warehouse(): void
    {
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $customer = Customer::query()->create([
            'name' => 'Warehouse Client',
            'email' => 'wh-client@example.test',
            'status' => 'active',
            'country' => 'Kenya',
            'assigned_salesperson_id' => null,
        ]);

        $this->actingAs($ops)
            ->post(route('operations.shipments.store'), [
                'customer_id' => $customer->id,
                'branch_id' => null,
                'origin_country' => 'Kenya',
                'destination_country' => 'Uganda',
                'current_location' => 'NBO collect',
                'service_type' => 'road',
                'pieces' => 3,
                'weight_kg' => 120,
                'tracking_number' => null,
                'expected_departure' => null,
                'expected_arrival' => null,
                'notes' => 'Test cargo',
            ])
            ->assertRedirect();

        $shipment = Shipment::query()->first();
        $this->assertNotNull($shipment);
        $this->assertSame('created', $shipment->status);
        $this->assertDatabaseHas('shipment_status_histories', [
            'shipment_id' => $shipment->id,
            'to_status' => 'created',
        ]);

        $this->actingAs($ops)
            ->post(route('operations.shipments.advance', $shipment), [
                'notes' => 'Collected from client',
                'current_location' => 'Client site',
            ])
            ->assertRedirect();
        $this->assertSame('cargo_collected', $shipment->fresh()->status);

        $this->actingAs($ops)
            ->post(route('operations.shipments.advance', $shipment), [
                'notes' => 'Received at WH',
                'current_location' => 'NBO-WH-A1',
            ])
            ->assertRedirect();

        $shipment->refresh();
        $this->assertSame('warehouse', $shipment->status);
        $this->assertDatabaseHas('inventory_items', [
            'sku' => $shipment->reference,
            'shipment_id' => $shipment->id,
            'status' => 'held',
            'quantity_on_hand' => 3,
        ]);
        $this->assertDatabaseHas('cargo_movements', [
            'shipment_id' => $shipment->id,
            'type' => 'inbound',
        ]);
    }

    public function test_warehouse_user_can_manage_inventory_and_movements(): void
    {
        $wh = User::factory()->create();
        $wh->assignRole('warehouse');

        $this->actingAs($wh)
            ->get(route('warehouse.index'))
            ->assertOk();

        $this->actingAs($wh)
            ->post(route('warehouse.items.store'), [
                'sku' => 'SKU-100',
                'name' => 'Spare packing materials',
                'description' => null,
                'quantity_on_hand' => 10,
                'unit' => 'pcs',
                'branch_id' => null,
                'shipment_id' => null,
                'location_code' => 'A-01',
                'status' => 'available',
            ])
            ->assertRedirect();

        $item = InventoryItem::query()->where('sku', 'SKU-100')->first();
        $this->assertNotNull($item);
        $this->assertDatabaseHas('cargo_movements', [
            'inventory_item_id' => $item->id,
            'type' => 'inbound',
            'quantity' => 10,
        ]);

        $this->actingAs($wh)
            ->post(route('warehouse.movements.store'), [
                'type' => 'outbound',
                'inventory_item_id' => $item->id,
                'shipment_id' => null,
                'branch_id' => null,
                'quantity' => 4,
                'reference' => 'ADJ-1',
                'notes' => 'Used on packing',
            ])
            ->assertRedirect();

        $this->assertSame(6.0, (float) $item->fresh()->quantity_on_hand);
    }

    public function test_customer_role_cannot_access_shipments_or_warehouse(): void
    {
        $customerUser = User::factory()->create();
        $customerUser->assignRole('customer');

        $this->actingAs($customerUser)
            ->get(route('operations.shipments.index'))
            ->assertForbidden();

        $this->actingAs($customerUser)
            ->get(route('warehouse.index'))
            ->assertForbidden();
    }
}
