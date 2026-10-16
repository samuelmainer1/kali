import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    todo: 'bg-slate-200 text-slate-700',
    in_progress: 'bg-gf-blue/15 text-sky-800',
    done: 'bg-gf-green/15 text-gf-forest',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function TasksIndex({ tasks, filters, canManage, statuses, priorities, assignees, stats }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [priority, setPriority] = useState(filters.priority || '');
    const [assignedTo, setAssignedTo] = useState(filters.assigned_to || '');
    const [scope, setScope] = useState(filters.scope || (canManage ? 'all' : 'mine'));

    const apply = (e) => {
        e.preventDefault();
        router.get(route('tasks.index'), {
            search: search || undefined,
            status: status || undefined,
            priority: priority || undefined,
            assigned_to: assignedTo || undefined,
            scope: scope || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Tasks">
            <Head title="Tasks" />
            <PageHeader
                title="Tasks"
                description="Assign work, track due dates, and keep ownership clear."
                actions={
                    permissions.includes('tasks.create') || permissions.includes('tasks.manage') ? (
                        <HeaderLink href={route('tasks.create')}>New task</HeaderLink>
                    ) : null
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">My open</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.my_open}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Due today</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.due_today}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Overdue</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.overdue}</p>
                </div>
                {canManage && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">All open</p>
                        <p className="mt-2 font-display text-2xl font-bold">{stats.all_open}</p>
                    </div>
                )}
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks" className="md:col-span-2" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All priorities</option>
                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {canManage ? (
                    <select value={scope} onChange={(e) => setScope(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                        <option value="all">All tasks</option>
                        <option value="mine">Mine</option>
                    </select>
                ) : (
                    <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
                )}
                {canManage && (
                    <>
                        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 md:col-span-2">
                            <option value="">All assignees</option>
                            {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest md:col-span-3">Filter</button>
                    </>
                )}
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Task</th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3">Due</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tasks.data.map((task) => (
                            <tr key={task.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{task.reference}</div>
                                    <div className="text-slate-600 dark:text-slate-300">{task.title}</div>
                                </td>
                                <td className="px-4 py-3">{task.assignee_name}</td>
                                <td className={`px-4 py-3 ${task.is_overdue ? 'font-semibold text-gf-red' : ''}`}>
                                    {task.due_date || '—'}
                                </td>
                                <td className="px-4 py-3 capitalize">{task.priority}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusClass[task.status] || 'bg-slate-100'}`}>
                                        {task.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('tasks.show', task.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!tasks.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No tasks yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={tasks.links} />
        </AppLayout>
    );
}
