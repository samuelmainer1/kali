<?php

namespace Tests\Feature;

use App\Models\EmployeeReport;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeReportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_employee_can_create_submit_and_manager_can_approve(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $periodStart = now()->startOfWeek()->toDateString();
        $periodEnd = now()->endOfWeek()->toDateString();

        $this->actingAs($sales)
            ->post(route('reports.store'), [
                'period_type' => 'weekly',
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'title' => 'Weekly report — sales',
                'accomplishments' => 'Closed two deals and followed up leads.',
                'challenges' => 'Slow responses from one prospect.',
                'next_plans' => 'Push Uganda corridor quotes.',
                'submit' => true,
            ])
            ->assertRedirect();

        $report = EmployeeReport::query()->first();
        $this->assertNotNull($report);
        $this->assertSame('submitted', $report->status);
        $this->assertSame($sales->id, $report->user_id);
        $this->assertStringStartsWith('WR-', $report->reference);

        $this->actingAs($manager)
            ->get(route('reports.index'))
            ->assertOk();

        $this->actingAs($manager)
            ->post(route('reports.review', $report), [
                'decision' => 'approved',
                'reviewer_notes' => 'Good progress.',
            ])
            ->assertRedirect();

        $this->assertSame('approved', $report->fresh()->status);
        $this->assertSame($manager->id, $report->fresh()->reviewed_by);
    }

    public function test_revision_flow_allows_resubmit(): void
    {
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $report = EmployeeReport::query()->create([
            'reference' => 'WR-2026-0099',
            'user_id' => $ops->id,
            'period_type' => 'weekly',
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'title' => 'Ops weekly',
            'accomplishments' => 'Handled inbound cargo.',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($manager)
            ->post(route('reports.review', $report), [
                'decision' => 'revision_requested',
                'reviewer_notes' => 'Add delivery metrics.',
            ])
            ->assertRedirect();

        $this->assertSame('revision_requested', $report->fresh()->status);

        $this->actingAs($ops)
            ->put(route('reports.update', $report), [
                'period_type' => 'weekly',
                'period_start' => $report->period_start->toDateString(),
                'period_end' => $report->period_end->toDateString(),
                'title' => 'Ops weekly',
                'accomplishments' => 'Handled inbound cargo. Delivered 12 shipments.',
                'challenges' => null,
                'next_plans' => 'Clear backlog',
                'submit' => true,
            ])
            ->assertRedirect();

        $this->assertSame('submitted', $report->fresh()->status);
    }

    public function test_employee_can_submit_daily_and_monthly_reports(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $today = now()->toDateString();

        $this->actingAs($sales)
            ->get(route('reports.create', ['period_type' => 'daily']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Form')
                ->where('defaults.period_type', 'daily')
                ->where('defaults.period_start', $today)
                ->where('defaults.period_end', $today)
                ->where('periodTypes', ['daily', 'weekly', 'monthly']));

        $this->actingAs($sales)
            ->post(route('reports.store'), [
                'period_type' => 'daily',
                'period_start' => $today,
                'period_end' => $today,
                'title' => 'Daily report — sales',
                'accomplishments' => 'Delivered three consignments.',
                'submit' => true,
            ])
            ->assertRedirect();

        $daily = EmployeeReport::query()->where('period_type', 'daily')->first();
        $this->assertNotNull($daily);
        $this->assertSame('submitted', $daily->status);
        $this->assertStringStartsWith('DR-', $daily->reference);
        $this->assertSame($today, $daily->period_end->toDateString());

        $this->actingAs($sales)
            ->from(route('reports.create'))
            ->post(route('reports.store'), [
                'period_type' => 'daily',
                'period_start' => $today,
                'period_end' => $today,
                'title' => 'Second daily report',
                'accomplishments' => 'Already filed.',
                'submit' => false,
            ])
            ->assertRedirect(route('reports.create'))
            ->assertSessionHasErrors('period_start');

        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $this->actingAs($sales)
            ->post(route('reports.store'), [
                'period_type' => 'monthly',
                'period_start' => $monthStart,
                'period_end' => $monthEnd,
                'title' => 'Monthly report — sales',
                'accomplishments' => 'Closed the month with four new accounts.',
                'submit' => true,
            ])
            ->assertRedirect();

        $monthly = EmployeeReport::query()->where('period_type', 'monthly')->first();
        $this->assertNotNull($monthly);
        $this->assertStringStartsWith('MR-', $monthly->reference);
        $this->assertSame(2, EmployeeReport::query()->where('user_id', $sales->id)->count());
    }

    public function test_employee_cannot_view_others_reports(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $report = EmployeeReport::query()->create([
            'reference' => 'WR-2026-0100',
            'user_id' => $ops->id,
            'period_type' => 'weekly',
            'period_start' => now()->startOfWeek()->toDateString(),
            'period_end' => now()->endOfWeek()->toDateString(),
            'title' => 'Ops weekly',
            'accomplishments' => 'Work done',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($sales)
            ->get(route('reports.show', $report))
            ->assertForbidden();
    }
}
