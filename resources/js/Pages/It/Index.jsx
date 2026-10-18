import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    open: 'bg-gf-blue/15 text-sky-800',
    in_progress: 'bg-gf-yellow/20 text-amber-800',
    resolved: 'bg-gf-green/15 text-gf-forest',
    closed: 'bg-slate-100 text-slate-500',
};

export default function ItIndex({ requests, filters, canManage, statuses, department, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (event) => {
        event.preventDefault();
        router.get(route('it.requests.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="IT requests">
            <Head title="IT requests" />
            <PageHeader
                title="IT requests"
                description={canManage
                    ? `Requests for the ${department.name} department.`
                    : `Send IT issues to ${department.name}. You can follow the ones you opened.`}
                actions={<HeaderLink href={route('it.requests.create')}>New IT request</HeaderLink>}
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                    ['Open', stats.open],
                    ['Urgent', stats.urgent],
                    ['Resolved', stats.resolved],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput className="md:col-span-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference or title" />
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Reference</th>
                            {canManage && <th className="px-4 py-3">From</th>}
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requests.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 font-medium">{item.reference}</td>
                                {canManage && <td className="px-4 py-3">{item.requester_name}</td>}
                                <td className="px-4 py-3">{item.title}</td>
                                <td className="px-4 py-3 capitalize">{item.category}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusClass[item.status] || 'bg-slate-100'}`}>
                                        {item.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('it.requests.show', item.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!requests.data.length && (
                            <tr>
                                <td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-slate-500">No IT requests yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={requests.links} />
        </AppLayout>
    );
}
