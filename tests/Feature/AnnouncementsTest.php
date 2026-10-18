<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_company_wide_announcement_is_visible_to_all_staff(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $this->actingAs($manager)
            ->post(route('announcements.store'), [
                'title' => 'Company town hall',
                'body' => 'All staff must attend Friday briefing.',
                'type' => 'company',
                'department_id' => null,
                'is_urgent' => true,
                'is_published' => true,
                'published_at' => now()->toDateTimeString(),
                'expires_at' => null,
            ])
            ->assertRedirect();

        $announcement = Announcement::query()->first();
        $this->assertNotNull($announcement);
        $this->assertNull($announcement->department_id);

        $this->actingAs($sales)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Index')
                ->missing('announcements')
                ->where('announcementBell.enabled', true)
                ->where('announcementBell.unread_count', 1));

        $this->actingAs($sales)->get(route('announcements.show', $announcement))->assertOk();
        $this->actingAs($ops)->get(route('announcements.show', $announcement))->assertOk();
    }

    public function test_department_audience_is_scoped_even_for_company_type(): void
    {
        $opsDept = Department::query()->create([
            'name' => 'Operations',
            'code' => 'OPS',
            'is_active' => true,
        ]);
        $salesDept = Department::query()->create([
            'name' => 'Sales',
            'code' => 'SAL',
            'is_active' => true,
        ]);

        $manager = User::factory()->create();
        $manager->assignRole('management');

        $ops = User::factory()->create(['department_id' => $opsDept->id]);
        $ops->assignRole('operations');

        $sales = User::factory()->create(['department_id' => $salesDept->id]);
        $sales->assignRole('sales');

        $this->actingAs($manager)
            ->post(route('announcements.store'), [
                'title' => 'Ops safety note',
                'body' => 'Warehouse lane closed tomorrow.',
                'type' => 'emergency',
                'department_id' => $opsDept->id,
                'is_urgent' => true,
                'is_published' => true,
                'published_at' => now()->toDateTimeString(),
                'expires_at' => null,
            ])
            ->assertRedirect();

        $announcement = Announcement::query()->first();

        $this->actingAs($ops)->get(route('announcements.show', $announcement))->assertOk();
        $this->actingAs($sales)->get(route('announcements.show', $announcement))->assertNotFound();
    }

    public function test_customer_cannot_view_announcements(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('announcements.index'))
            ->assertForbidden();
    }

    public function test_staff_cannot_manage_announcements(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->get(route('announcements.create'))
            ->assertForbidden();
    }

    public function test_unread_bell_count_is_shared_for_staff(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('management');
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        Announcement::query()->create([
            'reference' => 'AN-2026-0099',
            'title' => 'Unread notice',
            'body' => 'Please read',
            'type' => 'company',
            'department_id' => null,
            'is_urgent' => false,
            'is_published' => true,
            'published_at' => now(),
            'created_by' => $manager->id,
        ]);

        $this->actingAs($sales)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('announcementBell.enabled', true)
                ->where('announcementBell.unread_count', 1)
                ->has('announcementBell.items', 1));
    }
}
