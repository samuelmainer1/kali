<?php

namespace Tests\Feature;

use App\Exports\UserDirectoryExport;
use App\Models\ActivityLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_management_sees_the_same_dashboard_without_administrator_accounts(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');
        $manager = User::factory()->create();
        $manager->assignRole('management');

        ActivityLog::query()->create([
            'user_id' => $admin->id,
            'action' => 'auth.login',
            'description' => 'System Administrator signed in',
        ]);

        $this->actingAs($manager)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('stats', 6)
                ->where('stats.0.label', 'Total Users')
                ->where('stats.0.value', 1)
                ->where('showRoadmap', false)
                ->where('recentActivities', [])
                ->where('auth.user.permissions', function ($permissions) use ($admin) {
                    return collect($permissions)->sort()->values()->all()
                        === $admin->getAllPermissions()->pluck('name')->sort()->values()->all();
                }));

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.0.value', 2)
                ->where('showRoadmap', true)
                ->has('recentActivities', 1));
    }

    public function test_management_staff_export_hides_administrator_accounts(): void
    {
        $admin = User::factory()->create(['email' => 'hidden-admin@globeflight.co.ke']);
        $admin->assignRole('administrator');
        $manager = User::factory()->create(['email' => 'manager@globeflight.co.ke']);
        $manager->assignRole('management');

        $hidden = (new UserDirectoryExport($manager))->query()->pluck('email');
        $visible = (new UserDirectoryExport($admin))->query()->pluck('email');

        $this->assertFalse($hidden->contains('hidden-admin@globeflight.co.ke'));
        $this->assertTrue($hidden->contains('manager@globeflight.co.ke'));
        $this->assertTrue($visible->contains('hidden-admin@globeflight.co.ke'));
    }

    public function test_management_cannot_delete_an_administrator_account(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('management');
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($manager);

        $this->expectException(AuthorizationException::class);

        $admin->delete();
    }

    public function test_administrator_can_delete_any_account(): void
    {
        $actor = User::factory()->create();
        $actor->assignRole('administrator');
        $staff = User::factory()->create();
        $staff->assignRole('sales');
        $otherAdmin = User::factory()->create();
        $otherAdmin->assignRole('administrator');

        $this->actingAs($actor);

        $staff->delete();
        $otherAdmin->delete();

        $this->assertNull($staff->fresh());
        $this->assertNull($otherAdmin->fresh());
    }
}
