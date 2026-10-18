import {
    Bell,
    Building2,
    CalendarDays,
    CheckSquare,
    ClipboardCheck,
    ClipboardList,
    FileText,
    GitBranch,
    KanbanSquare,
    LayoutDashboard,
    Megaphone,
    Monitor,
    ScrollText,
    Settings,
    Shield,
    Ship,
    ShoppingCart,
    Users,
    Warehouse,
    Headset,
} from 'lucide-react';

/**
 * Sidebar navigation filtered by Spatie permissions shared via Inertia.
 */
export function navigationForUser(permissions = [], role = null, options = {}) {
    const can = (permission) => permissions.includes(permission);
    const canViewAnnouncements = options.canViewAnnouncements
        ?? Boolean(role && role !== 'customer');
    const isStaff = Boolean(role && role !== 'customer');

    const items = [
        {
            label: 'Dashboard',
            href: 'dashboard',
            routeName: 'dashboard',
            icon: LayoutDashboard,
            show: true,
        },
        {
            label: 'Approvals',
            href: 'approvals.index',
            routeName: 'approvals.*',
            icon: ClipboardCheck,
            show: can('leave.approve') || can('procurement.approve') || can('quotations.approve') || can('reports.weekly.review'),
        },
        {
            label: 'Users',
            href: 'admin.users.index',
            routeName: 'admin.users.*',
            icon: Users,
            show: can('users.view'),
        },
        {
            label: 'Roles',
            href: 'admin.roles.index',
            routeName: 'admin.roles.*',
            icon: Shield,
            show: can('roles.view') || can('roles.manage'),
        },
        {
            label: 'Departments',
            href: 'admin.departments.index',
            routeName: 'admin.departments.*',
            icon: Building2,
            show: can('departments.manage'),
        },
        {
            label: 'Branches',
            href: 'admin.branches.index',
            routeName: 'admin.branches.*',
            icon: GitBranch,
            show: can('branches.manage'),
        },
        {
            label: 'Company Settings',
            href: 'admin.settings.edit',
            routeName: 'admin.settings.*',
            icon: Settings,
            show: can('settings.manage'),
        },
        {
            label: 'Audit Logs',
            href: 'admin.audit-logs.index',
            routeName: 'admin.audit-logs.*',
            icon: ScrollText,
            show: can('audit.view'),
        },
        {
            label: 'Customers',
            href: 'crm.customers.index',
            routeName: 'crm.customers.*',
            icon: Users,
            show: can('customers.view'),
        },
        {
            label: 'Quotations',
            href: 'sales.quotations.index',
            routeName: 'sales.quotations.*',
            icon: FileText,
            show: can('quotations.view'),
        },
        {
            label: 'Pipeline',
            href: 'pipeline.index',
            routeName: 'pipeline.*',
            icon: KanbanSquare,
            show: can('pipeline.view') || can('pipeline.view_all') || can('pipeline.manage'),
        },
        {
            label: can('shipments.view') ? 'Shipments' : 'Track shipments',
            href: can('shipments.view') ? 'operations.shipments.index' : 'portal.shipments.index',
            routeName: can('shipments.view') ? 'operations.shipments.*' : 'portal.shipments.*',
            icon: Ship,
            show: can('shipments.view') || can('portal.shipments'),
        },
        {
            label: 'Warehouse',
            href: 'warehouse.index',
            routeName: 'warehouse.*',
            icon: Warehouse,
            show: can('warehouse.view'),
        },
        {
            label: 'Tasks',
            href: 'tasks.index',
            routeName: 'tasks.*',
            icon: CheckSquare,
            show: can('tasks.view') || can('tasks.manage'),
        },
        {
            label: 'Announcements',
            href: 'announcements.index',
            routeName: 'announcements.*',
            icon: Bell,
            show: canViewAnnouncements,
        },
        {
            label: 'Invoices',
            href: 'finance.invoices.index',
            routeName: 'finance.invoices.*',
            icon: FileText,
            show: can('invoices.view'),
        },
        {
            label: 'Procurement',
            href: 'procurement.index',
            routeName: 'procurement.*',
            icon: ShoppingCart,
            show: isStaff || can('procurement.request') || can('procurement.view_all') || can('procurement.approve') || can('procurement.process'),
        },
        {
            label: 'Leave',
            href: 'leave.index',
            routeName: 'leave.*',
            icon: CalendarDays,
            show: isStaff || can('leave.request') || can('leave.view_all') || can('leave.approve'),
        },
        {
            label: 'Reports',
            href: 'reports.index',
            routeName: 'reports.*',
            icon: ClipboardList,
            show: can('reports.weekly.submit') || can('reports.view_all') || can('reports.weekly.review'),
        },
        {
            label: 'Support',
            href: 'support.index',
            routeName: 'support.*',
            icon: Headset,
            show: can('support.view'),
        },
        {
            label: 'IT requests',
            href: 'it.requests.index',
            routeName: 'it.*',
            icon: Monitor,
            show: can('it.request') || can('it.manage'),
        },
        {
            label: 'IT & Marketing',
            href: 'marketing.campaigns.index',
            routeName: 'marketing.*',
            icon: Megaphone,
            show: can('marketing.view'),
        },
        {
            label: 'My Profile',
            href: 'profile.edit',
            routeName: 'profile.*',
            icon: Settings,
            show: true,
        },
    ];

    return items
        .filter((item) => item.show)
        .map((item) => ({
            ...item,
            url: item.href ? route(item.href) : '#',
        }));
}
