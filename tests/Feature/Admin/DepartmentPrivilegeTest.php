<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\User;
use App\Services\DepartmentPrivilegeService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentPrivilegeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_department_privileges_are_given_to_its_users(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.departments.store'), [
                'name' => 'Driver',
                'code' => 'DRV',
                'description' => 'Company drivers',
                'is_active' => true,
                'permissions' => ['shipments.view', 'shipments.track'],
            ])
            ->assertRedirect();

        $department = Department::query()->where('code', 'DRV')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Amina Driver',
                'email' => 'driver@globeflight.co.ke',
                'password' => 'Password1!',
                'password_confirmation' => 'Password1!',
                'role' => 'customer',
                'department_id' => $department->id,
                'is_active' => true,
            ])
            ->assertRedirect();

        $driver = User::query()->where('email', 'driver@globeflight.co.ke')->firstOrFail();
        $this->assertTrue($driver->hasRole('customer'));
        $this->assertSame('customer', $driver->primaryRole());
        $this->assertTrue($driver->can('shipments.view'));
        $this->assertTrue($driver->can('shipments.track'));
        $this->assertFalse($driver->can('warehouse.manage'));

        $this->actingAs($admin)
            ->put(route('admin.departments.update', $department), [
                'name' => 'Driver',
                'code' => 'DRV',
                'description' => 'Company drivers',
                'is_active' => true,
                'permissions' => ['shipments.track'],
            ])
            ->assertRedirect();

        $driver->unsetRelation('roles')->unsetRelation('permissions');
        $this->assertFalse($driver->can('shipments.view'));
        $this->assertTrue($driver->can('shipments.track'));

        $this->actingAs($admin)
            ->get(route('admin.roles.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Roles/Index')
                ->where('roles', fn ($roles) => collect($roles)->pluck('name')->doesntContain(
                    app(DepartmentPrivilegeService::class)->roleName($department)
                )));
    }
}
