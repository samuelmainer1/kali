import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ItShow({ requestItem, canManage, statuses, handlers }) {
    const form = useForm({
        status: requestItem.status,
        assigned_to: '',
        resolution: requestItem.resolution || '',
    });

    const save = (event) => {
        event.preventDefault();
        form.put(route('it.requests.update', requestItem.id));
    };

    return (
        <AppLayout title={requestItem.reference}>
            <Head title={requestItem.reference} />
            <PageHeader
                title={requestItem.reference}
                description={`${requestItem.title} · ${requestItem.department}`}
                actions={<Link href={route('it.requests.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-display font-bold">Request</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{requestItem.description}</p>
                    {requestItem.resolution && (
                        <div className="mt-6">
                            <h3 className="font-display font-bold">Resolution</h3>
                            <p className="mt-3 whitespace-pre-wrap text-sm">{requestItem.resolution}</p>
                        </div>
                    )}
                </section>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div><dt className="text-slate-500">Department</dt><dd>{requestItem.department}</dd></div>
                            <div><dt className="text-slate-500">From</dt><dd>{requestItem.requester?.name}</dd></div>
                            <div><dt className="text-slate-500">Category</dt><dd className="capitalize">{requestItem.category}</dd></div>
                            <div><dt className="text-slate-500">Priority</dt><dd className="capitalize">{requestItem.priority}</dd></div>
                            <div><dt className="text-slate-500">Status</dt><dd className="capitalize">{requestItem.status_label}</dd></div>
                            <div><dt className="text-slate-500">Handler</dt><dd>{requestItem.assignee?.name || 'IT & Marketing'}</dd></div>
                        </dl>
                    </div>

                    {canManage && (
                        <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="font-display font-bold">Update</h3>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={form.data.status} onChange={(event) => form.setData('status', event.target.value)}>
                                {statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                            </select>
                            <select className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={form.data.assigned_to} onChange={(event) => form.setData('assigned_to', event.target.value)}>
                                <option value="">Keep current handler</option>
                                {handlers.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                            </select>
                            <textarea className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} placeholder="Resolution notes" value={form.data.resolution} onChange={(event) => form.setData('resolution', event.target.value)} />
                            <PrimaryButton disabled={form.processing}>Save</PrimaryButton>
                        </form>
                    )}
                </aside>
            </div>
        </AppLayout>
    );
}
