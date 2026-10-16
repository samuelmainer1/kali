import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function CampaignsIndex({ campaigns, filters, statuses, channels, stats }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [channel, setChannel] = useState(filters.channel || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('marketing.campaigns.index'), {
            search: search || undefined,
            status: status || undefined,
            channel: channel || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Campaigns">
            <Head title="Marketing Campaigns" />
            <PageHeader
                title="Marketing Campaigns"
                description="Plan and track outreach campaigns."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('marketing.leads.index')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                            Leads
                        </Link>
                        {permissions.includes('marketing.manage') && (
                            <HeaderLink href={route('marketing.campaigns.create')}>New campaign</HeaderLink>
                        )}
                    </div>
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Active</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Scheduled</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.scheduled}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Draft</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.draft}</p>
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All channels</option>
                    {channels.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Channel</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Leads</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {campaigns.data.map((campaign) => (
                            <tr key={campaign.id}>
                                <td className="px-4 py-3 font-medium">{campaign.reference}</td>
                                <td className="px-4 py-3">{campaign.name}</td>
                                <td className="px-4 py-3 capitalize">{campaign.channel}</td>
                                <td className="px-4 py-3 capitalize">{campaign.status_label}</td>
                                <td className="px-4 py-3">{campaign.leads_count}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('marketing.campaigns.show', campaign.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!campaigns.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No campaigns yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={campaigns.links} />
        </AppLayout>
    );
}
