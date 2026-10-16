import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function emptyItem() {
    return { description: '', quantity: 1, unit_cost: '' };
}

export default function ProcurementForm({ purchaseRequest, departments, defaultDepartmentId }) {
    const editing = Boolean(purchaseRequest?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        title: purchaseRequest?.title || '',
        justification: purchaseRequest?.justification || '',
        department_id: purchaseRequest?.department_id || defaultDepartmentId || '',
        currency: purchaseRequest?.currency || 'KES',
        items: purchaseRequest?.items?.length
            ? purchaseRequest.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
            }))
            : [emptyItem()],
    });

    const updateItem = (index, key, value) => {
        const items = data.items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
        setData('items', items);
    };

    const addItem = () => setData('items', [...data.items, emptyItem()]);
    const removeItem = (index) => {
        if (data.items.length === 1) return;
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const total = data.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        return sum + qty * cost;
    }, 0);

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('procurement.update', purchaseRequest.id));
        else post(route('procurement.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit request' : 'New purchase request'}>
            <Head title={editing ? 'Edit request' : 'New purchase request'} />
            <PageHeader
                title={editing ? 'Edit purchase request' : 'New purchase request'}
                description="Any employee can submit. Manager approval is required before finance processes."
                actions={<Link href={route('procurement.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Title" />
                    <TextInput className="mt-1 w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Marketing tripod purchase" />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Department" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}>
                            <option value="">Select department</option>
                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={data.currency} onChange={(e) => setData('currency', e.target.value)} />
                    </div>
                </div>
                <div>
                    <InputLabel value="Justification" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.justification} onChange={(e) => setData('justification', e.target.value)} placeholder="Why is this needed?" />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold">Items</h3>
                        <button type="button" onClick={addItem} className="text-sm font-semibold text-gf-forest">Add item</button>
                    </div>
                    <InputError message={errors.items} className="mt-1" />
                    {data.items.map((item, index) => (
                        <div key={index} className="grid gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-12">
                            <div className="sm:col-span-6">
                                <InputLabel value="Description" />
                                <TextInput className="mt-1 w-full" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Tripod" />
                                <InputError message={errors[`items.${index}.description`]} className="mt-1" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel value="Qty" />
                                <TextInput type="number" min="0.01" step="0.01" className="mt-1 w-full" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                            </div>
                            <div className="sm:col-span-3">
                                <InputLabel value="Unit cost" />
                                <TextInput type="number" min="0" step="0.01" className="mt-1 w-full" value={item.unit_cost} onChange={(e) => updateItem(index, 'unit_cost', e.target.value)} />
                            </div>
                            <div className="flex items-end sm:col-span-1">
                                <button type="button" onClick={() => removeItem(index)} className="mb-1 text-sm text-gf-red">Remove</button>
                            </div>
                        </div>
                    ))}
                    <p className="text-right text-sm font-semibold">
                        Total: {total.toLocaleString()} {data.currency}
                    </p>
                </div>

                <PrimaryButton disabled={processing}>{editing ? 'Update request' : 'Submit request'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
