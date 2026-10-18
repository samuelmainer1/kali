import AnnouncementBell from '@/Components/AnnouncementBell';
import BrandMark from '@/Components/BrandMark';
import SystemNotificationBell from '@/Components/SystemNotificationBell';
import ThemeToggle from '@/Components/ThemeToggle';
import ToastStack from '@/Components/ToastStack';
import { navigationForUser } from '@/Config/navigation';
import { roleLabel } from '@/Config/roleLabels';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';

export default function AppLayout({ title, children }) {
    const { auth, app, announcementBell, chat } = usePage().props;
    const user = auth.user;
    const permissions = user?.permissions ?? [];
    const nav = navigationForUser(permissions, user?.role, {
        canViewAnnouncements: Boolean(announcementBell?.enabled),
        chatUnread: chat?.unread_count || 0,
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-gf-ink dark:bg-slate-950 dark:text-slate-100">
            <ToastStack />

            {sidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <Link href={route('dashboard')} className="flex min-w-0 items-center rounded-lg bg-white px-1 py-0.5 dark:bg-white">
                        <BrandMark className="h-12 w-auto max-w-[11.5rem]" showWordmark />
                    </Link>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {nav.map((item) => {
                        const Icon = item.icon;
                        const active = !item.soon && item.routeName && route().current(item.routeName);

                        return (
                            <Link
                                key={item.label}
                                href={item.soon ? '#' : item.url}
                                onClick={(event) => {
                                    if (item.soon) {
                                        event.preventDefault();
                                    }
                                    setSidebarOpen(false);
                                }}
                                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                    active
                                        ? 'bg-gf-green text-gf-ink shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-gf-ink text-white' : 'bg-gf-red text-white'}`}>
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                                {item.soon && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        Soon
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <div className="rounded-xl bg-gf-green p-3 text-gf-ink">
                        <p className="font-alice whitespace-nowrap text-[11px] uppercase tracking-wide text-gf-ink/70">
                            INTEGRATED LOGISTIC PORTAL
                        </p>
                        <p className="mt-1 text-sm font-semibold">{app?.name}</p>
                        <p className="text-xs text-gf-ink/70">{app?.tagline}</p>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {user?.role_label || roleLabel(user?.role) || 'User'} workspace
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <SystemNotificationBell />
                        <AnnouncementBell />
                        <ThemeToggle />
                        <Link
                            href={route('profile.edit')}
                            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 sm:inline-flex"
                        >
                            <UserRound className="h-4 w-4 text-gf-forest" />
                            <span className="max-w-[140px] truncate font-medium">{user?.name}</span>
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-2 rounded-xl bg-gf-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-gf-forest"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Link>
                    </div>
                </header>

                <main className="animate-fade-in px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
