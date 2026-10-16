import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function ShipmentShow({ shipment }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState(shipment.current_location || '');
    const documentForm = useForm({
        type: 'air_waybill',
        file: null,
    });

    const uploadDocument = (event) => {
        event.preventDefault();
        documentForm.post(route('operations.shipments.documents.store', shipment.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const advance = () => {
        router.post(route('operations.shipments.advance', shipment.id), {
            notes: notes || undefined,
            current_location: location || undefined,
        });
    };

    return (
        <AppLayout title={shipment.reference}>
            <Head title={shipment.reference} />
            <PageHeader
                title={shipment.reference}
                description={`${shipment.customer?.name || 'Customer'} · ${shipment.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {permissions.includes('shipments.update') && (
                            <Link href={route('operations.shipments.edit', shipment.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit details
                            </Link>
                        )}
                        {(permissions.includes('tasks.create') || permissions.includes('tasks.manage')) && (
                            <Link
                                href={route('tasks.create', {
                                    related_key: 'shipment',
                                    related_id: shipment.id,
                                    title: `Follow up on shipment ${shipment.reference}`,
                                })}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Create task
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex min-w-max gap-2">
                    {shipment.lifecycle.map((step) => {
                        const currentIndex = shipment.lifecycle.indexOf(shipment.status);
                        const stepIndex = shipment.lifecycle.indexOf(step);
                        const done = stepIndex <= currentIndex;
                        return (
                            <div key={step} className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${done ? 'bg-gf-green text-gf-ink' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                {step.replaceAll('_', ' ')}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Shipment details</h3>
                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-slate-500">Air waybill</dt><dd>{shipment.tracking_number || '—'}</dd></div>
                            <div><dt className="text-slate-500">Service</dt><dd className="capitalize">{shipment.service_type || '—'}</dd></div>
                            <div><dt className="text-slate-500">Route</dt><dd>{shipment.origin_country || '—'} → {shipment.destination_country || '—'}</dd></div>
                            <div><dt className="text-slate-500">Location</dt><dd>{shipment.current_location || '—'}</dd></div>
                            <div><dt className="text-slate-500">Pieces / Weight</dt><dd>{shipment.pieces} / {shipment.weight_kg || '—'} kg</dd></div>
                            <div><dt className="text-slate-500">Branch</dt><dd>{shipment.branch?.name || '—'}</dd></div>
                            {shipment.quotation && (
                                <div>
                                    <dt className="text-slate-500">Quotation</dt>
                                    <dd>
                                        <Link href={route('sales.quotations.show', shipment.quotation.id)} className="text-gf-forest hover:underline">
                                            {shipment.quotation.reference}
                                        </Link>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Status history</h3>
                        <ul className="mt-3 space-y-3 text-sm">
                            {shipment.history.map((item) => (
                                <li key={item.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                    <p className="font-medium capitalize">
                                        {(item.from_status || 'start').replaceAll('_', ' ')} → {item.to_status.replaceAll('_', ' ')}
                                    </p>
                                    <p className="text-slate-500">{item.changed_by || 'System'} · {item.created_at_human}</p>
                                    {item.notes && <p className="mt-1">{item.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="space-y-4">
                    {shipment.next_status && permissions.includes('shipments.update') && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="font-display font-bold">Advance status</h3>
                            <p className="mt-1 text-sm text-slate-500">Next: <span className="font-semibold capitalize text-gf-forest">{shipment.next_status_label}</span></p>
                            <TextInput className="mt-3 w-full" placeholder="Current location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
                            <textarea className="mt-2 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            <PrimaryButton className="mt-3" onClick={advance} type="button">
                                Move to {shipment.next_status_label}
                            </PrimaryButton>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Documents</h3>
                        <p className="mt-1 text-slate-500">Air waybills, packing lists, and proof-of-delivery photos stay on the private disk.</p>
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
                            {!shipment.documents?.length && <li className="text-slate-500">No documents stored yet.</li>}
                        </ul>
                        {permissions.includes('shipments.update') && (
                            <form onSubmit={uploadDocument} className="mt-4 space-y-2">
                                <select
                                    value={documentForm.data.type}
                                    onChange={(event) => documentForm.setData('type', event.target.value)}
                                    className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {Object.entries(shipment.document_types || {}).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <input
                                    type="file"
                                    onChange={(event) => documentForm.setData('file', event.target.files?.[0] ?? null)}
                                    className="block w-full text-sm"
                                />
                                {documentForm.errors.file && <p className="text-xs text-gf-red">{documentForm.errors.file}</p>}
                                {documentForm.errors.type && <p className="text-xs text-gf-red">{documentForm.errors.type}</p>}
                                <PrimaryButton disabled={documentForm.processing}>Store document</PrimaryButton>
                            </form>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Warehouse link</h3>
                        <ul className="mt-3 space-y-2">
                            {shipment.inventory_items.map((item) => (
                                <li key={item.id}>{item.sku} · {item.quantity_on_hand} {item.unit} · {item.status}</li>
                            ))}
                            {!shipment.inventory_items.length && <li className="text-slate-500">No inventory lot yet (created when status reaches warehouse).</li>}
                        </ul>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
