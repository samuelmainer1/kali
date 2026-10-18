import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function RoleForm({ permissionGroups, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        permissions: [],
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
        post(route('admin.roles.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mb-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
            <div>
                <InputLabel htmlFor="role-name" value="Role name" />
                <TextInput
                    id="role-name"
                    className="mt-1 w-full sm:max-w-sm"
                    value={data.name}
                    placeholder="Driver"
                    onChange={(event) => setData('name', event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">This name appears in the Role list when you add a user.</p>
                <InputError message={errors.name} className="mt-1" />
            </div>

            <div>
                <InputLabel value="Permissions" />
                <p className="mt-1 text-xs text-slate-500">Tick the access this role should have.</p>
                <div className="mt-3 max-h-96 space-y-4 overflow-y-auto pr-1">
                    {permissionGroups.map((group) => (
                        <div key={group.group}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.group}</p>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.permissions)}
                                    className="text-xs font-semibold uppercase tracking-wide text-gf-forest"
                                >
                                    Toggle group
                                </button>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>
                <InputError message={errors.permissions} className="mt-1" />
            </div>

            <div className="flex gap-2">
                <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Create role'}</PrimaryButton>
                <button type="button" onClick={onClose} className="text-sm text-slate-500">
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function RolesIndex({ roles, permissionGroups }) {
    const { auth } = usePage().props;
    const canManage = (auth.user?.permissions ?? []).includes('roles.manage');
    const [creating, setCreating] = useState(false);

    const remove = (role) => {
        if (confirm(`Delete the ${role.label} role?`)) {
            router.delete(route('admin.roles.destroy', role.id));
        }
    };

    return (
        <AppLayout title="Roles">
            <Head title="Roles" />

            <PageHeader
                title="Roles & permissions"
                description="Add a role and choose the permissions people with that role receive."
                actions={
                    canManage && (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="rounded-xl bg-gf-green px-4 py-2.5 text-sm font-semibold text-gf-ink"
                        >
                            Add role
                        </button>
                    )
                }
            />

            {creating && (
                <RoleForm permissionGroups={permissionGroups} onClose={() => setCreating(false)} />
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-display text-lg font-bold capitalize text-gf-ink dark:text-white">
                                    {role.label}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">{role.name}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                                {role.is_system ? 'Built-in' : 'Custom'}
                            </span>
                        </div>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Permissions</p>
                                <p className="font-semibold">{role.permissions_count}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">Users</p>
                                <p className="font-semibold">{role.users_count}</p>
                            </div>
                        </div>
                        {canManage && role.can_manage && (
                            <div className="mt-4 flex items-center gap-4">
                                <Link
                                    href={route('admin.roles.edit', role.id)}
                                    className="inline-flex text-sm font-semibold text-gf-forest hover:underline"
                                >
                                    Manage permissions
                                </Link>
                                {!role.is_system && (
                                    <button type="button" onClick={() => remove(role)} className="text-sm font-semibold text-gf-red">
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                        {canManage && !role.can_manage && (
                            <p className="mt-4 text-xs text-slate-400">Only administrators can manage this role.</p>
                        )}
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
