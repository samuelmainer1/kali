import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function ProcurementShow({ purchaseRequest }) {
    const rejectForm = useForm({ rejection_reason: '' });
    const processForm = useForm({ finance_notes: '' });

    return (
        <AppLayout title={purchaseRequest.reference}>
            <Head title={purchaseRequest.title} />
            <PageHeader
                title={purchaseRequest.title}
                description={`${purchaseRequest.reference} · ${purchaseRequest.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('procurement.index')} className="text-sm text-gf-forest">Back</Link>
                        {purchaseRequest.can_edit && (
                            <Link href={route('procurement.edit', purchaseRequest.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {purchaseRequest.can_approve && (
                            <PrimaryButton type="button" onClick={() => router.post(route('procurement.approve', purchaseRequest.id))}>
                                Approve
                            </PrimaryButton>
                        )}
                        {purchaseRequest.can_cancel && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Cancel this purchase request?')) {
                                        router.post(route('procurement.cancel', purchaseRequest.id));
                                    }
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Justification</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {purchaseRequest.justification || '—'}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Qty</th>
                                    <th className="px-4 py-3">Unit cost</th>
                                    <th className="px-4 py-3 text-right">Line total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {purchaseRequest.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">{item.description}</td>
                                        <td className="px-4 py-3">{Number(item.quantity)}</td>
                                        <td className="px-4 py-3">{Number(item.unit_cost).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{Number(item.line_total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="border-t border-slate-100 px-4 py-3 text-right text-sm font-semibold dark:border-slate-800">
                            Total: {Number(purchaseRequest.total_amount).toLocaleString()} {purchaseRequest.currency}
                        </div>
                    </div>

                    {purchaseRequest.can_approve && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                rejectForm.post(route('procurement.reject', purchaseRequest.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Reject request</h3>
                            <input
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                placeholder="Rejection reason"
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                            />
                            <button type="submit" className="rounded-xl bg-gf-red px-4 py-2 text-sm font-semibold text-white" disabled={rejectForm.processing}>
                                Reject
                            </button>
                        </form>
                    )}

                    {purchaseRequest.can_process && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                processForm.post(route('procurement.process', purchaseRequest.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Finance processing</h3>
                            <textarea
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                rows={3}
                                placeholder="Optional finance notes (payment ref, supplier, etc.)"
                                value={processForm.data.finance_notes}
                                onChange={(e) => processForm.setData('finance_notes', e.target.value)}
                            />
                            <PrimaryButton disabled={processForm.processing}>Mark as processed</PrimaryButton>
                        </form>
                    )}
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Details</h3>
                    <dl className="mt-3 space-y-2">
                        <div><dt className="text-slate-500">Status</dt><dd>{purchaseRequest.status_label}</dd></div>
                        <div><dt className="text-slate-500">Requester</dt><dd>{purchaseRequest.requester?.name}</dd></div>
                        <div><dt className="text-slate-500">Department</dt><dd>{purchaseRequest.department?.name || '—'}</dd></div>
                        <div><dt className="text-slate-500">Approver</dt><dd>{purchaseRequest.approver?.name || '—'}</dd></div>
                        <div><dt className="text-slate-500">Processed by</dt><dd>{purchaseRequest.processor?.name || '—'}</dd></div>
                        {purchaseRequest.rejection_reason && (
                            <div><dt className="text-slate-500">Rejection reason</dt><dd>{purchaseRequest.rejection_reason}</dd></div>
                        )}
                        {purchaseRequest.finance_notes && (
                            <div><dt className="text-slate-500">Finance notes</dt><dd className="whitespace-pre-wrap">{purchaseRequest.finance_notes}</dd></div>
                        )}
                    </dl>
                </aside>
            </div>
        </AppLayout>
    );
}
