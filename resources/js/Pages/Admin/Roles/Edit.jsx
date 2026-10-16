import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function RoleEdit({ role, permissionGroups }) {
    const { data, setData, put, processing } = useForm({
        permissions: role.permissions || [],
    });

    const toggle = (name) => {
        setData(
            'permissions',
            data.permissions.includes(name)
                ? data.permissions.filter((item) => item !== name)
                : [...data.permissions, name],
        );
    };

    const toggleGroup = (groupPermissions) => {
        const names = groupPermissions.map((item) => item.name);
        const allSelected = names.every((name) => data.permissions.includes(name));
        if (allSelected) {
            setData(
                'permissions',
                data.permissions.filter((name) => !names.includes(name)),
            );
        } else {
            setData('permissions', Array.from(new Set([...data.permissions, ...names])));
        }
    };

    const submit = (event) => {
        event.preventDefault();
        put(route('admin.roles.update', role.id));
    };

    return (
        <AppLayout title="Edit role">
            <Head title={`Role · ${role.label}`} />

            <PageHeader
                title={`Role: ${role.label}`}
                description="Select the module permissions for this role."
                actions={
                    <Link href={route('admin.roles.index')} className="text-sm font-medium text-gf-forest">
                        Back to roles
                    </Link>
                }
            />

            <form onSubmit={submit} className="space-y-4">
                {permissionGroups.map((group) => (
                    <div
                        key={group.group}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display text-base font-bold capitalize">{group.group}</h3>
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.permissions)}
                                className="text-xs font-semibold uppercase tracking-wide text-gf-forest"
                            >
                                Toggle group
                            </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {group.permissions.map((permission) => (
                                <label
                                    key={permission.id}
                                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.permissions.includes(permission.name)}
                                        onChange={() => toggle(permission.name)}
                                        className="rounded border-slate-300 text-gf-forest focus:ring-gf-forest"
                                    />
                                    <span>{permission.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <PrimaryButton disabled={processing}>
                    {processing ? 'Saving…' : 'Save permissions'}
                </PrimaryButton>
            </form>
        </AppLayout>
    );
}
