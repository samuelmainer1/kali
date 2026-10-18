<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\PurchaseRequest;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProcurementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_any_staff_can_submit_and_manager_finance_complete_flow(): void
    {
        $dept = Department::query()->create([
            'name' => 'Marketing',
            'code' => 'MKT',
            'is_active' => true,
        ]);

        $marketer = User::factory()->create(['department_id' => $dept->id]);
        $marketer->assignRole('marketing');

        $manager = User::factory()->create();
        $manager->assignRole('management');

        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $this->actingAs($marketer)
            ->post(route('procurement.store'), [
                'title' => 'Tripod for shoots',
                'justification' => 'Content production',
                'department_id' => $dept->id,
                'currency' => 'KES',
                'items' => [
                    [
                        'description' => 'Tripod',
                        'quantity' => 1,
                        'unit_cost' => 8000,
                    ],
                ],
            ])
            ->assertRedirect();

        $request = PurchaseRequest::query()->first();
        $this->assertNotNull($request);
        $this->assertSame('submitted', $request->status);
        $this->assertEquals(8000, (float) $request->total_amount);
        $this->assertStringStartsWith('PR-', $request->reference);

        $this->actingAs($manager)
            ->post(route('procurement.approve', $request))
            ->assertRedirect();

        $this->assertSame('approved', $request->fresh()->status);

        $this->actingAs($finance)
            ->post(route('procurement.process', $request), [
                'finance_notes' => 'Paid via M-Pesa',
            ])
            ->assertRedirect();

        $this->assertSame('processed', $request->fresh()->status);
        $this->assertSame('Paid via M-Pesa', $request->fresh()->finance_notes);
    }

    public function test_staff_cannot_view_other_requests_without_permission(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $request = PurchaseRequest::query()->create([
            'reference' => 'PR-2026-0099',
            'title' => 'Private ops request',
            'status' => 'submitted',
            'requested_by' => $ops->id,
            'total_amount' => 1000,
            'currency' => 'KES',
        ]);

        $this->actingAs($sales)
            ->get(route('procurement.show', $request))
            ->assertForbidden();

        $this->actingAs($ops)
            ->get(route('procurement.show', $request))
            ->assertOk();
    }

    public function test_customer_cannot_access_procurement(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('procurement.index'))
            ->assertForbidden();
    }
}
