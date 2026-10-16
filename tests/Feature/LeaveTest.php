<?php

namespace Tests\Feature;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Models\UserNotification;
use Database\Seeders\LeaveSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(LeaveSeeder::class);
    }

    public function test_staff_can_request_and_manager_can_approve(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();
        $start = now()->next('Monday');

        $this->actingAs($sales)
            ->post(route('leave.store'), [
                'leave_type_id' => $annual->id,
                'start_date' => $start->toDateString(),
                'end_date' => $start->copy()->addWeekdays(2)->toDateString(),
                'is_half_day' => false,
                'reason' => 'Family travel',
            ])
            ->assertRedirect();

        $request = LeaveRequest::query()->where('user_id', $sales->id)->latest('id')->first();
        $this->assertNotNull($request);
        $this->assertSame('pending', $request->status);
        $this->assertEquals(3.0, (float) $request->days);
        $this->assertStringStartsWith('LV-', $request->reference);

        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $manager->id)
                ->where('type', 'leave.approval')
                ->exists()
        );

        $this->actingAs($manager)
            ->post(route('leave.approve', $request))
            ->assertRedirect();

        $this->assertSame('approved', $request->fresh()->status);
        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $sales->id)
                ->where('type', 'leave.approved')
                ->exists()
        );

        $balance = LeaveBalance::query()
            ->where('user_id', $sales->id)
            ->where('leave_type_id', $annual->id)
            ->where('year', (int) $start->format('Y'))
            ->first();

        $this->assertNotNull($balance);
        $this->assertEquals(3.0, (float) $balance->taken);
    }

    public function test_staff_cannot_view_others_leave_without_permission(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();

        $request = LeaveRequest::query()->create([
            'reference' => 'LV-2026-0099',
            'user_id' => $ops->id,
            'leave_type_id' => $annual->id,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(11)->toDateString(),
            'days' => 2,
            'status' => 'pending',
        ]);

        $this->actingAs($sales)
            ->get(route('leave.show', $request))
            ->assertForbidden();

        $this->actingAs($ops)
            ->get(route('leave.show', $request))
            ->assertOk();
    }

    public function test_customer_cannot_access_leave(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('leave.index'))
            ->assertForbidden();
    }

    public function test_half_day_leave_uses_half_balance_day(): void
    {
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $annual = LeaveType::query()->where('code', 'ANNUAL')->firstOrFail();
        $day = now()->next('Tuesday');

        $this->actingAs($ops)
            ->post(route('leave.store'), [
                'leave_type_id' => $annual->id,
                'start_date' => $day->toDateString(),
                'end_date' => $day->toDateString(),
                'is_half_day' => true,
                'half_day_period' => 'morning',
                'reason' => 'Clinic visit',
            ])
            ->assertRedirect();

        $request = LeaveRequest::query()->where('user_id', $ops->id)->latest('id')->first();
        $this->assertEquals(0.5, (float) $request->days);
        $this->assertTrue($request->is_half_day);
    }
}
