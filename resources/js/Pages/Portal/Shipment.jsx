import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function PortalShipment({ shipment }) {
    const currentIndex = (shipment.lifecycle || []).indexOf(shipment.status);

    return (
        <AppLayout title={shipment.reference}>
            <Head title={shipment.reference} />
            <PageHeader
                title={shipment.reference}
                description={`${shipment.status_label} · Air waybill ${shipment.tracking_number || 'not issued'}`}
            />

            <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex min-w-max gap-2">
                    {(shipment.lifecycle || []).map((step, stepIndex) => {
                        const done = stepIndex <= currentIndex;
                        return (
                            <div
                                key={step}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${done ? 'bg-gf-green text-gf-ink' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}
                            >
                                {step.replaceAll('_', ' ')}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Job timeline</h3>
                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-slate-500">Job number</dt><dd>{shipment.reference}</dd></div>
                            <div><dt className="text-slate-500">Air waybill</dt><dd>{shipment.tracking_number || '—'}</dd></div>
                            <div><dt className="text-slate-500">Route</dt><dd>{shipment.origin_country || '—'} → {shipment.destination_country || '—'}</dd></div>
                            <div><dt className="text-slate-500">Location</dt><dd>{shipment.current_location || '—'}</dd></div>
                            <div><dt className="text-slate-500">Driver</dt><dd>{shipment.driver || 'Not assigned yet'}</dd></div>
                            <div><dt className="text-slate-500">Vehicle</dt><dd>{shipment.vehicle || 'Not assigned yet'}</dd></div>
                            {shipment.proof && (
                                <div className="sm:col-span-2">
                                    <dt className="text-slate-500">Proof of delivery</dt>
                                    <dd>Received by {shipment.proof.received_by} on {shipment.proof.received_at}</dd>
                                    {shipment.proof.has_photo && (
                                        <a href={route('operations.shipments.proof.download', shipment.id)} className="text-gf-forest hover:underline">Download photo</a>
                                    )}
                                </div>
                            )}
                        </dl>
                        <ul className="mt-4 space-y-3 text-sm">
                            {(shipment.history || []).map((item) => (
                                <li key={item.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                    <p className="font-medium capitalize">{(item.to_status || '').replaceAll('_', ' ')}</p>
                                    <p className="text-slate-500">{item.created_at_human}</p>
                                    {item.notes && <p className="mt-1">{item.notes}</p>}
                                </li>
                            ))}
                            {!shipment.history?.length && <li className="text-slate-500">No status updates yet.</li>}
                        </ul>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Documents</h3>
                    <ul className="mt-3 space-y-2">
                        {(shipment.documents || []).map((document) => (
                            <li key={document.id} className="flex items-center justify-between gap-3">
                                <span>
                                    <span className="font-medium">{document.type_label}</span>
                                    <span className="block text-xs text-slate-500">{document.original_name}</span>
                                </span>
                                <a
                                    href={route('operations.shipments.documents.download', [shipment.id, document.id])}
                                    className="text-gf-forest hover:underline"
                                >
                                    Download
                                </a>
                            </li>
                        ))}
                        {!shipment.documents?.length && <li className="text-slate-500">No documents shared yet.</li>}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}
