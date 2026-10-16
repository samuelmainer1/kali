<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\EmployeeReport;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\PurchaseRequest;
use App\Models\Quotation;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\ReminderService;
use Database\Seeders\LeaveSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalsAndRemindersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(LeaveSeeder::class);
    }

    public function test_management_sees_combined_pending_approvals(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();
        $start = now()->next('Monday');

        LeaveRequest::query()->create([
            'reference' => 'LV-2026-0101',
            'user_id' => $sales->id,
            'leave_type_id' => $annual->id,
            'start_date' => $start->toDateString(),
            'end_date' => $start->copy()->addWeekdays(1)->toDateString(),
            'days' => 2,
            'status' => 'pending',
        ]);

        PurchaseRequest::query()->create([
            'reference' => 'PR-2026-0101',
            'title' => 'Office supplies',
            'status' => 'submitted',
            'requested_by' => $sales->id,
            'total_amount' => 2500,
            'currency' => 'KES',
        ]);

        $customer = Customer::query()->create([
            'name' => 'Approve Co',
            'status' => 'lead',
            'country' => 'Kenya',
        ]);

        Quotation::query()->create([
            'reference' => 'QT-2026-0101',
            'customer_id' => $customer->id,
            'created_by' => $sales->id,
            'status' => 'pending_approval',
            'currency' => 'KES',
            'subtotal' => 1000,
            'tax_amount' => 0,
            'total' => 1000,
        ]);

        EmployeeReport::query()->create([
            'reference' => 'WR-2026-0101',
            'user_id' => $sales->id,
            'period_type' => 'weekly',
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'title' => 'Weekly report',
            'accomplishments' => 'Work done',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($manager)
            ->get(route('approvals.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Approvals/Index')
                ->where('total', 4)
                ->has('items', 4));

        $this->actingAs($manager)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('approvalsSummary.total', 4));
    }

    public function test_sales_cannot_open_approvals_hub(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->get(route('approvals.index'))
            ->assertForbidden();
    }

    public function test_weekly_report_reminder_notifies_staff_without_submission(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        EmployeeReport::query()->create([
            'reference' => 'WR-2026-0200',
            'user_id' => $ops->id,
            'period_type' => 'weekly',
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'title' => 'Ops weekly',
            'accomplishments' => 'Done',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $count = app(ReminderService::class)->remindMissingWeeklyReports();

        $this->assertGreaterThanOrEqual(1, $count);
        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $sales->id)
                ->where('type', 'reminder.report.weekly')
                ->exists()
        );
        $this->assertFalse(
            UserNotification::query()
                ->where('user_id', $ops->id)
                ->where('type', 'reminder.report.weekly')
                ->exists()
        );
    }

    public function test_pending_leave_reminder_notifies_approvers(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');
        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();

        $leaveRequest = LeaveRequest::query()->create([
            'reference' => 'LV-2026-0200',
            'user_id' => $sales->id,
            'leave_type_id' => $annual->id,
            'start_date' => now()->addWeek()->startOfWeek()->toDateString(),
            'end_date' => now()->addWeek()->startOfWeek()->addWeekdays(1)->toDateString(),
            'days' => 2,
            'status' => 'pending',
        ]);
        $leaveRequest->forceFill([
            'created_at' => now()->subHours(30),
            'updated_at' => now()->subHours(30),
        ])->saveQuietly();

        $count = app(ReminderService::class)->remindPendingLeaveApprovals(24);

        $this->assertSame(1, $count);
        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $manager->id)
                ->where('type', 'reminder.leave.pending')
                ->exists()
        );
    }

    public function test_leave_starts_tomorrow_reminder(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();
        $tomorrow = now()->addDay()->toDateString();

        LeaveRequest::query()->create([
            'reference' => 'LV-2026-0201',
            'user_id' => $sales->id,
            'leave_type_id' => $annual->id,
            'start_date' => $tomorrow,
            'end_date' => $tomorrow,
            'days' => 1,
            'status' => 'approved',
        ]);

        $count = app(ReminderService::class)->remindLeaveStartingTomorrow();

        $this->assertSame(1, $count);
        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $sales->id)
                ->where('type', 'reminder.leave.starts_tomorrow')
                ->exists()
        );
    }
}
