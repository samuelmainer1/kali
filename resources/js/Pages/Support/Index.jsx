import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    open: 'bg-gf-blue/15 text-sky-800',
    in_progress: 'bg-gf-yellow/20 text-amber-800',
    waiting_customer: 'bg-slate-200 text-slate-700',
    resolved: 'bg-gf-green/15 text-gf-forest',
    closed: 'bg-slate-100 text-slate-500',
};

export default function SupportIndex({ tickets, filters, canManage, statuses, priorities, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [priority, setPriority] = useState(filters.priority || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('support.index'), {
            search: search || undefined,
            status: status || undefined,
            priority: priority || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Support">
            <Head title="Support" />
            <PageHeader
                title="Support"
                description={canManage ? 'Customer care ticket queue.' : 'Your support tickets with Globeflight.'}
                actions={<HeaderLink href={route('support.create')}>New ticket</HeaderLink>}
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Open</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.open}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Urgent</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.urgent}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resolved</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.resolved}</p>
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput className="md:col-span-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All priorities</option>
                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">Subject</th>
                            {canManage && <th className="px-4 py-3">Requester</th>}
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tickets.data.map((ticket) => (
                            <tr key={ticket.id}>
                                <td className="px-4 py-3 font-medium">{ticket.reference}</td>
                                <td className="px-4 py-3">{ticket.subject}</td>
                                {canManage && <td className="px-4 py-3">{ticket.requester_name}</td>}
                                <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusClass[ticket.status] || 'bg-slate-100'}`}>
                                        {ticket.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('support.show', ticket.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!tickets.data.length && (
                            <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-slate-500">No tickets yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={tickets.links} />
        </AppLayout>
    );
}
