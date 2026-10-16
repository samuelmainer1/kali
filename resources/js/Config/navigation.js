import {
    Boxes,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Megaphone,
    Package,
    Settings,
    Shield,
    Ship,
    Users,
    Warehouse,
    Headset,
} from 'lucide-react';

/**
 * Sidebar navigation filtered by Spatie permissions shared via Inertia.
 */
export function navigationForUser(permissions = []) {
    const can = (permission) =>
        permissions.includes(permission) || permissions.includes('settings.manage');

    const items = [
        {
            label: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutDashboard,
            show: true,
        },
        {
            label: 'Customers',
            href: '#',
            icon: Users,
            show: can('customers.view'),
            soon: true,
        },
        {
            label: 'Quotations',
            href: '#',
            icon: FileText,
            show: can('quotations.view'),
            soon: true,
        },
        {
            label: 'Shipments',
            href: '#',
            icon: Ship,
            show: can('shipments.view') || can('portal.shipments'),
            soon: true,
        },
        {
            label: 'Warehouse',
            href: '#',
            icon: Warehouse,
            show: can('warehouse.view'),
            soon: true,
        },
        {
            label: 'Reports',
            href: '#',
            icon: ClipboardList,
            show: can('reports.weekly.submit') || can('reports.view_all'),
            soon: true,
        },
        {
            label: 'Support',
            href: '#',
            icon: Headset,
            show: can('support.view'),
            soon: true,
        },
        {
            label: 'Marketing',
            href: '#',
            icon: Megaphone,
            show: can('marketing.view'),
            soon: true,
        },
        {
            label: 'Inventory',
            href: '#',
            icon: Boxes,
            show: can('warehouse.manage'),
            soon: true,
        },
        {
            label: 'Administration',
            href: '#',
            icon: Shield,
            show: can('users.view') || can('roles.manage'),
            soon: true,
        },
        {
            label: 'Settings',
            href: route('profile.edit'),
            icon: Settings,
            show: true,
        },
        {
            label: 'Packages',
            href: '#',
            icon: Package,
            show: false,
        },
    ];

    return items.filter((item) => item.show);
}
