import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

const blankItem = { description: '', quantity: 1, unit: 'shipment', unit_price: 0, weight_kg: '' };

export default function QuotationForm({ quotation, customers, serviceTypes, rates = [], preselectedCustomerId }) {
    const editing = Boolean(quotation?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: quotation?.customer_id || preselectedCustomerId || '',
        contact_id: quotation?.contact_id || '',
        valid_until: quotation?.valid_until || '',
        currency: quotation?.currency || 'KES',
        origin_country: quotation?.origin_country || 'Kenya',
        destination_country: quotation?.destination_country || '',
        service_type: quotation?.service_type || 'air',
        notes: quotation?.notes || '',
        terms: quotation?.terms || '',
        items: quotation?.items?.length ? quotation.items : [{ ...blankItem }],
    });

    const selectedCustomer = useMemo(
        () => customers.find((c) => String(c.id) === String(data.customer_id)),
        [customers, data.customer_id],
    );

    useEffect(() => {
        if (!data.contact_id && selectedCustomer?.contacts?.length) {
            const primary = selectedCustomer.contacts.find((c) => c.is_primary) || selectedCustomer.contacts[0];
            if (primary) setData('contact_id', primary.id);
        }
    }, [selectedCustomer]);

    const updateItem = (index, field, value) => {
        const next = [...data.items];
        next[index] = { ...next[index], [field]: value };
        setData('items', next);
    };

    const subtotal = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('sales.quotations.update', quotation.id));
        else post(route('sales.quotations.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit quotation' : 'New quotation'}>
            <Head title={editing ? 'Edit quotation' : 'New quotation'} />
            <PageHeader
                title={editing ? 'Edit quotation' : 'New quotation'}
                description="Add line items and route details."
                actions={<Link href={route('sales.quotations.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
                    <div className="sm:col-span-2">
                        <InputLabel value="Customer" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.customer_id} onChange={(e) => setData('customer_id', e.target.value)}>
                            <option value="">Select customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.customer_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Contact" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.contact_id} onChange={(e) => setData('contact_id', e.target.value)}>
                            <option value="">Optional</option>
                            {(selectedCustomer?.contacts || []).map((contact) => (
                                <option key={contact.id} value={contact.id}>{contact.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Valid until" />
                        <TextInput type="date" className="mt-1 w-full" value={data.valid_until} onChange={(e) => setData('valid_until', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Origin country" />
                        <TextInput className="mt-1 w-full" value={data.origin_country} onChange={(e) => setData('origin_country', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Destination country" />
                        <TextInput className="mt-1 w-full" value={data.destination_country} onChange={(e) => setData('destination_country', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Service type" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.service_type} onChange={(e) => setData('service_type', e.target.value)}>
                            {serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={data.currency} onChange={(e) => setData('currency', e.target.value.toUpperCase())} />
                    </div>
                </section>

                {rates.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <InputLabel value="Apply a rate to the first line" />
                        <select
                            className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            defaultValue=""
                            onChange={(event) => {
                                const rate = rates.find((item) => String(item.id) === event.target.value);
                                if (!rate) return;
                                const next = [...data.items];
                                next[0] = { ...next[0], description: rate.description, unit_price: rate.price };
                                setData({ ...data, currency: rate.currency, items: next });
                            }}
                        >
                            <option value="">Choose a rate</option>
                            {rates.map((rate) => <option key={rate.id} value={rate.id}>{rate.label}</option>)}
                        </select>
                    </section>
                )}

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold">Line items</h3>
                        <button type="button" className="text-sm text-gf-forest" onClick={() => setData('items', [...data.items, { ...blankItem }])}>Add line</button>
                    </div>
                    {data.items.map((item, index) => (
                        <div key={index} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-5 dark:border-slate-800">
                            <TextInput className="md:col-span-2" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                            <TextInput type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                            <TextInput type="number" step="0.01" placeholder="Unit price" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                            <TextInput type="number" step="0.01" placeholder="Weight kg" value={item.weight_kg} onChange={(e) => updateItem(index, 'weight_kg', e.target.value)} />
                        </div>
                    ))}
                    <InputError message={errors.items} />
                    <p className="text-right text-sm font-semibold">Subtotal: {data.currency} {subtotal.toLocaleString()}</p>
                </section>

                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <InputLabel value="Notes" />
                        <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Terms" />
                        <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.terms} onChange={(e) => setData('terms', e.target.value)} />
                    </div>
                </section>

                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : editing ? 'Update quotation' : 'Create quotation'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
