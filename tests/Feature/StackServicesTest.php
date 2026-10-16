<?php

namespace Tests\Feature;

use App\Jobs\ExportInvoicesSpreadsheet;
use App\Jobs\GenerateInvoicePdf;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shipment;
use App\Models\ShipmentDocument;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StackServicesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_invoice_pdf_and_spreadsheet_are_queued_onto_the_private_disk(): void
    {
        Storage::fake('documents');

        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $customer = Customer::query()->create([
            'name' => 'Stack Client',
            'email' => 'stack-client@example.test',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $this->actingAs($finance)
            ->post(route('finance.invoices.store'), [
                'customer_id' => $customer->id,
                'currency' => 'KES',
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays(7)->toDateString(),
                'items' => [
                    ['description' => 'Air freight', 'quantity' => 1, 'unit' => 'shipment', 'unit_price' => 12000],
                ],
            ])
            ->assertRedirect();

        $invoice = Invoice::query()->firstOrFail();

        $this->actingAs($finance)
            ->post(route('finance.invoices.pdf', $invoice))
            ->assertRedirect()
            ->assertSessionHas('success', 'Invoice PDF queued.');

        $path = (new GenerateInvoicePdf($invoice->id))->path();
        Storage::disk('documents')->assertExists($path);
        $this->assertStringStartsWith('%PDF', Storage::disk('documents')->get($path));

        $this->actingAs($finance)
            ->get(route('finance.invoices.pdf.download', $invoice))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($finance)
            ->post(route('finance.invoices.export'))
            ->assertRedirect()
            ->assertSessionHas('success', 'Invoice spreadsheet queued.');

        Storage::disk('documents')->assertExists(ExportInvoicesSpreadsheet::PATH);

        $download = $this->actingAs($finance)
            ->get(route('finance.invoices.export.download'));

        $download->assertOk();
        $download->assertHeader(
            'content-type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        $this->assertStringStartsWith('PK', $download->streamedContent());
    }

    public function test_shipment_documents_stay_private_and_the_customer_portal_is_scoped(): void
    {
        Storage::fake('documents');

        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $owner = User::factory()->create(['email' => 'owner@example.test']);
        $owner->assignRole('customer');
        $other = User::factory()->create(['email' => 'other@example.test']);
        $other->assignRole('customer');

        $ownedCustomer = Customer::query()->create([
            'name' => 'Owned Cargo',
            'email' => $owner->email,
            'status' => 'active',
            'country' => 'Kenya',
        ]);
        $otherCustomer = Customer::query()->create([
            'name' => 'Other Cargo',
            'email' => $other->email,
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $owned = Shipment::query()->create([
            'reference' => 'SH-2026-9001',
            'customer_id' => $ownedCustomer->id,
            'status' => 'departed',
            'origin_country' => 'Kenya',
            'destination_country' => 'UAE',
            'tracking_number' => 'AWB-9001',
            'created_by' => $ops->id,
        ]);
        $hidden = Shipment::query()->create([
            'reference' => 'SH-2026-9002',
            'customer_id' => $otherCustomer->id,
            'status' => 'created',
            'tracking_number' => 'AWB-9002',
            'created_by' => $ops->id,
        ]);

        $this->actingAs($ops)
            ->post(route('operations.shipments.documents.store', $owned), [
                'type' => 'air_waybill',
                'file' => UploadedFile::fake()->create('awb.pdf', 20, 'application/pdf'),
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $document = ShipmentDocument::query()->firstOrFail();
        $this->assertSame('documents', $document->disk);
        Storage::disk('documents')->assertExists($document->path);

        $this->actingAs($ops)
            ->get(route('operations.shipments.documents.download', [$owned, $document]))
            ->assertOk();

        $this->actingAs($owner)
            ->get(route('portal.shipments.index', ['search' => 'AWB-9001']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/Shipments')
                ->has('shipments.data', 1)
                ->where('shipments.data.0.reference', 'SH-2026-9001'));

        $this->actingAs($owner)
            ->get(route('portal.shipments.index', ['search' => 'AWB-9002']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('shipments.data', 0));

        $this->actingAs($owner)
            ->get(route('portal.shipments.show', $owned))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Portal/Shipment')
                ->where('shipment.tracking_number', 'AWB-9001')
                ->has('shipment.documents', 1));

        $this->actingAs($owner)
            ->get(route('operations.shipments.documents.download', [$owned, $document]))
            ->assertOk();

        $this->actingAs($owner)
            ->get(route('portal.shipments.show', $hidden))
            ->assertForbidden();

        $this->actingAs($other)
            ->get(route('operations.shipments.documents.download', [$owned, $document]))
            ->assertForbidden();
    }

    public function test_sanctum_issues_a_token_for_an_active_user(): void
    {
        $driver = User::factory()->create();

        $login = $this->postJson('/api/login', [
            'email' => $driver->email,
            'password' => 'password',
            'device_name' => 'driver-phone',
        ]);

        $login->assertOk()->assertJsonStructure(['token']);
        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $driver->email);

        $this->withToken($token)
            ->deleteJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        $inactive = User::factory()->inactive()->create();

        $this->postJson('/api/login', [
            'email' => $inactive->email,
            'password' => 'password',
            'device_name' => 'driver-phone',
        ])->assertUnprocessable();
    }
}
