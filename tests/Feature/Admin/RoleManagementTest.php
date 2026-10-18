<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Services\DepartmentPrivilegeService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_a_role_and_assign_it_to_a_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.roles.store'), [
                'name' => 'Driver',
                'permissions' => ['shipments.view', 'shipments.track'],
            ])
            ->assertRedirect(route('admin.roles.index'))
            ->assertSessionHas('success');

        $role = Role::findByName('driver');
        $this->assertTrue($role->hasPermissionTo('shipments.view'));
        $this->assertTrue($role->hasPermissionTo('shipments.track'));
        $this->assertFalse($role->hasPermissionTo('shipments.create'));

        $this->actingAs($admin)
            ->get(route('admin.users.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Users/Form')
                ->where('roles', fn ($roles) => collect($roles)->contains('driver')));

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Company Driver',
                'email' => 'driver@globeflight.co.ke',
                'phone' => '+254700111333',
                'employee_code' => 'GF-DRV-001',
                'password' => 'Password1!',
                'password_confirmation' => 'Password1!',
                'role' => 'driver',
                'department_id' => null,
                'branch_id' => null,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.users.index'));

        $driver = User::query()->where('email', 'driver@globeflight.co.ke')->first();
        $this->assertTrue($driver->hasRole('driver'));
        $this->assertSame('driver', $driver->primaryRole());
    }

    public function test_role_names_are_normalized_and_duplicates_are_rejected(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.roles.store'), [
                'name' => 'Fleet Driver',
                'permissions' => ['shipments.view'],
            ])
            ->assertRedirect(route('admin.roles.index'));

        $this->assertNotNull(Role::findByName('fleet_driver'));

        $this->actingAs($admin)
            ->from(route('admin.roles.index'))
            ->post(route('admin.roles.store'), [
                'name' => 'fleet driver',
                'permissions' => ['shipments.view'],
            ])
            ->assertRedirect(route('admin.roles.index'))
            ->assertSessionHasErrors('name');
    }

    public function test_department_prefix_is_not_stored_and_unknown_permissions_are_rejected(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.roles.store'), [
                'name' => 'department:9',
                'permissions' => [],
            ])
            ->assertRedirect(route('admin.roles.index'));

        $this->assertNull(Role::query()->where('name', 'department:9')->first());
        $this->assertNotNull(Role::findByName('department_9'));

        $this->actingAs($admin)
            ->from(route('admin.roles.index'))
            ->post(route('admin.roles.store'), [
                'name' => 'Auditor',
                'permissions' => ['not.a.real.permission'],
            ])
            ->assertRedirect(route('admin.roles.index'))
            ->assertSessionHasErrors('permissions.0');
    }

    public function test_user_without_role_management_cannot_create_a_role(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->post(route('admin.roles.store'), [
                'name' => 'Driver',
                'permissions' => ['shipments.view'],
            ])
            ->assertForbidden();
    }

    public function test_manager_cannot_grant_a_permission_they_do_not_hold(): void
    {
        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($manager)
            ->post(route('admin.roles.store'), [
                'name' => 'Director',
                'permissions' => ['dashboard.admin'],
            ])
            ->assertForbidden();

        $this->assertNull(Role::query()->where('name', 'director')->first());
    }

    public function test_built_in_roles_cannot_be_deleted_and_custom_roles_can(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $sales = Role::findByName('sales');

        $this->actingAs($admin)
            ->delete(route('admin.roles.destroy', $sales))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertNotNull(Role::findByName('sales'));

        $this->actingAs($admin)
            ->post(route('admin.roles.store'), [
                'name' => 'Driver',
                'permissions' => ['shipments.view'],
            ])
            ->assertRedirect();

        $driver = Role::findByName('driver');

        $this->actingAs($admin)
            ->delete(route('admin.roles.destroy', $driver))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertNull(Role::query()->where('name', 'driver')->first());
    }

    public function test_a_role_with_users_cannot_be_deleted(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.roles.store'), [
                'name' => 'Driver',
                'permissions' => ['shipments.view'],
            ]);

        $driverUser = User::factory()->create();
        $driverUser->assignRole('driver');

        $this->actingAs($admin)
            ->delete(route('admin.roles.destroy', Role::findByName('driver')))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertTrue($driverUser->fresh()->hasRole('driver'));
    }

    public function test_department_privilege_roles_are_hidden_from_the_role_editor(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $departmentRole = Role::findOrCreate(DepartmentPrivilegeService::ROLE_PREFIX.'4');

        $this->actingAs($admin)
            ->get(route('admin.roles.edit', $departmentRole))
            ->assertNotFound();

        $this->actingAs($admin)
            ->put(route('admin.roles.update', $departmentRole), [
                'permissions' => ['shipments.view'],
            ])
            ->assertNotFound();
    }
}
