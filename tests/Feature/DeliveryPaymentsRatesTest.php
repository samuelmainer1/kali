<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shipment;
use App\Models\ShipmentCustomerNotice;
use App\Models\ShippingRate;
use App\Models\User;
use App\Models\Vehicle;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DeliveryPaymentsRatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_a_shipment_can_be_assigned_to_one_driver_and_one_vehicle(): void
    {
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $john = User::factory()->create(['name' => 'John']);
        $john->assignRole('operations');
        $james = User::factory()->create(['name' => 'James']);
        $james->assignRole('operations');
        $vehicle = Vehicle::query()->create([
            'registration' => 'KAA 123A',
            'name' => 'Nairobi van',
            'type' => 'van',
            'is_active' => true,
        ]);
        $shipment = $this->shipment();

        $this->actingAs($ops)
            ->post(route('operations.shipments.assign', $shipment), [
                'driver_id' => $john->id,
                'vehicle_id' => $vehicle->id,
            ])
            ->assertRedirect();

        $shipment->refresh();
        $this->assertSame($john->id, $shipment->driver_id);
        $this->assertSame($vehicle->id, $shipment->vehicle_id);
        $this->assertNotSame($james->id, $shipment->driver_id);
    }

    public function test_proof_of_delivery_and_customer_notice_are_recorded(): void
    {
        Mail::fake();

        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $shipment = $this->shipment();
        $shipment->update(['status' => 'out_for_delivery']);

        $this->actingAs($ops)
            ->post(route('operations.shipments.advance', $shipment), [
                'notes' => 'Handed to the driver',
            ])
            ->assertRedirect();

        $this->assertSame('delivered', $shipment->fresh()->status);
        $this->assertDatabaseHas('shipment_customer_notices', [
            'shipment_id' => $shipment->id,
            'channel' => 'email',
            'destination' => 'client@example.test',
            'status' => 'sent',
        ]);
        $this->assertTrue(
            ShipmentCustomerNotice::query()
                ->where('shipment_id', $shipment->id)
                ->where('channel', 'sms')
                ->where('status', 'pending_gateway')
                ->exists()
        );

        $this->actingAs($ops)
            ->post(route('operations.shipments.proof', $shipment), [
                'received_by' => 'Amina Otieno',
                'notes' => 'Left at reception',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('proof_of_deliveries', [
            'shipment_id' => $shipment->id,
            'received_by' => 'Amina Otieno',
        ]);
    }

    public function test_finance_can_record_a_payment_against_an_invoice(): void
    {
        $finance = User::factory()->create();
        $finance->assignRole('finance');
        $customer = Customer::query()->create([
            'name' => 'Pay Co',
            'status' => 'active',
            'country' => 'Kenya',
        ]);
        $invoice = Invoice::query()->create([
            'reference' => 'INV-2026-0200',
            'customer_id' => $customer->id,
            'created_by' => $finance->id,
            'status' => 'sent',
            'currency' => 'KES',
            'subtotal' => 2000,
            'tax_amount' => 0,
            'total' => 2000,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $this->actingAs($finance)
            ->post(route('finance.invoices.payments.store', $invoice), [
                'amount' => 500,
                'method' => 'mpesa',
                'reference' => 'QWE123',
                'paid_on' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertSame('sent', $invoice->fresh()->status);
        $this->assertSame(1500.0, $invoice->fresh()->balance());

        $this->actingAs($finance)
            ->post(route('finance.invoices.payments.store', $invoice), [
                'amount' => 1500,
                'method' => 'bank',
                'reference' => 'BANK-9',
                'paid_on' => now()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertSame('paid', $invoice->fresh()->status);
        $this->assertSame(0.0, $invoice->fresh()->balance());
    }

    public function test_sales_can_add_a_rate_and_use_it_on_a_quotation(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->post(route('sales.rates.store'), [
                'name' => 'Nairobi to Mombasa',
                'origin' => 'Kenya',
                'destination' => 'Kenya',
                'service_type' => 'road',
                'min_weight_kg' => 0,
                'max_weight_kg' => null,
                'price' => 4500,
                'currency' => 'KES',
                'is_active' => true,
            ])
            ->assertRedirect();

        $rate = ShippingRate::query()->first();
        $this->assertNotNull($rate);

        $this->actingAs($sales)
            ->get(route('sales.quotations.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sales/Quotations/Form')
                ->where('rates.0.id', $rate->id));
    }

    private function shipment(): Shipment
    {
        $customer = Customer::query()->create([
            'name' => 'Notice Client',
            'email' => 'client@example.test',
            'phone' => '+254700000111',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        return Shipment::query()->create([
            'reference' => 'SH-2026-0099',
            'customer_id' => $customer->id,
            'status' => 'created',
            'pieces' => 1,
            'origin_country' => 'Kenya',
            'destination_country' => 'Kenya',
        ]);
    }
}
