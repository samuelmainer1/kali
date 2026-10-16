import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function AnnouncementBell() {
    const { announcementBell } = usePage().props;
    const enabled = Boolean(announcementBell?.enabled);
    const unread = announcementBell?.unread_count ?? 0;
    const items = announcementBell?.items ?? [];
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

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                aria-label="Announcements"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gf-red px-1 text-[10px] font-bold leading-4 text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <p className="font-display text-sm font-bold">Announcements</p>
                        {unread > 0 && (
                            <span className="rounded-lg bg-gf-red/10 px-2 py-0.5 text-xs font-semibold text-red-700">
                                {unread} unread
                            </span>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {items.length ? (
                            items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route('announcements.show', item.id)}
                                    onClick={() => setOpen(false)}
                                    className="block border-b border-slate-50 px-4 py-3 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {item.type}
                                        </span>
                                        {item.is_urgent && (
                                            <span className="text-[10px] font-bold uppercase text-gf-red">Urgent</span>
                                        )}
                                    </div>
                                    <p className="mt-1 font-medium text-gf-ink dark:text-white">{item.title}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">{item.published_at}</p>
                                </Link>
                            ))
                        ) : (
                            <p className="px-4 py-8 text-center text-sm text-slate-500">No unread announcements.</p>
                        )}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
                        <Link
                            href={route('announcements.index')}
                            onClick={() => setOpen(false)}
                            className="text-sm font-semibold text-gf-forest hover:underline"
                        >
                            View all announcements
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
