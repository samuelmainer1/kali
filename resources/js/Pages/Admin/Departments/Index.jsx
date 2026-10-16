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

function DepartmentForm({ department, onClose }) {
    const editing = Boolean(department);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: department?.name || '',
        code: department?.code || '',
        description: department?.description || '',
        is_active: department?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (editing) {
            put(route('admin.departments.update', department.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('admin.departments.store'), {
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
            </div>
            <div>
                <InputLabel value="Description" />
                <TextInput
                    className="mt-1 w-full"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                />
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

export default function DepartmentsIndex({ departments }) {
    const [mode, setMode] = useState(null);

    return (
        <AppLayout title="Departments">
            <Head title="Departments" />

            <PageHeader
                title="Departments"
                description="Organize staff into operational departments."
                actions={
                    <button
                        type="button"
                        onClick={() => setMode({ type: 'create' })}
                        className="rounded-xl bg-gf-green px-4 py-2.5 text-sm font-semibold text-gf-ink"
                    >
                        Add department
                    </button>
                }
            />

            {mode?.type === 'create' && <DepartmentForm onClose={() => setMode(null)} />}
            {mode?.type === 'edit' && (
                <DepartmentForm department={mode.department} onClose={() => setMode(null)} />
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {departments.map((department) => (
                            <tr key={department.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{department.name}</div>
                                    <div className="text-xs text-slate-500">{department.description}</div>
                                </td>
                                <td className="px-4 py-3">{department.code}</td>
                                <td className="px-4 py-3">{department.users_count}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge active={department.is_active} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {department.is_protected ? (
                                        <span className="text-xs text-slate-400">Protected</span>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="mr-2 text-gf-forest"
                                                onClick={() => setMode({ type: 'edit', department })}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="text-gf-red"
                                                onClick={() => {
                                                    if (confirm('Delete this department?')) {
                                                        router.delete(route('admin.departments.destroy', department.id));
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
