import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    draft: 'bg-slate-200 text-slate-700',
    sent: 'bg-gf-blue/15 text-sky-800',
    paid: 'bg-gf-green/15 text-gf-forest',
    overdue: 'bg-gf-red/10 text-gf-red',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function InvoicesIndex({ invoices, filters, statuses, stats, export_ready = false }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('finance.invoices.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Invoices">
            <Head title="Invoices" />
            <PageHeader
                title="Invoices"
                description="Bill customers and track payment status."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.post(route('finance.invoices.export'))}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                        >
                            Queue spreadsheet
                        </button>
                        {export_ready && (
                            <a
                                href={route('finance.invoices.export.download')}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Download spreadsheet
                            </a>
                        )}
                        {permissions.includes('invoices.manage') && (
                            <HeaderLink href={route('finance.invoices.create')}>New invoice</HeaderLink>
                        )}
                    </div>
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-4">
                {['draft', 'sent', 'paid', 'overdue'].map((key) => (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{key}</p>
                        <p className="mt-2 font-display text-2xl font-bold">{stats[key]}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference or customer" />
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
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Issue / Due</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invoices.data.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-4 py-3 font-medium">{invoice.reference}</td>
                                <td className="px-4 py-3">{invoice.customer}</td>
                                <td className="px-4 py-3 text-slate-500">{invoice.issue_date || '—'} → {invoice.due_date || '—'}</td>
                                <td className="px-4 py-3">{invoice.currency} {Number(invoice.total).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusClass[invoice.status] || 'bg-slate-100'}`}>
                                        {invoice.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('finance.invoices.show', invoice.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!invoices.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No invoices yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={invoices.links} />
        </AppLayout>
    );
}
