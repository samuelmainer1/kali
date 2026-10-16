import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function InvoicePrint({ invoice, company }) {
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Head title={`Print ${invoice.reference}`} />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-3">
                <p className="text-sm text-slate-600">Print preview — {invoice.reference}</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => window.print()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                        Print
                    </button>
                    <button type="button" onClick={() => window.history.back()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                        Back
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-8 py-10">
                <div className="mb-8 flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{company.company_name}</h1>
                        {company.trading_name && <p className="text-sm text-slate-600">{company.trading_name}</p>}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{company.address}</p>
                        <p className="text-sm text-slate-600">{company.phone}</p>
                        <p className="text-sm text-slate-600">{company.email}</p>
                        {company.website && <p className="text-sm text-slate-600">{company.website}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight">INVOICE</p>
                        <p className="mt-2 font-semibold">{invoice.reference}</p>
                        <p className="text-sm capitalize">Status: {invoice.status_label}</p>
                        <p className="text-sm">Issue date: {invoice.issue_date || '—'}</p>
                        <p className="text-sm">Due date: {invoice.due_date || '—'}</p>
                    </div>
                </div>

                <div className="mb-8 rounded border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
                    <p className="mt-1 text-lg font-semibold">{invoice.customer?.name}</p>
                    <p className="text-sm text-slate-600">{invoice.customer?.email}</p>
                    <p className="text-sm text-slate-600">{invoice.customer?.phone}</p>
                    {invoice.customer?.tax_number && <p className="text-sm text-slate-600">Tax: {invoice.customer.tax_number}</p>}
                    <p className="text-sm text-slate-600">{invoice.customer?.country}</p>
                </div>

                <table className="mb-6 w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-900 text-left">
                            <th className="py-2 pr-2">Description</th>
                            <th className="py-2 pr-2">Qty</th>
                            <th className="py-2 pr-2">Unit</th>
                            <th className="py-2 pr-2 text-right">Unit price</th>
                            <th className="py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item) => (
                            <tr key={item.id} className="border-b border-slate-200">
                                <td className="py-2 pr-2">{item.description}</td>
                                <td className="py-2 pr-2">{item.quantity}</td>
                                <td className="py-2 pr-2">{item.unit || '—'}</td>
                                <td className="py-2 pr-2 text-right">{Number(item.unit_price).toLocaleString()}</td>
                                <td className="py-2 text-right">{Number(item.line_total).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="ml-auto w-64 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{invoice.currency} {Number(invoice.subtotal).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{invoice.currency} {Number(invoice.tax_amount).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-slate-900 pt-2 text-base font-bold">
                        <span>Total</span>
                        <span>{invoice.currency} {Number(invoice.total).toLocaleString()}</span>
                    </div>
                </div>

                {(invoice.notes || invoice.terms) && (
                    <div className="mt-10 grid gap-4 text-sm sm:grid-cols-2">
                        {invoice.notes && (
                            <div>
                                <p className="font-semibold">Notes</p>
                                <p className="mt-1 whitespace-pre-wrap text-slate-600">{invoice.notes}</p>
                            </div>
                        )}
                        {invoice.terms && (
                            <div>
                                <p className="font-semibold">Terms</p>
                                <p className="mt-1 whitespace-pre-wrap text-slate-600">{invoice.terms}</p>
                            </div>
                        )}
                    </div>
                )}

                <p className="mt-12 text-center text-xs text-slate-400">
                    Generated by Globeflight ILMS · {company.company_name}
                </p>
            </div>
        </div>
    );
}
