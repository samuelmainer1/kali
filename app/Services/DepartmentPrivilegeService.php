<?php

namespace App\Services;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DepartmentPrivilegeService
{
    public const ROLE_PREFIX = 'department:';

    public function roleName(Department $department): string
    {
        return self::ROLE_PREFIX.$department->id;
    }

    public function isDepartmentRole(string $name): bool
    {
        return str_starts_with($name, self::ROLE_PREFIX);
    }

    public function staffRoles(): Builder
    {
        return Role::query()
            ->where('name', 'not like', self::ROLE_PREFIX.'%')
            ->orderBy('name');
    }

    public function ensureRole(Department $department): Role
    {
        return Role::findOrCreate($this->roleName($department));
    }

    /**
     * @param  list<string>  $permissions
     */
    public function sync(Department $department, array $permissions): Role
    {
        $role = $this->ensureRole($department);
        $role->syncPermissions($permissions);
        $this->forgetCache();

        $department->users()->each(fn (User $user) => $this->attachUser($user));

        return $role;
    }

    public function attachUser(User $user): void
    {
        $roles = $user->getRoleNames()
            ->reject(fn (string $name) => $this->isDepartmentRole($name))
            ->values()
            ->all();

        if ($user->department_id) {
            $department = $user->relationLoaded('department')
                ? $user->department
                : Department::query()->find($user->department_id);

            if ($department) {
                $roles[] = $this->ensureRole($department)->name;
            }
        }

        $user->syncRoles($roles);
        $this->forgetCache();
    }

    public function forget(Department $department): void
    {
        Role::query()->where('name', $this->roleName($department))->delete();
        $this->forgetCache();
    }

    /**
     * @return list<string>
     */
    public function names(Department $department): array
    {
        $role = Role::query()->where('name', $this->roleName($department))->with('permissions:id,name')->first();

        return $role ? $role->permissions->pluck('name')->all() : [];
    }

    private function forgetCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
