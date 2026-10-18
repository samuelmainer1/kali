<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\DepartmentPrivilegeService;
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
    /**
     * Roles shipped with the system. Their names are used by dashboards and access checks.
     *
     * @var list<string>
     */
    public const SYSTEM_ROLES = [
        'administrator',
        'management',
        'sales',
        'operations',
        'warehouse',
        'finance',
        'customer_care',
        'marketing',
        'customer',
    ];

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
                'label' => str_replace('_', ' ', $role->name),
                'is_system' => $this->isSystemRole($role->name),
                'can_manage' => $role->name !== 'administrator' || $actorIsAdmin,
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $this->assertCanGrant($request, $validated['permissions']);

        $role = Role::findOrCreate($validated['name']);
        $role->syncPermissions($validated['permissions']);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->activityLog->log('roles.created', "Created role {$role->name}", $role, [
            'permissions' => $validated['permissions'],
        ]);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role created. It is now available when you add a user.');
    }

    public function edit(Request $request, Role $role): Response
    {
        $this->guardEditableRole($role);
        $this->guardAdministratorRole($request, $role);

        return Inertia::render('Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => str_replace('_', ' ', $role->name),
                'permissions' => $role->permissions->pluck('name'),
            ],
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $this->guardEditableRole($role);
        $this->guardAdministratorRole($request, $role);

        $validated = $this->validatedPermissions($request);
        $this->assertCanGrant($request, $validated['permissions'], $role);

        $role->syncPermissions($validated['permissions']);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->activityLog->log('roles.updated', "Updated permissions for role {$role->name}", $role, [
            'permissions' => $validated['permissions'],
        ]);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role permissions updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->guardEditableRole($role);

        if ($this->isSystemRole($role->name)) {
            return back()->with('error', 'Built-in roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            return back()->with('error', 'Reassign users on this role before deleting it.');
        }

        $name = $role->name;
        $role->delete();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->activityLog->log('roles.deleted', "Deleted role {$name}");

        return back()->with('success', 'Role deleted.');
    }

    /**
     * @return array{name: string, permissions: list<string>}
     */
    private function validated(Request $request): array
    {
        $request->merge([
            'name' => $this->normalizeRoleName((string) $request->input('name', '')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[a-z][a-z0-9_]*$/',
                Rule::unique(config('permission.table_names.roles'), 'name'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && str_starts_with($value, DepartmentPrivilegeService::ROLE_PREFIX)) {
                        $fail('This name is reserved for departments.');
                    }
                },
            ],
            ...$this->permissionRules(),
        ], [
            'name.regex' => 'Use letters and numbers, for example Driver.',
        ]);

        $validated['permissions'] = array_values($validated['permissions'] ?? []);

        return $validated;
    }

    /**
     * @return array{permissions: list<string>}
     */
    private function validatedPermissions(Request $request): array
    {
        $validated = $request->validate($this->permissionRules());
        $validated['permissions'] = array_values($validated['permissions'] ?? []);

        return $validated;
    }

    /**
     * @return array<string, mixed>
     */
    private function permissionRules(): array
    {
        return [
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::exists(config('permission.table_names.permissions'), 'name')],
        ];
    }

    /**
     * A person can add permissions they already hold. They can still remove any permission.
     *
     * @param  list<string>  $permissions
     */
    private function assertCanGrant(Request $request, array $permissions, ?Role $role = null): void
    {
        $current = $role?->permissions->pluck('name') ?? collect();
        $added = collect($permissions)->diff($current);
        $allowed = $request->user()->getAllPermissions()->pluck('name');

        abort_unless(
            $added->diff($allowed)->isEmpty(),
            403,
            'You can only assign permissions you already have.',
        );
    }

    private function permissionGroups()
    {
        return Permission::query()
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
    }

    private function normalizeRoleName(string $name): string
    {
        $normalized = strtolower(trim($name));
        $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized) ?? '';

        return trim($normalized, '_');
    }

    private function isSystemRole(string $name): bool
    {
        return in_array($name, self::SYSTEM_ROLES, true);
    }

    private function guardEditableRole(Role $role): void
    {
        if (str_starts_with($role->name, DepartmentPrivilegeService::ROLE_PREFIX)) {
            abort(404);
        }
    }

    private function guardAdministratorRole(Request $request, Role $role): void
    {
        if ($role->name === 'administrator' && ! $request->user()->hasRole('administrator')) {
            abort(403, 'Only an administrator can manage the administrator role.');
        }
    }
}
