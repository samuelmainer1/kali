import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function RatesIndex({ rates, serviceTypes, canManage }) {
    const form = useForm({
        name: '',
        origin: 'Kenya',
        destination: '',
        service_type: serviceTypes[0] || 'air',
        min_weight_kg: 0,
        max_weight_kg: '',
        price: '',
        currency: 'KES',
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('sales.rates.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'destination', 'price', 'max_weight_kg'),
        });
    };

    return (
        <AppLayout title="Rate card">
            <Head title="Rate card" />
            <PageHeader title="Rate card" description="Standard prices by route. Sales can apply a rate when writing a quotation." />

            {canManage && (
                <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <InputLabel value="Name" />
                        <TextInput className="mt-1 w-full" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Nairobi to Mombasa air" />
                    </div>
                    <div>
                        <InputLabel value="Origin" />
                        <TextInput className="mt-1 w-full" value={form.data.origin} onChange={(event) => form.setData('origin', event.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Destination" />
                        <TextInput className="mt-1 w-full" value={form.data.destination} onChange={(event) => form.setData('destination', event.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Service" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={form.data.service_type} onChange={(event) => form.setData('service_type', event.target.value)}>
                            {serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Price" />
                        <TextInput type="number" step="0.01" className="mt-1 w-full" value={form.data.price} onChange={(event) => form.setData('price', event.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={form.data.currency} onChange={(event) => form.setData('currency', event.target.value.toUpperCase())} />
                    </div>
                    <div className="md:col-span-3">
                        <PrimaryButton disabled={form.processing}>Add rate</PrimaryButton>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Rate</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Service</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rates.map((rate) => (
                            <tr key={rate.id}>
                                <td className="px-4 py-3 font-medium">{rate.name}</td>
                                <td className="px-4 py-3">{rate.origin} → {rate.destination}</td>
                                <td className="px-4 py-3 capitalize">{rate.service_type}</td>
                                <td className="px-4 py-3">{rate.currency} {Number(rate.price).toLocaleString()}</td>
                                <td className="px-4 py-3">{rate.is_active ? 'Active' : 'Inactive'}</td>
                            </tr>
                        ))}
                        {!rates.length && (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No rates yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
