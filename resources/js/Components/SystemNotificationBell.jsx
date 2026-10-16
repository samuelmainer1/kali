import { Link, router, usePage } from '@inertiajs/react';
import { BellRing } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SystemNotificationBell() {
    const { systemNotifications } = usePage().props;
    const enabled = Boolean(systemNotifications?.enabled);
    const unread = systemNotifications?.unread_count ?? 0;
    const items = systemNotifications?.items ?? [];
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    if (!enabled) {
        return null;
    }

    const openItem = (item) => {
        setOpen(false);
        router.post(route('notifications.read', item.id));
    };

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                aria-label="Notifications"
            >
                <BellRing className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gf-red px-1 text-[10px] font-bold leading-4 text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <p className="font-display text-sm font-bold">Notifications</p>
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.post(route('notifications.read-all'), {}, { onSuccess: () => setOpen(false) });
                                }}
                                className="text-xs font-semibold text-gf-forest hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {items.length ? (
                            items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openItem(item)}
                                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70 ${
                                        item.is_read ? 'opacity-70' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-gf-ink dark:text-white">{item.title}</p>
                                        {!item.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-gf-red" />}
                                    </div>
                                    {item.body && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.body}</p>}
                                    <p className="mt-1 text-[11px] text-slate-400">{item.created_at}</p>
                                </button>
                            ))
                        ) : (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                        )}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                        <Link
                            href={route('notifications.index')}
                            onClick={() => setOpen(false)}
                            className="text-sm font-semibold text-gf-forest hover:underline"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
