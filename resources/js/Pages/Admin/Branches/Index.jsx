import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function BranchForm({ branch, onClose }) {
    const editing = Boolean(branch);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: branch?.name || '',
        code: branch?.code || '',
        city: branch?.city || '',
        country: branch?.country || 'Kenya',
        phone: branch?.phone || '',
        email: branch?.email || '',
        address: branch?.address || '',
        is_active: branch?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (editing) {
            put(route('admin.branches.update', branch.id), { onSuccess: () => onClose() });
        } else {
            post(route('admin.branches.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <form
            onSubmit={submit}
            className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <InputLabel value="Name" />
                    <TextInput className="mt-1 w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Code" />
                    <TextInput className="mt-1 w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                    <InputError message={errors.code} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="City" />
                    <TextInput className="mt-1 w-full" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                </div>
                <div>
                    <InputLabel value="Country" />
                    <TextInput className="mt-1 w-full" value={data.country} onChange={(e) => setData('country', e.target.value)} />
                </div>
                <div>
                    <InputLabel value="Phone" />
                    <TextInput className="mt-1 w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </div>
                <div>
                    <InputLabel value="Email" />
                    <TextInput className="mt-1 w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    <InputError message={errors.email} className="mt-1" />
                </div>
            </div>
            <div>
                <InputLabel value="Address" />
                <TextInput className="mt-1 w-full" value={data.address} onChange={(e) => setData('address', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                Active
            </label>
            <div className="flex gap-2">
                <PrimaryButton disabled={processing}>{editing ? 'Update' : 'Create'}</PrimaryButton>
                <button type="button" onClick={onClose} className="text-sm text-slate-500">
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function BranchesIndex({ branches }) {
    const [mode, setMode] = useState(null);

    return (
        <AppLayout title="Branches">
            <Head title="Branches" />

            <PageHeader
                title="Branches"
                description="Manage Globeflight physical locations."
                actions={
                    <button
                        type="button"
                        onClick={() => setMode({ type: 'create' })}
                        className="rounded-xl bg-gf-green px-4 py-2.5 text-sm font-semibold text-gf-ink"
                    >
                        Add branch
                    </button>
                }
            />

            {mode?.type === 'create' && <BranchForm onClose={() => setMode(null)} />}
            {mode?.type === 'edit' && <BranchForm branch={mode.branch} onClose={() => setMode(null)} />}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Branch</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {branches.map((branch) => (
                            <tr key={branch.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{branch.name}</div>
                                    <div className="text-xs text-slate-500">{branch.email || branch.phone}</div>
                                </td>
                                <td className="px-4 py-3">{branch.code}</td>
                                <td className="px-4 py-3">
                                    {[branch.city, branch.country].filter(Boolean).join(', ') || '—'}
                                </td>
                                <td className="px-4 py-3">{branch.users_count}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge active={branch.is_active} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        className="mr-2 text-gf-forest"
                                        onClick={() => setMode({ type: 'edit', branch })}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="text-gf-red"
                                        onClick={() => {
                                            if (confirm('Delete this branch?')) {
                                                router.delete(route('admin.branches.destroy', branch.id));
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
