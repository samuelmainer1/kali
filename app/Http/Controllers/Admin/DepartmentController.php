<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\ActivityLogService;
use App\Services\DepartmentPrivilegeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DepartmentController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly DepartmentPrivilegeService $privileges,
    ) {}

    public function index(): Response
    {
        $roles = Role::query()
            ->where('name', 'like', DepartmentPrivilegeService::ROLE_PREFIX.'%')
            ->with('permissions:id,name')
            ->get()
            ->keyBy('name');

        $departments = Department::query()
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(function (Department $department) use ($roles) {
                $permissions = $roles->get($this->privileges->roleName($department))?->permissions->pluck('name')->values()->all() ?? [];

                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'code' => $department->code,
                    'description' => $department->description,
                    'is_active' => $department->is_active,
                    'users_count' => $department->users_count,
                    'permissions' => $permissions,
                    'permissions_count' => count($permissions),
                    'is_protected' => $department->code === 'ADM',
                ];
            });

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $department = Department::query()->create(collect($data)->except('permissions')->all());
        $this->privileges->sync($department, $data['permissions']);

        $this->activityLog->log('departments.created', "Created department {$department->name}", $department, [
            'permissions' => $data['permissions'],
        ]);

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        if ($department->code === 'ADM') {
            return back()->with('error', 'The Administration department cannot be edited.');
        }

        $data = $this->validated($request, $department);

        $department->update(collect($data)->except('permissions')->all());
        $this->privileges->sync($department, $data['permissions']);

        $this->activityLog->log('departments.updated', "Updated department {$department->name}", $department, [
            'permissions' => $data['permissions'],
        ]);

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        if ($department->code === 'ADM') {
            return back()->with('error', 'The Administration department cannot be deleted.');
        }

        if ($department->users()->exists()) {
            return back()->with('error', 'Cannot delete a department that still has users.');
        }

        $name = $department->name;
        $this->privileges->forget($department);
        $department->delete();

        $this->activityLog->log('departments.deleted', "Deleted department {$name}");

        return back()->with('success', 'Department deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Department $department = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($department?->id)],
            'code' => ['required', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($department?->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::exists(config('permission.table_names.permissions'), 'name')],
        ]);

        $data['permissions'] = array_values($data['permissions'] ?? []);
        $allowed = $request->user()->getAllPermissions()->pluck('name');
        abort_unless(collect($data['permissions'])->diff($allowed)->isEmpty(), 403);

        return $data;
    }

    /**
     * @return Collection<int, array{group: string, permissions: Collection<int, array{id: int, name: string}>}>
     */
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
}
