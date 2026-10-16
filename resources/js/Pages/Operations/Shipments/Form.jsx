import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ShipmentForm({ shipment, customers, branches, serviceTypes }) {
    const editing = Boolean(shipment?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: shipment?.customer_id || '',
        branch_id: shipment?.branch_id || '',
        origin_country: shipment?.origin_country || 'Kenya',
        destination_country: shipment?.destination_country || '',
        current_location: shipment?.current_location || '',
        service_type: shipment?.service_type || 'air',
        pieces: shipment?.pieces || 1,
        weight_kg: shipment?.weight_kg || '',
        tracking_number: shipment?.tracking_number || '',
        expected_departure: shipment?.expected_departure || '',
        expected_arrival: shipment?.expected_arrival || '',
        notes: shipment?.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('operations.shipments.update', shipment.id));
        else post(route('operations.shipments.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit shipment' : 'New shipment'}>
            <Head title={editing ? 'Edit shipment' : 'New shipment'} />
            <PageHeader
                title={editing ? 'Edit shipment' : 'New shipment'}
                description="Capture route, cargo, and branch details."
                actions={<Link href={route('operations.shipments.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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
                        <InputLabel value="Branch" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.branch_id} onChange={(e) => setData('branch_id', e.target.value)}>
                            <option value="">Optional</option>
                            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Service type" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.service_type} onChange={(e) => setData('service_type', e.target.value)}>
                            {serviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Origin" />
                        <TextInput className="mt-1 w-full" value={data.origin_country} onChange={(e) => setData('origin_country', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Destination" />
                        <TextInput className="mt-1 w-full" value={data.destination_country} onChange={(e) => setData('destination_country', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Pieces" />
                        <TextInput type="number" className="mt-1 w-full" value={data.pieces} onChange={(e) => setData('pieces', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Weight (kg)" />
                        <TextInput type="number" step="0.01" className="mt-1 w-full" value={data.weight_kg} onChange={(e) => setData('weight_kg', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Current location" />
                        <TextInput className="mt-1 w-full" value={data.current_location} onChange={(e) => setData('current_location', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Tracking number" />
                        <TextInput className="mt-1 w-full" value={data.tracking_number} onChange={(e) => setData('tracking_number', e.target.value)} />
                    </div>
                </div>
                <div>
                    <InputLabel value="Notes" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : editing ? 'Update shipment' : 'Create shipment'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
