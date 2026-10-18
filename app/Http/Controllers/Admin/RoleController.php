<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\DepartmentPrivilegeService;
use App\Support\RoleLabel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request): Response
    {
        $actorIsAdmin = $request->user()->hasRole('administrator');

        $roles = Role::query()
            ->where('name', 'not like', DepartmentPrivilegeService::ROLE_PREFIX.'%')
            ->withCount('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
                'label' => RoleLabel::get($role->name),
                'can_manage' => $role->name !== 'administrator' || $actorIsAdmin,
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function edit(Request $request, Role $role): Response
    {
        $this->guardAdministratorRole($request, $role);

        $grouped = Permission::query()
            ->orderBy('name')
            ->get()
            ->groupBy(fn (Permission $permission) => explode('.', $permission->name)[0] ?? 'general')
            ->map(fn ($items, $group) => [
                'group' => $group,
                'permissions' => $items->map(fn (Permission $permission) => [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ])->values(),
            ])
            ->values();

        return Inertia::render('Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => RoleLabel::get($role->name),
                'permissions' => $role->permissions->pluck('name'),
            ],
            'permissionGroups' => $grouped,
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $this->guardAdministratorRole($request, $role);

        $validated = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists(config('permission.table_names.permissions'), 'name')],
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->activityLog->log('roles.updated', "Updated permissions for role {$role->name}", $role, [
            'permissions' => $validated['permissions'] ?? [],
        ]);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role permissions updated.');
    }

    private function guardAdministratorRole(Request $request, Role $role): void
    {
        if ($role->name === 'administrator' && ! $request->user()->hasRole('administrator')) {
            abort(403, 'Only an administrator can manage the administrator role.');
        }
    }
}
