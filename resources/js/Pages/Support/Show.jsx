import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function SupportShow({ ticket, canManage, statuses, priorities, agents }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const replyForm = useForm({ body: '', is_internal: false });
    const manageForm = useForm({
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assignee?.id || '',
    });

    return (
        <AppLayout title={ticket.reference}>
            <Head title={ticket.reference} />
            <PageHeader
                title={ticket.reference}
                description={ticket.subject}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('support.index')} className="text-sm text-gf-forest">Back to tickets</Link>
                        {(permissions.includes('tasks.create') || permissions.includes('tasks.manage')) && (
                            <Link
                                href={route('tasks.create', {
                                    related_key: 'support_ticket',
                                    related_id: ticket.id,
                                    title: `Follow up on ticket ${ticket.reference}`,
                                })}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Create task
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Description</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{ticket.description}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Conversation</h3>
                        <ul className="mt-3 space-y-3">
                            {ticket.replies.map((reply) => (
                                <li
                                    key={reply.id}
                                    className={`rounded-xl p-3 text-sm ${reply.is_internal ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-50 dark:bg-slate-800/60'}`}
                                >
                                    <p className="font-medium">
                                        {reply.author || 'User'}
                                        {reply.is_internal && <span className="ml-2 text-xs text-amber-700">Internal</span>}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap">{reply.body}</p>
                                    <p className="mt-1 text-xs text-slate-400">{reply.created_at}</p>
                                </li>
                            ))}
                            {!ticket.replies.length && <li className="py-4 text-center text-sm text-slate-500">No replies yet.</li>}
                        </ul>

                        {ticket.status !== 'closed' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    replyForm.post(route('support.reply', ticket.id), {
                                        onSuccess: () => replyForm.reset('body'),
                                    });
                                }}
                                className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800"
                            >
                                <textarea
                                    className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                    rows={3}
                                    placeholder="Write a reply…"
                                    value={replyForm.data.body}
                                    onChange={(e) => replyForm.setData('body', e.target.value)}
                                />
                                {canManage && (
                                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={replyForm.data.is_internal}
                                            onChange={(e) => replyForm.setData('is_internal', e.target.checked)}
                                        />
                                        Internal note (hidden from customer)
                                    </label>
                                )}
                                <PrimaryButton disabled={replyForm.processing}>Post reply</PrimaryButton>
                            </form>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div><dt className="text-slate-500">Status</dt><dd className="capitalize">{ticket.status_label}</dd></div>
                            <div><dt className="text-slate-500">Priority</dt><dd className="capitalize">{ticket.priority}</dd></div>
                            <div><dt className="text-slate-500">Category</dt><dd className="capitalize">{ticket.category}</dd></div>
                            <div><dt className="text-slate-500">Requester</dt><dd>{ticket.requester?.name}</dd></div>
                            <div><dt className="text-slate-500">Assignee</dt><dd>{ticket.assignee?.name || 'Unassigned'}</dd></div>
                            <div><dt className="text-slate-500">Customer</dt><dd>{ticket.customer?.name || '—'}</dd></div>
                            {ticket.shipment && (
                                <div>
                                    <dt className="text-slate-500">Shipment</dt>
                                    <dd>
                                        <Link href={route('operations.shipments.show', ticket.shipment.id)} className="text-gf-forest hover:underline">
                                            {ticket.shipment.reference}
                                        </Link>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {canManage && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                manageForm.put(route('support.update', ticket.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Manage ticket</h3>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={manageForm.data.status} onChange={(e) => manageForm.setData('status', e.target.value)}>
                                {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={manageForm.data.priority} onChange={(e) => manageForm.setData('priority', e.target.value)}>
                                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={manageForm.data.assigned_to} onChange={(e) => manageForm.setData('assigned_to', e.target.value)}>
                                <option value="">Unassigned</option>
                                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <PrimaryButton disabled={manageForm.processing}>Save changes</PrimaryButton>
                        </form>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
