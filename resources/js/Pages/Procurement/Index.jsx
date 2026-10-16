import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    submitted: 'bg-gf-yellow/20 text-amber-800',
    approved: 'bg-gf-blue/15 text-sky-800',
    rejected: 'bg-gf-red/15 text-red-700',
    processed: 'bg-gf-green/15 text-gf-forest',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function ProcurementIndex({
    requests,
    filters,
    statuses,
    statusLabels,
    canViewAll,
    canRequest,
    departments,
    stats,
}) {
    const [search, setSearch] = useState(filters.q || '');
    const [status, setStatus] = useState(filters.status || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('procurement.index'), {
            q: search || undefined,
            status: status || undefined,
            department_id: departmentId || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Procurement">
            <Head title="Purchase Requests" />
            <PageHeader
                title="Purchase Requests"
                description="Submit internal purchase needs. Managers approve, finance processes."
                actions={
                    canRequest ? (
                        <HeaderLink href={route('procurement.create')}>New request</HeaderLink>
                    ) : null
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending approval</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approved</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.approved}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Processed this month</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.processed_month}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Spend this month</p>
                    <p className="mt-2 font-display text-2xl font-bold">{Number(stats.spend_month || 0).toLocaleString()}</p>
                </div>
            </div>

            <form onSubmit={apply} className={`mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${canViewAll ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests" className="md:col-span-2" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
                {canViewAll && (
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                        <option value="">All departments</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                )}
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Request</th>
                            {canViewAll && <th className="px-4 py-3">Requester</th>}
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requests.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{item.reference}</div>
                                    <div className="text-slate-600 dark:text-slate-300">{item.title}</div>
                                </td>
                                {canViewAll && <td className="px-4 py-3">{item.requester}</td>}
                                <td className="px-4 py-3">{item.department || '—'}</td>
                                <td className="px-4 py-3">{Number(item.total_amount).toLocaleString()} {item.currency}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClass[item.status] || 'bg-slate-100'}`}>
                                        {item.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('procurement.show', item.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!requests.data.length && (
                            <tr>
                                <td colSpan={canViewAll ? 6 : 5} className="px-4 py-10 text-center text-slate-500">No purchase requests yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={requests.links} />
        </AppLayout>
    );
}
