import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function QuotationsIndex({ quotations, filters, statuses }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('sales.quotations.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Quotations">
            <Head title="Quotations" />
            <PageHeader
                title="Quotations"
                description="Create quotes, approve them, and convert to shipments."
                actions={
                    permissions.includes('quotations.create') ? (
                        <HeaderLink href={route('sales.quotations.create')}>New quotation</HeaderLink>
                    ) : null
                }
            />

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput className="md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference or customer" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
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
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Service</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {quotations.data.map((quote) => (
                            <tr key={quote.id}>
                                <td className="px-4 py-3 font-medium">{quote.reference}</td>
                                <td className="px-4 py-3">{quote.customer}</td>
                                <td className="px-4 py-3 capitalize">{quote.status.replaceAll('_', ' ')}</td>
                                <td className="px-4 py-3">{quote.currency} {Number(quote.total).toLocaleString()}</td>
                                <td className="px-4 py-3 capitalize">{quote.service_type || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('sales.quotations.show', quote.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!quotations.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No quotations yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={quotations.links} />
        </AppLayout>
    );
}
