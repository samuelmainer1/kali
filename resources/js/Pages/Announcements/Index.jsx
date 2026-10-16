import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const typeClass = {
    company: 'bg-gf-blue/15 text-sky-800',
    department: 'bg-gf-green/15 text-gf-forest',
    emergency: 'bg-gf-red/15 text-red-700',
    policy: 'bg-amber-100 text-amber-900',
};

export default function AnnouncementsIndex({ announcements, filters, canManage }) {
    const [search, setSearch] = useState(filters.q || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('announcements.index'), {
            q: search || undefined,
            type: type || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Announcements">
            <Head title="Announcements" />
            <PageHeader
                title="Announcements"
                description="Company notices, department updates, and urgent alerts."
                actions={
                    canManage ? (
                        <HeaderLink href={route('announcements.create')}>New announcement</HeaderLink>
                    ) : null
                }
            />

            <form
                onSubmit={apply}
                className={`mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${canManage ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
            >
                <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements"
                    className={canManage ? 'md:col-span-2' : 'md:col-span-2'}
                />
                {canManage && (
                    <>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <option value="">All types</option>
                            {['company', 'department', 'emergency', 'policy'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="expired">Expired</option>
                            <option value="draft">Draft</option>
                        </select>
                    </>
                )}
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">
                    Filter
                </button>
            </form>

            <div className="space-y-3">
                {announcements.data.map((item) => (
                    <Link
                        key={item.id}
                        href={route('announcements.show', item.id)}
                        className={`block rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                            item.is_urgent
                                ? 'border-gf-red/40 dark:border-red-900'
                                : 'border-slate-200 dark:border-slate-800'
                        }`}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${typeClass[item.type] || 'bg-slate-100'}`}>
                                        {item.type}
                                    </span>
                                    {item.is_urgent && (
                                        <span className="rounded-lg bg-gf-red/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                                            Urgent
                                        </span>
                                    )}
                                    {!item.is_read && (
                                        <span className="rounded-lg bg-gf-yellow/30 px-2 py-1 text-xs font-semibold text-amber-900">
                                            Unread
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-2 font-display text-lg font-bold text-gf-ink dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {item.reference}
                                    {' · '}
                                    {item.audience_label || (item.department ? item.department.name : 'All employees')}
                                    {item.creator ? ` · ${item.creator.name}` : ''}
                                </p>
                            </div>
                            <span className="text-xs text-slate-400">
                                {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Draft'}
                            </span>
                        </div>
                    </Link>
                ))}
                {!announcements.data.length && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                        No announcements yet.
                    </div>
                )}
            </div>
            <Pagination links={announcements.links} />
        </AppLayout>
    );
}
