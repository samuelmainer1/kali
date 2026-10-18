import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function VehiclesIndex({ vehicles, types }) {
    const canManage = (usePage().props.auth.user?.permissions ?? []).includes('vehicles.manage');
    const form = useForm({ registration: '', name: '', type: types[0] || 'van' });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('operations.vehicles.store'), { preserveScroll: true, onSuccess: () => form.reset('registration', 'name') });
    };

    return (
        <AppLayout title="Vehicles">
            <Head title="Vehicles" />
            <PageHeader title="Vehicles" description="Vans and trucks that can be assigned to a shipment." />

            {canManage && (
                <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <InputLabel value="Registration" />
                        <TextInput className="mt-1 w-full" value={form.data.registration} onChange={(event) => form.setData('registration', event.target.value)} placeholder="KAA 123A" />
                    </div>
                    <div>
                        <InputLabel value="Name" />
                        <TextInput className="mt-1 w-full" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Nairobi van 1" />
                    </div>
                    <div>
                        <InputLabel value="Type" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={form.data.type} onChange={(event) => form.setData('type', event.target.value)}>
                            {types.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton disabled={form.processing}>Add vehicle</PrimaryButton>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Registration</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {vehicles.map((vehicle) => (
                            <VehicleRow key={vehicle.id} vehicle={vehicle} types={types} canManage={canManage} />
                        ))}
                        {!vehicles.length && (
                            <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No vehicles yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

function VehicleRow({ vehicle, types, canManage }) {
    const form = useForm({
        registration: vehicle.registration,
        name: vehicle.name,
        type: vehicle.type,
        is_active: vehicle.is_active,
    });

    if (!canManage) {
        return (
            <tr>
                <td className="px-4 py-3 font-medium">{vehicle.registration}</td>
                <td className="px-4 py-3">{vehicle.name}</td>
                <td className="px-4 py-3 capitalize">{vehicle.type}</td>
                <td className="px-4 py-3">{vehicle.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
        );
    }

    return (
        <tr>
            <td className="px-4 py-3"><TextInput className="w-full" value={form.data.registration} onChange={(event) => form.setData('registration', event.target.value)} /></td>
            <td className="px-4 py-3"><TextInput className="w-full" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} /></td>
            <td className="px-4 py-3">
                <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={form.data.type} onChange={(event) => form.setData('type', event.target.value)}>
                    {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
            </td>
            <td className="px-4 py-3">
                <form onSubmit={(event) => { event.preventDefault(); form.put(route('operations.vehicles.update', vehicle.id), { preserveScroll: true }); }} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                        Active
                    </label>
                    <button type="submit" className="text-sm font-semibold text-gf-forest">Save</button>
                </form>
            </td>
        </tr>
    );
}
