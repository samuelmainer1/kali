import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';

export default function NotificationsIndex({ notifications }) {
    return (
        <AppLayout title="Notifications">
            <Head title="Notifications" />
            <PageHeader
                title="Notifications"
                description="Approvals, shipment updates, and overdue invoices."
                actions={
                    <PrimaryButton type="button" onClick={() => router.post(route('notifications.read-all'))}>
                        Mark all read
                    </PrimaryButton>
                }
            />

            <div className="space-y-3">
                {notifications.data.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => router.post(route('notifications.read', item.id))}
                        className={`block w-full rounded-2xl border p-4 text-left transition hover:shadow-md ${
                            item.is_read
                                ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                : 'border-gf-blue/30 bg-sky-50/60 dark:border-sky-900 dark:bg-slate-900'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-display text-base font-bold text-gf-ink dark:text-white">{item.title}</p>
                                {item.body && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>}
                                <p className="mt-2 text-xs text-slate-400">{item.created_at}</p>
                            </div>
                            {!item.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gf-red" />}
                        </div>
                    </button>
                ))}
                {!notifications.data.length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                        No notifications yet.
                    </div>
                )}
            </div>
            <Pagination links={notifications.links} />
        </AppLayout>
    );
}
