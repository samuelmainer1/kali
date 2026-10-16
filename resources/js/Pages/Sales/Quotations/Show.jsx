import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function QuotationShow({ quotation }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [rejectOpen, setRejectOpen] = useState(false);
    const rejectForm = useForm({ rejection_reason: '' });

    const action = (url, method = 'post', data = {}) => {
        router[method](url, data);
    };

    return (
        <AppLayout title={quotation.reference}>
            <Head title={quotation.reference} />
            <PageHeader
                title={quotation.reference}
                description={`${quotation.customer?.name || 'Customer'} · ${quotation.status.replaceAll('_', ' ')}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {quotation.is_editable && permissions.includes('quotations.update') && (
                            <Link href={route('sales.quotations.edit', quotation.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {['draft', 'rejected'].includes(quotation.status) && permissions.includes('quotations.update') && (
                            <PrimaryButton onClick={() => action(route('sales.quotations.submit', quotation.id))}>
                                Submit for approval
                            </PrimaryButton>
                        )}
                        {quotation.status === 'pending_approval' && permissions.includes('quotations.approve') && (
                            <PrimaryButton onClick={() => action(route('sales.quotations.approve', quotation.id))}>
                                Approve
                            </PrimaryButton>
                        )}
                        {quotation.status === 'pending_approval' && permissions.includes('quotations.reject') && (
                            <button type="button" className="rounded-xl bg-gf-red px-4 py-2.5 text-sm font-semibold text-white" onClick={() => setRejectOpen(true)}>
                                Reject
                            </button>
                        )}
                        {quotation.status === 'approved' && permissions.includes('quotations.convert') && (
                            <PrimaryButton onClick={() => action(route('sales.quotations.convert', quotation.id))}>
                                Convert to shipment
                            </PrimaryButton>
                        )}
                        {['approved', 'converted'].includes(quotation.status) && permissions.includes('invoices.manage') && (
                            <PrimaryButton onClick={() => action(route('sales.quotations.invoice', quotation.id))}>
                                Create invoice
                            </PrimaryButton>
                        )}
                        {(permissions.includes('tasks.create') || permissions.includes('tasks.manage')) && (
                            <Link
                                href={route('tasks.create', {
                                    related_key: 'quotation',
                                    related_id: quotation.id,
                                    title: `Follow up on quotation ${quotation.reference}`,
                                })}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Create task
                            </Link>
                        )}
                    </div>
                }
            />

            {rejectOpen && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        rejectForm.post(route('sales.quotations.reject', quotation.id), {
                            onSuccess: () => setRejectOpen(false),
                        });
                    }}
                    className="mb-4 space-y-3 rounded-2xl border border-gf-red/30 bg-white p-4 dark:bg-slate-900"
                >
                    <p className="text-sm font-medium">Rejection reason</p>
                    <textarea
                        className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={3}
                        value={rejectForm.data.rejection_reason}
                        onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                    />
                    <div className="flex gap-2">
                        <PrimaryButton disabled={rejectForm.processing}>Confirm reject</PrimaryButton>
                        <button type="button" className="text-sm text-slate-500" onClick={() => setRejectOpen(false)}>Cancel</button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-display font-bold">Line items</h3>
                    <table className="mt-3 min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-slate-500">
                            <tr>
                                <th className="py-2">Description</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th className="text-right">Line total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {quotation.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-2">{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>{Number(item.unit_price).toLocaleString()}</td>
                                    <td className="text-right">{Number(item.line_total).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 space-y-1 text-right text-sm">
                        <p>Subtotal: {quotation.currency} {Number(quotation.subtotal).toLocaleString()}</p>
                        <p>Tax: {quotation.currency} {Number(quotation.tax_amount).toLocaleString()}</p>
                        <p className="text-base font-bold">Total: {quotation.currency} {Number(quotation.total).toLocaleString()}</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div><dt className="text-slate-500">Route</dt><dd>{quotation.origin_country || '—'} → {quotation.destination_country || '—'}</dd></div>
                            <div><dt className="text-slate-500">Service</dt><dd className="capitalize">{quotation.service_type || '—'}</dd></div>
                            <div><dt className="text-slate-500">Valid until</dt><dd>{quotation.valid_until || '—'}</dd></div>
                            <div><dt className="text-slate-500">Created by</dt><dd>{quotation.creator?.name || '—'}</dd></div>
                            {quotation.shipment && (
                                <div>
                                    <dt className="text-slate-500">Shipment</dt>
                                    <dd>
                                        <Link
                                            href={route('operations.shipments.show', quotation.shipment.id)}
                                            className="font-medium text-gf-forest hover:underline"
                                        >
                                            {quotation.shipment.reference}
                                        </Link>
                                        <span className="ml-1 capitalize text-slate-500">({quotation.shipment.status})</span>
                                    </dd>
                                </div>
                            )}
                            {quotation.rejection_reason && (
                                <div><dt className="text-slate-500">Rejection</dt><dd>{quotation.rejection_reason}</dd></div>
                            )}
                        </dl>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Notes</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{quotation.notes || '—'}</p>
                        <h3 className="mt-4 font-display font-bold">Terms</h3>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">{quotation.terms || '—'}</p>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
