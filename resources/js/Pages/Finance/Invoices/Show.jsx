import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function InvoiceShow({ invoice, company, pdf_ready = false }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const canManage = permissions.includes('invoices.manage');

    const mark = (status) => router.post(route('finance.invoices.status', invoice.id), { status });

    return (
        <AppLayout title={invoice.reference}>
            <Head title={invoice.reference} />
            <PageHeader
                title={invoice.reference}
                description={`${invoice.customer?.name || 'Customer'} · ${invoice.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => router.post(route('finance.invoices.pdf', invoice.id))}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                        >
                            Queue PDF
                        </button>
                        {pdf_ready && (
                            <a
                                href={route('finance.invoices.pdf.download', invoice.id)}
                                className="rounded-xl bg-gf-green px-4 py-2.5 text-sm font-semibold text-gf-ink"
                            >
                                Download PDF
                            </a>
                        )}
                        <Link
                            href={route('finance.invoices.print', invoice.id)}
                            className="rounded-xl bg-gf-ink px-4 py-2.5 text-sm font-semibold text-white dark:bg-gf-forest"
                        >
                            Print invoice
                        </Link>
                        {invoice.is_editable && canManage && (
                            <Link href={route('finance.invoices.edit', invoice.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {canManage && invoice.status === 'draft' && (
                            <PrimaryButton type="button" onClick={() => mark('sent')}>Mark sent</PrimaryButton>
                        )}
                        {canManage && ['sent', 'overdue'].includes(invoice.status) && (
                            <PrimaryButton type="button" onClick={() => mark('paid')}>Mark paid</PrimaryButton>
                        )}
                        {canManage && invoice.status === 'sent' && (
                            <button type="button" onClick={() => mark('overdue')} className="rounded-xl border border-gf-red px-4 py-2.5 text-sm font-semibold text-gf-red">
                                Mark overdue
                            </button>
                        )}
                        {canManage && !['paid', 'cancelled'].includes(invoice.status) && (
                            <button type="button" onClick={() => mark('cancelled')} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                Cancel
                            </button>
                        )}
                        {(permissions.includes('tasks.create') || permissions.includes('tasks.manage')) && (
                            <Link
                                href={route('tasks.create', {
                                    related_key: 'invoice',
                                    related_id: invoice.id,
                                    title: `Follow up on invoice ${invoice.reference}`,
                                })}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Create task
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <p className="font-display text-xl font-bold">{company.company_name}</p>
                                <p className="text-sm text-slate-500">{company.address || company.trading_name}</p>
                                <p className="text-sm text-slate-500">{company.phone} · {company.email}</p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="font-semibold capitalize">{invoice.status_label}</p>
                                <p>Issue: {invoice.issue_date || '—'}</p>
                                <p>Due: {invoice.due_date || '—'}</p>
                            </div>
                        </div>

                        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                            <p className="font-semibold">Bill to</p>
                            <p>{invoice.customer?.name}</p>
                            <p className="text-slate-500">{invoice.customer?.email} · {invoice.customer?.phone}</p>
                        </div>

                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2">Description</th>
                                    <th className="py-2">Qty</th>
                                    <th className="py-2">Unit price</th>
                                    <th className="py-2 text-right">Line total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2">{item.description}</td>
                                        <td className="py-2">{item.quantity} {item.unit || ''}</td>
                                        <td className="py-2">{Number(item.unit_price).toLocaleString()}</td>
                                        <td className="py-2 text-right">{Number(item.line_total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-4 space-y-1 text-right text-sm">
                            <p>Subtotal: {invoice.currency} {Number(invoice.subtotal).toLocaleString()}</p>
                            <p>Tax: {invoice.currency} {Number(invoice.tax_amount).toLocaleString()}</p>
                            <p className="text-base font-bold">Total: {invoice.currency} {Number(invoice.total).toLocaleString()}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Details</h3>
                    <dl className="mt-3 space-y-2">
                        {invoice.quotation && (
                            <div>
                                <dt className="text-slate-500">Quotation</dt>
                                <dd>
                                    <Link href={route('sales.quotations.show', invoice.quotation.id)} className="text-gf-forest hover:underline">
                                        {invoice.quotation.reference}
                                    </Link>
                                </dd>
                            </div>
                        )}
                        {invoice.shipment && (
                            <div>
                                <dt className="text-slate-500">Shipment</dt>
                                <dd>
                                    <Link href={route('operations.shipments.show', invoice.shipment.id)} className="text-gf-forest hover:underline">
                                        {invoice.shipment.reference}
                                    </Link>
                                </dd>
                            </div>
                        )}
                        <div><dt className="text-slate-500">Created by</dt><dd>{invoice.creator || '—'}</dd></div>
                        <div><dt className="text-slate-500">Notes</dt><dd className="whitespace-pre-wrap">{invoice.notes || '—'}</dd></div>
                        <div><dt className="text-slate-500">Terms</dt><dd className="whitespace-pre-wrap">{invoice.terms || '—'}</dd></div>
                    </dl>
                </section>
            </div>
        </AppLayout>
    );
}
