import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function AnnouncementShow({ announcement, canManage }) {
    return (
        <AppLayout title={announcement.reference}>
            <Head title={announcement.title} />
            <PageHeader
                title={announcement.title}
                description={`${announcement.reference} · ${announcement.type} · ${announcement.audience_label || (announcement.department?.name || 'All employees')}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('announcements.index')} className="text-sm text-gf-forest">Back</Link>
                        {canManage && (
                            <Link
                                href={route('announcements.edit', announcement.id)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Edit
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    {announcement.is_urgent && (
                        <p className="mb-4 rounded-xl bg-gf-red/10 px-3 py-2 text-sm font-semibold text-red-700">
                            Urgent notice
                        </p>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        {announcement.body}
                    </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Details</h3>
                    <dl className="mt-3 space-y-2">
                        <div>
                            <dt className="text-slate-500">Type</dt>
                            <dd className="capitalize">{announcement.type}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Audience</dt>
                            <dd>{announcement.audience_label || announcement.department?.name || 'All employees'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Created by</dt>
                            <dd>{announcement.creator?.name || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Published</dt>
                            <dd>{announcement.published_at ? new Date(announcement.published_at).toLocaleString() : 'Draft'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Expires</dt>
                            <dd>{announcement.expires_at ? new Date(announcement.expires_at).toLocaleString() : '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Status</dt>
                            <dd>{announcement.is_published ? 'Published' : 'Draft'}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </AppLayout>
    );
}
