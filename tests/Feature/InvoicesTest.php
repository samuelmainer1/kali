<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_finance_can_create_invoice_and_print(): void
    {
        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $customer = Customer::query()->create([
            'name' => 'Invoice Client',
            'email' => 'invoice-client@example.test',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $this->actingAs($finance)
            ->post(route('finance.invoices.store'), [
                'customer_id' => $customer->id,
                'currency' => 'KES',
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays(14)->toDateString(),
                'notes' => 'Net 14',
                'terms' => 'Payment due within 14 days',
                'items' => [
                    ['description' => 'Air freight NBO-DXB', 'quantity' => 1, 'unit' => 'shipment', 'unit_price' => 85000],
                ],
            ])
            ->assertRedirect();

        $invoice = Invoice::query()->first();
        $this->assertNotNull($invoice);
        $this->assertSame('draft', $invoice->status);
        $this->assertSame(85000.0, (float) $invoice->total);
        $this->assertStringStartsWith('INV-', $invoice->reference);

        $this->actingAs($finance)
            ->get(route('finance.invoices.print', $invoice))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Finance/Invoices/Print'));

        $this->actingAs($finance)
            ->post(route('finance.invoices.status', $invoice), ['status' => 'sent'])
            ->assertRedirect();

        $this->assertSame('sent', $invoice->fresh()->status);
    }

    public function test_invoice_can_be_created_from_approved_quotation(): void
    {
        $finance = User::factory()->create();
        $finance->assignRole('finance');
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $customer = Customer::query()->create([
            'name' => 'Quote Client',
            'email' => 'quote-client@example.test',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $quotation = Quotation::query()->create([
            'reference' => 'QT-2026-0099',
            'customer_id' => $customer->id,
            'created_by' => $sales->id,
            'status' => 'approved',
            'currency' => 'KES',
            'subtotal' => 10000,
            'tax_amount' => 0,
            'total' => 10000,
            'approved_at' => now(),
        ]);

        $quotation->items()->create([
            'description' => 'Road freight',
            'quantity' => 1,
            'unit' => 'trip',
            'unit_price' => 10000,
            'line_total' => 10000,
            'sort_order' => 0,
        ]);

        $this->actingAs($finance)
            ->post(route('sales.quotations.invoice', $quotation))
            ->assertRedirect();

        $this->assertDatabaseHas('invoices', [
            'quotation_id' => $quotation->id,
            'customer_id' => $customer->id,
            'status' => 'draft',
        ]);
    }
}
