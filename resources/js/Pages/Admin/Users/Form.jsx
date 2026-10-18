import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function UserForm({ user, roles, departments, branches }) {
    const editing = Boolean(user);

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        employee_code: user?.employee_code || '',
        password: '',
        password_confirmation: '',
        role: user?.role || roles[0] || '',
        department_id: user?.department_id || '',
        branch_id: user?.branch_id || '',
        is_active: user?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (editing) {
            put(route('admin.users.update', user.id));
        } else {
            post(route('admin.users.store'));
        }
    };

    return (
        <AppLayout title={editing ? 'Edit user' : 'Add user'}>
            <Head title={editing ? 'Edit user' : 'Add user'} />

            <PageHeader
                title={editing ? 'Edit user' : 'Add user'}
                description="Assign a role, department, and branch for access control."
                actions={
                    <Link href={route('admin.users.index')} className="text-sm font-medium text-gf-forest">
                        Back to users
                    </Link>
                }
            />

            <form
                onSubmit={submit}
                className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Full name" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone" value="Phone" />
                        <TextInput
                            id="phone"
                            className="mt-1 block w-full"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        <InputError message={errors.phone} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="employee_code" value="Employee code" />
                        <TextInput
                            id="employee_code"
                            className="mt-1 block w-full"
                            value={data.employee_code}
                            onChange={(e) => setData('employee_code', e.target.value)}
                        />
                        <InputError message={errors.employee_code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="password" value={editing ? 'New password (optional)' : 'Password'} />
                        <TextInput
                            id="password"
                            type="password"
                            className="mt-1 block w-full"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirm password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            className="mt-1 block w-full"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="role" value="Role" />
                        <select
                            id="role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.role} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="department_id" value="Department" />
                        <select
                            id="department_id"
                            value={data.department_id}
                            onChange={(e) => setData('department_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                        >
                            <option value="">None</option>
                            {departments.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.department_id} className="mt-1" />
                        <p className="mt-1 text-xs text-slate-500">They also receive the privileges set on this department.</p>
                    </div>
                    <div>
                        <InputLabel htmlFor="branch_id" value="Branch" />
                        <select
                            id="branch_id"
                            value={data.branch_id}
                            onChange={(e) => setData('branch_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                        >
                            <option value="">None</option>
                            {branches.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.branch_id} className="mt-1" />
                    </div>
                </div>

                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Account is active</span>
                </label>

                <PrimaryButton disabled={processing}>
                    {processing ? 'Saving…' : editing ? 'Update user' : 'Create user'}
                </PrimaryButton>
            </form>
        </AppLayout>
    );
}
