import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { Activity, ArrowUpRight, FileSpreadsheet, FileText } from 'lucide-react';

function StatCard({ label, value, hint, index }) {
    const accents = ['bg-gf-yellow/20 text-amber-800', 'bg-gf-green/15 text-gf-forest', 'bg-gf-blue/15 text-sky-800', 'bg-gf-red/10 text-red-700'];
    const accent = accents[index % accents.length];

    return (
        <div
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight text-gf-ink dark:text-white">
                        {value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
                </div>
                <span className={`rounded-xl px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${accent}`}>
                    Live
                </span>
            </div>
        </div>
    );
}

export default function DashboardIndex({ role, stats, recentActivities, userSummary, showRoadmap }) {
    const roleLabel = userSummary?.role_label || role;
    const permissions = usePage().props.auth?.user?.permissions ?? [];
    const can = (permission) => permissions.includes(permission);
    const downloads = [
        { href: route('documents.company-profile'), label: 'Company profile PDF', icon: FileText },
        can('users.view')
            ? { href: route('documents.user-directory'), label: 'Staff directory Excel', icon: FileSpreadsheet }
            : null,
    ].filter(Boolean);

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-gf-ink via-slate-900 to-gf-forest p-6 text-white shadow-lg dark:border-slate-800 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                            Globeflight Portal
                        </p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Welcome back, {userSummary?.name?.split(' ')[0]}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm text-white/75">
                            Your {roleLabel} workspace is ready. Domain modules will populate these KPIs as they
                            come online.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
                        <p className="text-white/60">Assignment</p>
                        <p className="font-semibold capitalize">{roleLabel}</p>
                        <p className="text-white/70">
                            {[userSummary?.department, userSummary?.branch].filter(Boolean).join(' · ') || 'Globeflight Kenya'}
                        </p>
                    </div>
                </div>
            </section>

            {downloads.length > 0 && (
                <section className="mb-8 flex flex-wrap gap-3">
                    {downloads.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-gf-ink shadow-sm hover:border-gf-forest hover:text-gf-forest dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </a>
                    ))}
                </section>
            )}

            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} {...stat} index={index} />
                ))}
            </section>

            <section className={`grid gap-6 ${showRoadmap ? 'lg:grid-cols-5' : ''}`}>
                <div className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${showRoadmap ? 'lg:col-span-3' : ''}`}>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gf-forest" />
                            <h3 className="font-display text-lg font-bold">Recent activity</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentActivities?.length ? (
                            recentActivities.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                            {item.description}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.user || 'System'} · {item.action}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">{item.created_at}</span>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-sm text-slate-500">
                                No activity yet. Sign-ins and module actions will appear here.
                            </p>
                        )}
                    </div>
                </div>

                {showRoadmap && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-display text-lg font-bold">Module roadmap</h3>
                    <p className="mt-1 text-sm text-slate-500">Next builds after Module 1 approval</p>
                    <ul className="mt-4 space-y-3">
                        {[
                            'Administration — users, roles, branches',
                            'CRM — companies & contacts',
                            'Quotations lifecycle',
                            'Shipments & tracking',
                        ].map((item) => (
                            <li
                                key={item}
                                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/70"
                            >
                                <span>{item}</span>
                                <ArrowUpRight className="h-4 w-4 text-gf-blue" />
                            </li>
                        ))}
                    </ul>
                </div>
                )}
            </section>
        </AppLayout>
    );
}
