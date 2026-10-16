<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Department;
use App\Models\Invoice;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\Shipment;
use App\Models\Task;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\InvoiceService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_quotation_submit_notifies_approvers(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $customer = Customer::query()->create([
            'name' => 'Notify Co',
            'status' => 'lead',
            'country' => 'Kenya',
        ]);

        $quotation = Quotation::query()->create([
            'reference' => 'QT-2026-0100',
            'customer_id' => $customer->id,
            'created_by' => $sales->id,
            'status' => 'draft',
            'currency' => 'KES',
            'subtotal' => 1000,
            'tax_amount' => 0,
            'total' => 1000,
        ]);
        $quotation->items()->create([
            'description' => 'Freight',
            'quantity' => 1,
            'unit' => 'shipment',
            'unit_price' => 1000,
            'line_total' => 1000,
            'sort_order' => 0,
        ]);

        $this->actingAs($sales)
            ->post(route('sales.quotations.submit', $quotation))
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $manager->id,
            'type' => 'quotation.approval',
        ]);

        $this->actingAs($manager)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('systemNotifications.enabled', true)
                ->where('systemNotifications.unread_count', 1));
    }

    public function test_purchase_request_notifies_approvers(): void
    {
        $dept = Department::query()->create(['name' => 'Marketing', 'code' => 'MKT2', 'is_active' => true]);
        $marketer = User::factory()->create(['department_id' => $dept->id]);
        $marketer->assignRole('marketing');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($marketer)
            ->post(route('procurement.store'), [
                'title' => 'Camera stand',
                'justification' => 'Needed',
                'department_id' => $dept->id,
                'currency' => 'KES',
                'items' => [['description' => 'Stand', 'quantity' => 1, 'unit_cost' => 5000]],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $manager->id,
            'type' => 'procurement.approval',
        ]);
    }

    public function test_shipment_status_notifies_creator(): void
    {
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $other = User::factory()->create();
        $other->assignRole('operations');

        $customer = Customer::query()->create([
            'name' => 'Ship Co',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $shipment = Shipment::query()->create([
            'reference' => 'SH-2026-0100',
            'customer_id' => $customer->id,
            'created_by' => $ops->id,
            'status' => 'created',
            'origin_country' => 'Kenya',
            'destination_country' => 'UAE',
            'service_type' => 'air',
        ]);

        $this->actingAs($other)
            ->post(route('operations.shipments.advance', $shipment), [
                'notes' => 'Booked',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $ops->id,
            'type' => 'shipment.status',
        ]);
    }

    public function test_overdue_invoice_notifies_finance(): void
    {
        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $customer = Customer::query()->create([
            'name' => 'Due Co',
            'status' => 'active',
            'country' => 'Kenya',
        ]);

        $invoice = Invoice::query()->create([
            'reference' => 'INV-2026-0100',
            'customer_id' => $customer->id,
            'created_by' => $finance->id,
            'status' => 'sent',
            'currency' => 'KES',
            'subtotal' => 2000,
            'tax_amount' => 0,
            'total' => 2000,
            'issue_date' => now()->subDays(20)->toDateString(),
            'due_date' => now()->subDay()->toDateString(),
        ]);

        app(InvoiceService::class)->flagOverdueInvoices();

        $this->assertSame('overdue', $invoice->fresh()->status);
        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $finance->id)
                ->where('type', 'invoice.overdue')
                ->exists()
        );
    }

    public function test_user_can_mark_notification_read(): void
    {
        $user = User::factory()->create();
        $user->assignRole('sales');

        $notification = UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Hello',
            'body' => 'World',
            'link' => route('dashboard'),
        ]);

        $this->actingAs($user)
            ->post(route('notifications.read', $notification))
            ->assertRedirect(route('dashboard'));

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_report_submit_notifies_management(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($sales)
            ->post(route('reports.store'), [
                'period_type' => 'weekly',
                'period_start' => now()->startOfWeek()->toDateString(),
                'period_end' => now()->endOfWeek()->toDateString(),
                'title' => 'Weekly report — sales',
                'accomplishments' => 'Closed two deals.',
                'challenges' => null,
                'next_plans' => 'Follow up',
                'submit' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $manager->id,
            'type' => 'report.submitted',
        ]);
    }

    public function test_purchase_request_approval_notifies_requester(): void
    {
        $dept = Department::query()->create(['name' => 'Ops', 'code' => 'OPS2', 'is_active' => true]);
        $ops = User::factory()->create(['department_id' => $dept->id]);
        $ops->assignRole('operations');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($ops)
            ->post(route('procurement.store'), [
                'title' => 'Packing tape',
                'justification' => 'Warehouse stock',
                'department_id' => $dept->id,
                'currency' => 'KES',
                'items' => [['description' => 'Tape', 'quantity' => 10, 'unit_cost' => 200]],
            ])
            ->assertRedirect();

        $request = PurchaseRequest::query()->first();
        $this->assertNotNull($request);

        $this->actingAs($manager)
            ->post(route('procurement.approve', $request))
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $ops->id,
            'type' => 'procurement.approved',
        ]);
    }

    public function test_task_assignment_and_mention_notify_user(): void
    {
        $sales = User::factory()->create(['name' => 'Sales Officer']);
        $sales->assignRole('sales');
        $ops = User::factory()->create(['name' => 'Operations Officer']);
        $ops->assignRole('operations');

        $this->actingAs($sales)
            ->post(route('tasks.store'), [
                'title' => 'Prepare handover notes',
                'description' => 'Share status with ops.',
                'priority' => 'medium',
                'due_date' => now()->addDays(1)->toDateString(),
                'assigned_to' => $ops->id,
                'department_id' => null,
                'related_key' => null,
                'related_id' => null,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $ops->id,
            'type' => 'task.assigned',
        ]);

        $task = Task::query()->first();
        $this->assertNotNull($task);

        $this->actingAs($ops)
            ->post(route('tasks.comment', $task), [
                'body' => 'Need input from @Sales Officer on the quote.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $sales->id,
            'type' => 'task.mentioned',
        ]);
    }
}
