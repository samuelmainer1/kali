<?php

namespace Tests\Feature;

use App\Jobs\ExportEmployeeReportsSpreadsheet;
use App\Jobs\ExportShipmentsSpreadsheet;
use App\Jobs\GenerateCargoManifestPdf;
use App\Jobs\GenerateEmployeeReportPdf;
use App\Models\Customer;
use App\Models\EmployeeReport;
use App\Models\Shipment;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportingExportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_operations_can_queue_a_cargo_manifest_and_a_shipment_spreadsheet(): void
    {
        Storage::fake('documents');

        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $customer = Customer::query()->create([
            'name' => 'Manifest Client',
            'email' => 'manifest@example.test',
            'status' => 'active',
            'country' => 'Kenya',
        ]);
        $shipment = Shipment::query()->create([
            'reference' => 'SH-2026-4401',
            'customer_id' => $customer->id,
            'status' => 'warehouse',
            'origin_country' => 'Kenya',
            'destination_country' => 'UAE',
            'tracking_number' => 'AWB-4401',
            'pieces' => 4,
            'weight_kg' => 80,
            'service_type' => 'air',
            'created_by' => $ops->id,
        ]);

        $this->actingAs($ops)
            ->post(route('operations.shipments.manifest', $shipment))
            ->assertRedirect()
            ->assertSessionHas('success', 'Cargo manifest queued.');

        $path = (new GenerateCargoManifestPdf($shipment->id))->path();
        Storage::disk('documents')->assertExists($path);
        $this->assertStringStartsWith('%PDF', Storage::disk('documents')->get($path));

        $this->actingAs($ops)
            ->get(route('operations.shipments.manifest.download', $shipment))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($ops)
            ->post(route('operations.shipments.export'))
            ->assertRedirect()
            ->assertSessionHas('success', 'Shipment spreadsheet queued.');

        Storage::disk('documents')->assertExists(ExportShipmentsSpreadsheet::PATH);
        $download = $this->actingAs($ops)->get(route('operations.shipments.export.download'));
        $download->assertOk();
        $this->assertStringStartsWith('PK', $download->streamedContent());
    }

    public function test_staff_can_queue_a_report_pdf_and_exporters_can_queue_the_spreadsheet(): void
    {
        Storage::fake('documents');

        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $report = EmployeeReport::query()->create([
            'reference' => 'WR-2026-4401',
            'user_id' => $sales->id,
            'period_type' => 'weekly',
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'title' => 'Corridor follow-up',
            'accomplishments' => 'Quoted three air jobs.',
            'status' => 'submitted',
        ]);

        $this->actingAs($sales)
            ->post(route('reports.pdf', $report))
            ->assertRedirect()
            ->assertSessionHas('success', 'Report PDF queued.');

        $path = (new GenerateEmployeeReportPdf($report->id))->path();
        Storage::disk('documents')->assertExists($path);
        $this->assertStringStartsWith('%PDF', Storage::disk('documents')->get($path));

        $this->actingAs($sales)
            ->get(route('reports.pdf.download', $report))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->actingAs($sales)
            ->post(route('reports.export'))
            ->assertForbidden();

        $this->actingAs($finance)
            ->post(route('reports.export'))
            ->assertRedirect()
            ->assertSessionHas('success', 'Reports spreadsheet queued.');

        Storage::disk('documents')->assertExists(ExportEmployeeReportsSpreadsheet::PATH);
        $download = $this->actingAs($finance)->get(route('reports.export.download'));
        $download->assertOk();
        $this->assertStringStartsWith('PK', $download->streamedContent());
    }
}
