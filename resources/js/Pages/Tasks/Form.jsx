import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function TaskForm({ task, options, prefill }) {
    const editing = Boolean(task?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        title: task?.title || prefill?.title || '',
        description: task?.description || '',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        due_date: task?.due_date || '',
        assigned_to: task?.assigned_to || options.default_assignee || '',
        department_id: task?.department_id || '',
        related_key: task?.related_key || prefill?.related_key || '',
        related_id: task?.related_id || prefill?.related_id || '',
    });

    const relatedList = data.related_key ? (options.related_options[data.related_key] || []) : [];

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('tasks.update', task.id));
        else post(route('tasks.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit task' : 'New task'}>
            <Head title={editing ? 'Edit task' : 'New task'} />
            <PageHeader
                title={editing ? 'Edit task' : 'New task'}
                description="Assign ownership, due date, and optional linked record."
                actions={<Link href={route('tasks.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Title" />
                    <TextInput className="mt-1 w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Description" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Assign to" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
                            <option value="">Select employee</option>
                            {options.assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <InputError message={errors.assigned_to} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Department" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}>
                            <option value="">Optional</option>
                            {options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Priority" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                            {options.priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Due date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                    </div>
                    {editing && (
                        <div>
                            <InputLabel value="Status" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                                {options.statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <InputLabel value="Linked record type" />
                        <select
                            className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            value={data.related_key}
                            onChange={(e) => setData({ ...data, related_key: e.target.value, related_id: '' })}
                        >
                            <option value="">None</option>
                            {options.related_types.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
                        </select>
                    </div>
                    {data.related_key && (
                        <div>
                            <InputLabel value="Linked record" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.related_id} onChange={(e) => setData('related_id', e.target.value)}>
                                <option value="">Select</option>
                                {relatedList.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.reference}{item.subject ? ` — ${item.subject}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <PrimaryButton disabled={processing}>{editing ? 'Update task' : 'Create task'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
