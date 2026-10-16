<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed system roles and module permissions.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Administration
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.manage',
            'departments.manage', 'branches.manage',
            'settings.manage', 'audit.view', 'logs.view',

            // CRM
            'customers.view', 'customers.create', 'customers.update', 'customers.delete',

            // Quotations
            'quotations.view', 'quotations.create', 'quotations.update',
            'quotations.approve', 'quotations.reject', 'quotations.convert',

            // Shipments
            'shipments.view', 'shipments.create', 'shipments.update', 'shipments.track',

            // Warehouse
            'warehouse.view', 'warehouse.manage',

            // Finance
            'invoices.view', 'invoices.manage', 'finance.reports',

            // Reports
            'reports.weekly.submit', 'reports.weekly.review', 'reports.view_all', 'reports.export',

            // Customer care / portal
            'support.view', 'support.manage',
            'portal.shipments', 'portal.quotes', 'portal.documents', 'portal.invoices',

            // Marketing
            'marketing.view', 'marketing.manage',

            // Dashboards
            'dashboard.admin', 'dashboard.management', 'dashboard.sales',
            'dashboard.operations', 'dashboard.warehouse', 'dashboard.finance',
            'dashboard.customer_care', 'dashboard.marketing', 'dashboard.customer',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        $map = [
            'administrator' => Permission::all()->pluck('name')->all(),
            'management' => [
                'dashboard.management', 'customers.view', 'quotations.view', 'quotations.approve',
                'quotations.reject', 'shipments.view', 'shipments.track', 'warehouse.view',
                'invoices.view', 'finance.reports', 'reports.view_all', 'reports.export',
                'reports.weekly.review', 'audit.view', 'support.view',
            ],
            'sales' => [
                'dashboard.sales', 'customers.view', 'customers.create', 'customers.update',
                'quotations.view', 'quotations.create', 'quotations.update', 'quotations.convert',
                'shipments.view', 'reports.weekly.submit', 'portal.quotes',
            ],
            'operations' => [
                'dashboard.operations', 'shipments.view', 'shipments.create', 'shipments.update',
                'shipments.track', 'quotations.view', 'warehouse.view', 'reports.weekly.submit',
            ],
            'warehouse' => [
                'dashboard.warehouse', 'warehouse.view', 'warehouse.manage',
                'shipments.view', 'shipments.update', 'reports.weekly.submit',
            ],
            'finance' => [
                'dashboard.finance', 'invoices.view', 'invoices.manage', 'finance.reports',
                'quotations.view', 'customers.view', 'reports.export', 'reports.weekly.submit',
            ],
            'customer_care' => [
                'dashboard.customer_care', 'support.view', 'support.manage',
                'customers.view', 'shipments.view', 'shipments.track',
                'quotations.view', 'reports.weekly.submit',
            ],
            'marketing' => [
                'dashboard.marketing', 'marketing.view', 'marketing.manage',
                'customers.view', 'reports.weekly.submit',
            ],
            'customer' => [
                'dashboard.customer', 'portal.shipments', 'portal.quotes',
                'portal.documents', 'portal.invoices', 'support.view',
            ],
        ];

        foreach ($map as $roleName => $perms) {
            $role = Role::findOrCreate($roleName);
            $role->syncPermissions($perms);
        }
    }
}
