import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    draft: 'bg-slate-200 text-slate-700',
    submitted: 'bg-gf-blue/15 text-sky-800',
    approved: 'bg-gf-green/15 text-gf-forest',
    rejected: 'bg-gf-red/10 text-gf-red',
    revision_requested: 'bg-gf-yellow/20 text-amber-800',
};

export default function ReportsIndex({ reports, filters, canViewAll, statuses, periodTypes, departments, stats }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [periodType, setPeriodType] = useState(filters.period_type || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('reports.index'), {
            search: search || undefined,
            status: status || undefined,
            period_type: periodType || undefined,
            department_id: departmentId || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Reports">
            <Head title="Employee Reports" />
            <PageHeader
                title="Employee Reports"
                description={canViewAll ? 'Review weekly and monthly team reports.' : 'Submit your weekly and monthly work reports.'}
                actions={
                    permissions.includes('reports.weekly.submit') ? (
                        <HeaderLink href={route('reports.create')}>New report</HeaderLink>
                    ) : null
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">My drafts</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.my_drafts}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending review</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.pending_review}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approved</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.approved}</p>
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
                <TextInput className="md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, title, author" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                </select>
                <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All periods</option>
                    {periodTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {canViewAll ? (
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                        <option value="">All departments</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                ) : (
                    <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
                )}
                {canViewAll && (
                    <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest md:col-span-5">Filter</button>
                )}
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Reference</th>
                            {canViewAll && <th className="px-4 py-3">Author</th>}
                            <th className="px-4 py-3">Period</th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reports.data.map((report) => (
                            <tr key={report.id}>
                                <td className="px-4 py-3 font-medium">{report.reference}</td>
                                {canViewAll && <td className="px-4 py-3">{report.author_name}</td>}
                                <td className="px-4 py-3 capitalize">
                                    {report.period_type}
                                    <div className="text-xs text-slate-500">{report.period_start} → {report.period_end}</div>
                                </td>
                                <td className="px-4 py-3">{report.title}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusClass[report.status] || 'bg-slate-100'}`}>
                                        {report.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('reports.show', report.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!reports.data.length && (
                            <tr>
                                <td colSpan={canViewAll ? 6 : 5} className="px-4 py-10 text-center text-slate-500">
                                    No reports yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={reports.links} />
        </AppLayout>
    );
}
