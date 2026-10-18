<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate('customers.create');

        foreach (['sales', 'customer_care', 'marketing', 'management', 'administrator'] as $name) {
            $role = Role::query()->where('name', $name)->first();
            $role?->givePermissionTo('customers.create');
        }
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['customer_care', 'marketing'] as $name) {
            $role = Role::query()->where('name', $name)->first();
            if ($role?->hasPermissionTo('customers.create')) {
                $role->revokePermissionTo('customers.create');
            }
        }
    }
};
