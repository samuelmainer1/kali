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

            // Sales pipeline
            'pipeline.view', 'pipeline.manage', 'pipeline.view_all',

            // Shipments
            'shipments.view', 'shipments.create', 'shipments.update', 'shipments.track',

            // Warehouse
            'warehouse.view', 'warehouse.manage',

            // Finance
            'invoices.view', 'invoices.manage', 'finance.reports',

            // Procurement / expense requests
            'procurement.request', 'procurement.approve', 'procurement.process', 'procurement.view_all',

            // Leave & attendance
            'leave.request', 'leave.approve', 'leave.view_all', 'leave.manage',

            // Reports
            'reports.weekly.submit', 'reports.weekly.review', 'reports.view_all', 'reports.export',

            // Tasks
            'tasks.view', 'tasks.create', 'tasks.manage',

            // Announcements
            'announcements.view', 'announcements.manage',

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

        $allExceptAdminDashboard = Permission::query()
            ->where('name', '!=', 'dashboard.admin')
            ->pluck('name')
            ->all();

        $map = [
            'administrator' => Permission::all()->pluck('name')->all(),
            'management' => $allExceptAdminDashboard,
            'sales' => [
                'dashboard.sales', 'customers.view', 'customers.create', 'customers.update',
                'quotations.view', 'quotations.create', 'quotations.update', 'quotations.convert',
                'shipments.view', 'reports.weekly.submit', 'portal.quotes',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'pipeline.view', 'pipeline.manage',
                'procurement.request',
                'leave.request',
            ],
            'operations' => [
                'dashboard.operations', 'shipments.view', 'shipments.create', 'shipments.update',
                'shipments.track', 'quotations.view', 'warehouse.view', 'reports.weekly.submit',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'procurement.request',
                'leave.request',
            ],
            'warehouse' => [
                'dashboard.warehouse', 'warehouse.view', 'warehouse.manage',
                'shipments.view', 'shipments.update', 'reports.weekly.submit',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'procurement.request',
                'leave.request',
            ],
            'finance' => [
                'dashboard.finance', 'invoices.view', 'invoices.manage', 'finance.reports',
                'quotations.view', 'customers.view', 'reports.export', 'reports.weekly.submit',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'procurement.request', 'procurement.process', 'procurement.view_all',
                'leave.request',
            ],
            'customer_care' => [
                'dashboard.customer_care', 'support.view', 'support.manage',
                'customers.view', 'shipments.view', 'shipments.track',
                'quotations.view', 'reports.weekly.submit',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'procurement.request',
                'leave.request',
            ],
            'marketing' => [
                'dashboard.marketing', 'marketing.view', 'marketing.manage',
                'customers.view', 'reports.weekly.submit',
                'tasks.view', 'tasks.create',
                'announcements.view',
                'procurement.request',
                'leave.request',
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
