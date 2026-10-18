import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const blankItem = { description: '', quantity: 1, unit: 'shipment', unit_price: 0 };

export default function InvoiceForm({ invoice, customers }) {
    const editing = Boolean(invoice?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: invoice?.customer_id || '',
        currency: invoice?.currency || 'KES',
        issue_date: invoice?.issue_date || new Date().toISOString().slice(0, 10),
        due_date: invoice?.due_date || '',
        notes: invoice?.notes || '',
        terms: invoice?.terms || '',
        items: invoice?.items?.length ? invoice.items : [{ ...blankItem }],
    });

    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('finance.invoices.update', invoice.id));
        else post(route('finance.invoices.store'));
    };

    const subtotal = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);

    return (
        <AppLayout title={editing ? 'Edit invoice' : 'New invoice'}>
            <Head title={editing ? 'Edit invoice' : 'New invoice'} />
            <PageHeader
                title={editing ? 'Edit invoice' : 'New invoice'}
                description="Add billable line items for the customer."
                actions={<Link href={route('finance.invoices.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel value="Customer" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.customer_id} onChange={(e) => setData('customer_id', e.target.value)}>
                            <option value="">Select customer</option>
                            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <InputError message={errors.customer_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={data.currency} onChange={(e) => setData('currency', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Issue date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Due date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <InputLabel value="Line items" />
                        <button type="button" className="text-sm font-semibold text-gf-forest" onClick={() => setData('items', [...data.items, { ...blankItem }])}>
                            Add line
                        </button>
                    </div>
                    <div className="space-y-3">
                        {data.items.map((item, index) => (
                            <div key={index} className="grid gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-12">
                                <TextInput className="sm:col-span-5" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                                <TextInput type="number" className="sm:col-span-2" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                                <TextInput className="sm:col-span-2" placeholder="Unit" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                                <TextInput type="number" step="0.01" className="sm:col-span-2" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                                <button type="button" className="text-sm text-gf-red sm:col-span-1" onClick={() => setData('items', data.items.filter((_, i) => i !== index))} disabled={data.items.length === 1}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <InputError message={errors.items} className="mt-1" />
                    <p className="mt-2 text-right text-sm font-semibold">Subtotal: {data.currency} {subtotal.toLocaleString()}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Notes" />
                        <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Terms" />
                        <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.terms} onChange={(e) => setData('terms', e.target.value)} />
                    </div>
                </div>

                <PrimaryButton disabled={processing}>{editing ? 'Update invoice' : 'Create invoice'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
