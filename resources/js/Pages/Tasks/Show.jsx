import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function TaskShow({ task, statuses, priorities, assignees, departments }) {
    const commentForm = useForm({ body: '' });
    const editForm = useForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
        assigned_to: task.assignee?.id || '',
        department_id: task.department?.id || '',
        related_key: task.related?.key || '',
        related_id: task.related?.id || '',
    });

    return (
        <AppLayout title={task.reference}>
            <Head title={task.reference} />
            <PageHeader
                title={task.reference}
                description={task.title}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('tasks.index')} className="text-sm text-gf-forest">Back</Link>
                        {task.can_edit && (
                            <Link href={route('tasks.edit', task.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {task.can_edit && task.status !== 'done' && (
                            <PrimaryButton type="button" onClick={() => router.post(route('tasks.status', task.id), { status: 'done' })}>
                                Mark done
                            </PrimaryButton>
                        )}
                        {task.can_edit && task.status === 'todo' && (
                            <button
                                type="button"
                                onClick={() => router.post(route('tasks.status', task.id), { status: 'in_progress' })}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Start
                            </button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Description</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {task.description || '—'}
                        </p>
                        {task.related && (
                            <p className="mt-4 text-sm">
                                Linked {task.related.key?.replaceAll('_', ' ')}:{' '}
                                {task.related.url ? (
                                    <Link href={task.related.url} className="font-semibold text-gf-forest hover:underline">
                                        {task.related.label}
                                    </Link>
                                ) : task.related.label}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Comments</h3>
                        <ul className="mt-3 space-y-3">
                            {task.comments.map((comment) => (
                                <li key={comment.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                                    <p className="font-medium">{comment.author}</p>
                                    <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
                                    <p className="mt-1 text-xs text-slate-400">{comment.created_at}</p>
                                </li>
                            ))}
                            {!task.comments.length && <li className="py-4 text-center text-sm text-slate-500">No comments yet.</li>}
                        </ul>

                        {task.status !== 'cancelled' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    commentForm.post(route('tasks.comment', task.id), {
                                        onSuccess: () => commentForm.reset('body'),
                                    });
                                }}
                                className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"
                            >
                                <textarea
                                    className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                    rows={3}
                                    placeholder="Add a comment… Use @Name to mention a colleague"
                                    value={commentForm.data.body}
                                    onChange={(e) => commentForm.setData('body', e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Tip: mention someone with @ followed by their name (e.g. @Sales Officer).</p>
                                <PrimaryButton disabled={commentForm.processing}>Post comment</PrimaryButton>
                            </form>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div><dt className="text-slate-500">Status</dt><dd className="capitalize">{task.status_label}</dd></div>
                            <div><dt className="text-slate-500">Priority</dt><dd className="capitalize">{task.priority}</dd></div>
                            <div><dt className="text-slate-500">Due</dt><dd className={task.is_overdue ? 'font-semibold text-gf-red' : ''}>{task.due_date || '—'}</dd></div>
                            <div><dt className="text-slate-500">Assignee</dt><dd>{task.assignee?.name}</dd></div>
                            <div><dt className="text-slate-500">Created by</dt><dd>{task.creator?.name}</dd></div>
                            <div><dt className="text-slate-500">Department</dt><dd>{task.department?.name || '—'}</dd></div>
                            {task.completed_at && <div><dt className="text-slate-500">Completed</dt><dd>{task.completed_at}</dd></div>}
                        </dl>
                    </div>

                    {task.can_edit && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                editForm.put(route('tasks.update', task.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Quick update</h3>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)}>
                                {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={editForm.data.priority} onChange={(e) => editForm.setData('priority', e.target.value)}>
                                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={editForm.data.assigned_to} onChange={(e) => editForm.setData('assigned_to', e.target.value)}>
                                {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={editForm.data.department_id} onChange={(e) => editForm.setData('department_id', e.target.value)}>
                                <option value="">No department</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <PrimaryButton disabled={editForm.processing}>Save</PrimaryButton>
                        </form>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
