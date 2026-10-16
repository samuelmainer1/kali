import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    pending: 'bg-gf-yellow/20 text-amber-800',
    approved: 'bg-gf-green/15 text-gf-forest',
    rejected: 'bg-gf-red/15 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function LeaveIndex({
    requests,
    filters,
    statuses,
    statusLabels,
    leaveTypes,
    canViewAll,
    canRequest,
    balances,
    stats,
}) {
    const [search, setSearch] = useState(filters.q || '');
    const [status, setStatus] = useState(filters.status || '');
    const [leaveTypeId, setLeaveTypeId] = useState(filters.leave_type_id || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('leave.index'), {
            q: search || undefined,
            status: status || undefined,
            leave_type_id: leaveTypeId || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Leave">
            <Head title="Leave & Attendance" />
            <PageHeader
                title="Leave & Attendance"
                description="Request time off, track balances, and review team leave."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('leave.calendar')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                            Calendar
                        </Link>
                        {canRequest && <HeaderLink href={route('leave.create')}>New leave request</HeaderLink>}
                    </div>
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Upcoming approved</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.approved_upcoming}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">My annual remaining</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.my_remaining_annual}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{canViewAll ? 'On leave today' : 'Am I on leave today?'}</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.on_leave_today}</p>
                </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <h3 className="font-display text-sm font-bold">My balances ({new Date().getFullYear()})</h3>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {balances.map((balance) => (
                        <div key={balance.leave_type_id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                            <p className="text-sm font-semibold">{balance.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Remaining <span className="font-bold text-gf-forest">{balance.remaining}</span> of {balance.entitled + balance.carried_over}
                            </p>
                            <p className="text-xs text-slate-400">Taken {balance.taken}</p>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leave" className="md:col-span-2" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
                <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All types</option>
                    {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest md:col-span-4 lg:col-span-1">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Request</th>
                            {canViewAll && <th className="px-4 py-3">Employee</th>}
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Days</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requests.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 font-medium">{item.reference}</td>
                                {canViewAll && <td className="px-4 py-3">{item.requester_name}</td>}
                                <td className="px-4 py-3">{item.leave_type_name}</td>
                                <td className="px-4 py-3">{item.start_date} → {item.end_date}</td>
                                <td className="px-4 py-3">{item.days}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[item.status] || 'bg-slate-100'}`}>
                                        {item.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('leave.show', item.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!requests.data.length && (
                            <tr>
                                <td colSpan={canViewAll ? 7 : 6} className="px-4 py-8 text-center text-slate-500">No leave requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={requests.links} />
        </AppLayout>
    );
}
