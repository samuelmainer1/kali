import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

const statusClass = {
    pending: 'bg-gf-yellow/20 text-amber-800',
    approved: 'bg-gf-green/15 text-gf-forest',
};

export default function LeaveCalendar({ month, month_label, entries, canViewAll }) {
    const shiftMonth = (delta) => {
        const [year, mon] = month.split('-').map(Number);
        const date = new Date(year, mon - 1 + delta, 1);
        const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('leave.calendar'), { month: next }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Leave calendar">
            <Head title="Leave calendar" />
            <PageHeader
                title="Leave calendar"
                description={canViewAll ? 'Team leave for the selected month.' : 'Your leave for the selected month.'}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('leave.index')} className="text-sm text-gf-forest">All requests</Link>
                        <button type="button" onClick={() => shiftMonth(-1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Prev</button>
                        <button type="button" onClick={() => shiftMonth(1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Next</button>
                    </div>
                }
            />

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-display text-xl font-bold">{month_label}</h2>
                <p className="mt-1 text-sm text-slate-500">{entries.length} leave item(s)</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            {canViewAll && <th className="px-4 py-3">Employee</th>}
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Days</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Open</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                {canViewAll && <td className="px-4 py-3">{entry.employee}</td>}
                                <td className="px-4 py-3">{entry.leave_type}</td>
                                <td className="px-4 py-3">{entry.start_date} → {entry.end_date}</td>
                                <td className="px-4 py-3">{entry.days}{entry.is_half_day ? ' (half)' : ''}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[entry.status] || 'bg-slate-100'}`}>
                                        {entry.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('leave.show', entry.id)} className="text-gf-forest hover:underline">{entry.reference}</Link>
                                </td>
                            </tr>
                        ))}
                        {!entries.length && (
                            <tr>
                                <td colSpan={canViewAll ? 6 : 5} className="px-4 py-8 text-center text-slate-500">No leave in this month.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
