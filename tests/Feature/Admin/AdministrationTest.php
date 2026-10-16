<?php

namespace Tests\Feature\Admin;

use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdministrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_users_index(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Users/Index'));
    }

    public function test_non_admin_cannot_view_users_index(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');

        $this->actingAs($sales)
            ->get(route('admin.users.index'))
            ->assertForbidden();
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $department = Department::query()->create([
            'name' => 'Sales Desk',
            'code' => 'SD1',
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'New Officer',
                'email' => 'officer@globeflight.co.ke',
                'phone' => '+254700111222',
                'employee_code' => 'GF-SAL-099',
                'password' => 'Password1!',
                'password_confirmation' => 'Password1!',
                'role' => 'sales',
                'department_id' => $department->id,
                'branch_id' => null,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'officer@globeflight.co.ke',
            'employee_code' => 'GF-SAL-099',
        ]);

        $created = User::query()->where('email', 'officer@globeflight.co.ke')->first();
        $this->assertTrue($created->hasRole('sales'));
    }

    public function test_admin_can_manage_departments_and_branches(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->post(route('admin.departments.store'), [
                'name' => 'Quality',
                'code' => 'QAL',
                'description' => 'QA',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('departments', ['code' => 'QAL']);

        $this->actingAs($admin)
            ->post(route('admin.branches.store'), [
                'name' => 'Kisumu Branch',
                'code' => 'KSM',
                'city' => 'Kisumu',
                'country' => 'Kenya',
                'phone' => null,
                'email' => null,
                'address' => null,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('branches', ['code' => 'KSM']);
    }

    public function test_admin_can_view_audit_logs_and_settings(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $this->actingAs($admin)
            ->get(route('admin.audit-logs.index'))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Settings/Edit'));
    }

    public function test_admin_can_update_role_permissions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrator');

        $role = \Spatie\Permission\Models\Role::findByName('sales');

        $this->actingAs($admin)
            ->put(route('admin.roles.update', $role), [
                'permissions' => ['dashboard.sales', 'customers.view'],
            ])
            ->assertRedirect(route('admin.roles.index'));

        $this->assertTrue($role->fresh()->hasPermissionTo('customers.view'));
        $this->assertFalse($role->fresh()->hasPermissionTo('customers.create'));
    }
}
