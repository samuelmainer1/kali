<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdministratorProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_administrator_user_cannot_be_edited_or_toggled(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');
        $otherAdmin = User::factory()->create();
        $otherAdmin->assignRole('administrator');

        $this->actingAs($otherAdmin)
            ->get(route('admin.users.edit', $admin))
            ->assertForbidden();

        $this->actingAs($otherAdmin)
            ->patch(route('admin.users.toggle-active', $admin))
            ->assertRedirect();

        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_administration_department_cannot_be_updated_or_deleted(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $department = Department::query()->create([
            'name' => 'Administration',
            'code' => 'ADM',
            'description' => 'Protected',
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.departments.update', $department), [
                'name' => 'Hacked Admin',
                'code' => 'ADM',
                'description' => 'Should fail',
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertSame('Administration', $department->fresh()->name);
        $this->assertTrue($department->fresh()->is_active);

        $this->actingAs($admin)
            ->delete(route('admin.departments.destroy', $department))
            ->assertRedirect();

        $this->assertDatabaseHas('departments', ['id' => $department->id, 'code' => 'ADM']);
    }

    public function test_only_administrator_can_manage_administrator_role(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('management');
        // Give manage permission artificially for route access test
        $manager->givePermissionTo('roles.manage');

        $adminRole = Role::findByName('administrator');

        $this->actingAs($manager)
            ->get(route('admin.roles.edit', $adminRole))
            ->assertForbidden();

        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->get(route('admin.roles.edit', $adminRole))
            ->assertOk();
    }
}
