import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function PortalShipments({ shipments, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const apply = (event) => {
        event.preventDefault();
        router.get(route('portal.shipments.index'), {
            search: search || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Track shipments">
            <Head title="Track shipments" />
            <PageHeader
                title="Track shipments"
                description="Search by job number, airway bill, or customer name."
            />

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput
                    className="md:col-span-3"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Job number, airway bill, or customer name"
                />
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">
                    Search
                </button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Job number</th>
                            <th className="px-4 py-3">Air waybill</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {shipments.data.map((shipment) => (
                            <tr key={shipment.id}>
                                <td className="px-4 py-3 font-medium">{shipment.reference}</td>
                                <td className="px-4 py-3">{shipment.tracking_number || '—'}</td>
                                <td className="px-4 py-3">{shipment.origin_country || '—'} → {shipment.destination_country || '—'}</td>
                                <td className="px-4 py-3">{shipment.status_label}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('portal.shipments.show', shipment.id)} className="text-gf-forest hover:underline">
                                        Track
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {!shipments.data.length && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                    No shipments match this account.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={shipments.links} />
        </AppLayout>
    );
}
