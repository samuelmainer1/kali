import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const emptyContact = { name: '', email: '', phone: '', job_title: '', is_primary: true };
const emptyAddress = { label: 'shipping', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'Kenya', is_default: true };

export default function CustomerForm({ customer, salespeople, statuses }) {
    const editing = Boolean(customer?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: customer?.name || '',
        trading_name: customer?.trading_name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        website: customer?.website || '',
        country: customer?.country || 'Kenya',
        tax_number: customer?.tax_number || '',
        status: customer?.status || 'lead',
        assigned_salesperson_id: customer?.assigned_salesperson_id || '',
        notes: customer?.notes || '',
        contacts: customer?.contacts?.length ? customer.contacts : [{ ...emptyContact }],
        addresses: customer?.addresses?.length ? customer.addresses : [{ ...emptyAddress }],
    });

    const updateList = (key, index, field, value) => {
        const next = [...data[key]];
        next[index] = { ...next[index], [field]: value };
        setData(key, next);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('crm.customers.update', customer.id));
        else post(route('crm.customers.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit customer' : 'Add customer'}>
            <Head title={editing ? 'Edit customer' : 'Add customer'} />
            <PageHeader
                title={editing ? 'Edit customer' : 'Add customer'}
                description="Company profile with contacts and addresses."
                actions={<Link href={route('crm.customers.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-4xl space-y-6">
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Company</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel value="Company name" />
                            <TextInput className="mt-1 w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="Trading name" />
                            <TextInput className="mt-1 w-full" value={data.trading_name} onChange={(e) => setData('trading_name', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value="Email" />
                            <TextInput className="mt-1 w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value="Phone" />
                            <TextInput className="mt-1 w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value="Country" />
                            <TextInput className="mt-1 w-full" value={data.country} onChange={(e) => setData('country', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value="Status" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Assigned salesperson" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.assigned_salesperson_id} onChange={(e) => setData('assigned_salesperson_id', e.target.value)}>
                                <option value="">Unassigned</option>
                                {salespeople.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Tax number" />
                            <TextInput className="mt-1 w-full" value={data.tax_number} onChange={(e) => setData('tax_number', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <InputLabel value="Notes" />
                        <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold">Contacts</h3>
                        <button type="button" className="text-sm text-gf-forest" onClick={() => setData('contacts', [...data.contacts, { ...emptyContact, is_primary: false }])}>Add contact</button>
                    </div>
                    {data.contacts.map((contact, index) => (
                        <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-2 dark:border-slate-800">
                            <TextInput placeholder="Name" value={contact.name} onChange={(e) => updateList('contacts', index, 'name', e.target.value)} />
                            <TextInput placeholder="Email" value={contact.email} onChange={(e) => updateList('contacts', index, 'email', e.target.value)} />
                            <TextInput placeholder="Phone" value={contact.phone} onChange={(e) => updateList('contacts', index, 'phone', e.target.value)} />
                            <TextInput placeholder="Job title" value={contact.job_title} onChange={(e) => updateList('contacts', index, 'job_title', e.target.value)} />
                            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                <Checkbox checked={contact.is_primary} onChange={(e) => updateList('contacts', index, 'is_primary', e.target.checked)} />
                                Primary contact
                            </label>
                        </div>
                    ))}
                </section>

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold">Addresses</h3>
                        <button type="button" className="text-sm text-gf-forest" onClick={() => setData('addresses', [...data.addresses, { ...emptyAddress, is_default: false }])}>Add address</button>
                    </div>
                    {data.addresses.map((address, index) => (
                        <div key={index} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-2 dark:border-slate-800">
                            <select className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={address.label} onChange={(e) => updateList('addresses', index, 'label', e.target.value)}>
                                <option value="billing">Billing</option>
                                <option value="shipping">Shipping</option>
                                <option value="other">Other</option>
                            </select>
                            <TextInput placeholder="Line 1" value={address.line1} onChange={(e) => updateList('addresses', index, 'line1', e.target.value)} />
                            <TextInput placeholder="City" value={address.city} onChange={(e) => updateList('addresses', index, 'city', e.target.value)} />
                            <TextInput placeholder="Country" value={address.country} onChange={(e) => updateList('addresses', index, 'country', e.target.value)} />
                        </div>
                    ))}
                </section>

                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : editing ? 'Update customer' : 'Create customer'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
