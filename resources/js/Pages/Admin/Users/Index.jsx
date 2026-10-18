import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import { roleLabel } from '@/Config/roleLabels';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UsersIndex({ users, filters, roles, departments }) {
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions ?? [];
    const canCreate = permissions.includes('users.create');
    const canUpdate = permissions.includes('users.update');

    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(
            route('admin.users.index'),
            {
                search: search || undefined,
                role: role || undefined,
                department_id: departmentId || undefined,
                status: status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout title="Users">
            <Head title="Users" />

            <PageHeader
                title="User management"
                description="Create staff accounts, assign roles, and control access."
                actions={canCreate ? <HeaderLink href={route('admin.users.create')}>Add user</HeaderLink> : null}
            />

            <form
                onSubmit={applyFilters}
                className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5"
            >
                <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, code"
                    className="md:col-span-2"
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                >
                    <option value="">All roles</option>
                    {roles.map((item) => (
                        <option key={item} value={item}>
                            {roleLabel(item)}
                        </option>
                    ))}
                </select>
                <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                >
                    <option value="">All departments</option>
                    {departments.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                    >
                        <option value="">All status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest"
                    >
                        Filter
                    </button>
                </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3">Branch</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Last login</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.data.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gf-ink dark:text-white">{user.name}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">{user.role ? roleLabel(user.role) : '—'}</td>
                                    <td className="px-4 py-3">{user.department || '—'}</td>
                                    <td className="px-4 py-3">{user.branch || '—'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge active={user.is_active} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{user.last_login_at || 'Never'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {canUpdate && !user.is_protected && (
                                                <>
                                                    <Link
                                                        href={route('admin.users.edit', user.id)}
                                                        className="rounded-lg px-2 py-1 text-gf-forest hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.patch(route('admin.users.toggle-active', user.id))
                                                        }
                                                        className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </>
                                            )}
                                            {user.is_protected && (
                                                <span className="text-xs text-slate-400">Protected</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!users.data.length && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={users.links} />
        </AppLayout>
    );
}
