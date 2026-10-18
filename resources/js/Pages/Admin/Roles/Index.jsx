import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function RolesIndex({ roles }) {
    const { auth } = usePage().props;
    const canManage = (auth.user?.permissions ?? []).includes('roles.manage');

    return (
        <AppLayout title="Roles">
            <Head title="Roles" />

            <PageHeader
                title="Roles & permissions"
                description="Review system roles and adjust module access."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="font-display text-lg font-bold capitalize text-gf-ink dark:text-white">
                            {role.label}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{role.name}</p>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Permissions</p>
                                <p className="font-semibold">{role.permissions_count}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Users</p>
                                <p className="font-semibold">{role.users_count}</p>
                            </div>
                        </div>
                        {canManage && role.can_manage && (
                            <Link
                                href={route('admin.roles.edit', role.id)}
                                className="mt-4 inline-flex text-sm font-semibold text-gf-forest hover:underline"
                            >
                                Manage permissions
                            </Link>
                        )}
                        {canManage && !role.can_manage && (
                            <p className="mt-4 text-xs text-slate-400">Only administrators can manage this role.</p>
                        )}
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
