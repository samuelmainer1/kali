import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AnnouncementForm({ announcement, departments, types }) {
    const editing = Boolean(announcement?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        title: announcement?.title || '',
        body: announcement?.body || '',
        type: announcement?.type || 'company',
        department_id: announcement?.department_id || '',
        is_urgent: announcement?.is_urgent ?? false,
        is_published: announcement?.is_published ?? true,
        published_at: toLocalInput(announcement?.published_at),
        expires_at: toLocalInput(announcement?.expires_at),
    });

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('announcements.update', announcement.id));
        else post(route('announcements.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit announcement' : 'New announcement'}>
            <Head title={editing ? 'Edit announcement' : 'New announcement'} />
            <PageHeader
                title={editing ? 'Edit announcement' : 'New announcement'}
                description="Choose type and audience — all employees, or one department."
                actions={<Link href={route('announcements.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Title" />
                    <TextInput className="mt-1 w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Body" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={8}
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                    />
                    <InputError message={errors.body} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Type" />
                        <select
                            className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                        >
                            {types.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <InputError message={errors.type} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Audience" />
                        <select
                            className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            value={data.department_id}
                            onChange={(e) => setData('department_id', e.target.value)}
                        >
                            <option value="">All employees</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                            Leave as All employees for company-wide notices. Pick a department to limit visibility.
                        </p>
                        <InputError message={errors.department_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Publish at" />
                        <TextInput
                            type="datetime-local"
                            className="mt-1 w-full"
                            value={data.published_at}
                            onChange={(e) => setData('published_at', e.target.value)}
                        />
                        <InputError message={errors.published_at} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Expires at" />
                        <TextInput
                            type="datetime-local"
                            className="mt-1 w-full"
                            value={data.expires_at}
                            onChange={(e) => setData('expires_at', e.target.value)}
                        />
                        <InputError message={errors.expires_at} className="mt-1" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_urgent}
                            onChange={(e) => setData('is_urgent', e.target.checked)}
                        />
                        Mark as urgent
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_published}
                            onChange={(e) => setData('is_published', e.target.checked)}
                        />
                        Published
                    </label>
                </div>
                <PrimaryButton disabled={processing}>
                    {editing ? 'Update announcement' : 'Create announcement'}
                </PrimaryButton>
            </form>
        </AppLayout>
    );
}
