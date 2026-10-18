import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function LeadsIndex({ leads, filters, statuses, stats }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('marketing.leads.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Leads">
            <Head title="Leads" />
            <PageHeader
                title="Leads"
                description="Prospects handled by IT & Marketing."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('marketing.campaigns.index')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                            Campaigns
                        </Link>
                        {permissions.includes('marketing.manage') && (
                            <HeaderLink href={route('marketing.leads.create')}>New lead</HeaderLink>
                        )}
                    </div>
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">New</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.new}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qualified</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.qualified}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Converted</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.converted}</p>
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Campaign</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {leads.data.map((lead) => (
                            <tr key={lead.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{lead.name}</div>
                                    <div className="text-xs text-slate-500">{lead.email || lead.phone || '—'}</div>
                                </td>
                                <td className="px-4 py-3">{lead.company || '—'}</td>
                                <td className="px-4 py-3">{lead.source || '—'}</td>
                                <td className="px-4 py-3">{lead.campaign || '—'}</td>
                                <td className="px-4 py-3 capitalize">{lead.status_label}</td>
                                <td className="px-4 py-3 text-right">
                                    {permissions.includes('marketing.manage') ? (
                                        <Link href={route('marketing.leads.edit', lead.id)} className="text-gf-forest hover:underline">Edit</Link>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                        {!leads.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No leads yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={leads.links} />
        </AppLayout>
    );
}
