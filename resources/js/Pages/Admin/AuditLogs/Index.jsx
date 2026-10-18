import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function AuditLogsIndex({ logs, filters, actions }) {
    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || '');

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(
            route('admin.audit-logs.index'),
            {
                search: search || undefined,
                action: action || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout title="Audit logs">
            <Head title="Audit logs" />

            <PageHeader
                title="Audit logs"
                description="Track authentication and administration activity across the portal."
            />

            <form
                onSubmit={applyFilters}
                className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4"
            >
                <TextInput
                    className="md:col-span-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search description or action"
                />
                <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                >
                    <option value="">All actions</option>
                    {actions.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="rounded-xl bg-gf-ink px-4 py-2 text-sm font-semibold text-white dark:bg-gf-forest"
                >
                    Filter
                </button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">When</th>
                            <th className="px-4 py-3">Actor</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.data.map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-3">
                                    <div>{log.created_at_human}</div>
                                    <div className="text-xs text-slate-400">{log.created_at}</div>
                                </td>
                                <td className="px-4 py-3">{log.user}</td>
                                <td className="px-4 py-3">
                                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                                        {log.action}
                                    </code>
                                </td>
                                <td className="px-4 py-3">{log.description}</td>
                                <td className="px-4 py-3 text-slate-500">{log.ip_address || '—'}</td>
                            </tr>
                        ))}
                        {!logs.data.length && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                    No audit events found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={logs.links} />
        </AppLayout>
    );
}
