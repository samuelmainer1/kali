import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function ShipmentsIndex({ shipments, filters, statuses, export_ready = false }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('operations.shipments.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Shipments">
            <Head title="Shipments" />
            <PageHeader
                title="Shipments"
                description="Track cargo from collection through delivery."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.post(route('operations.shipments.export'))}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                        >
                            Queue spreadsheet
                        </button>
                        {export_ready && (
                            <a
                                href={route('operations.shipments.export.download')}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Download spreadsheet
                            </a>
                        )}
                        {permissions.includes('shipments.create') && (
                            <HeaderLink href={route('operations.shipments.create')}>New shipment</HeaderLink>
                        )}
                    </div>
                }
            />

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput className="md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job number, airway bill, or customer name" />
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
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Pieces / Kg</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {shipments.data.map((shipment) => (
                            <tr key={shipment.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{shipment.reference}</div>
                                    <div className="text-xs text-slate-500">{shipment.tracking_number}</div>
                                </td>
                                <td className="px-4 py-3">{shipment.customer}</td>
                                <td className="px-4 py-3">{shipment.origin_country || '—'} → {shipment.destination_country || '—'}</td>
                                <td className="px-4 py-3 capitalize">{shipment.status_label}</td>
                                <td className="px-4 py-3">{shipment.pieces} / {shipment.weight_kg || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('operations.shipments.show', shipment.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!shipments.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No shipments yet. Convert an approved quotation or create one.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={shipments.links} />
        </AppLayout>
    );
}
