import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const openStages = ['new_lead', 'contacted', 'quotation', 'negotiation'];

export default function PipelineIndex({
    opportunities,
    board,
    filters,
    stages,
    stageLabels,
    canViewAll,
    canManage,
    owners,
    performance,
    stats,
}) {
    const [search, setSearch] = useState(filters.q || '');
    const [stage, setStage] = useState(filters.stage || '');
    const [ownerId, setOwnerId] = useState(filters.owner_id || '');
    const [overdue, setOverdue] = useState(Boolean(filters.overdue));

    const apply = (e) => {
        e.preventDefault();
        router.get(route('pipeline.index'), {
            q: search || undefined,
            stage: stage || undefined,
            owner_id: ownerId || undefined,
            overdue: overdue || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Pipeline">
            <Head title="Sales Pipeline" />
            <PageHeader
                title="Sales Pipeline"
                description="Track deals from new lead through won or lost."
                actions={
                    canManage ? (
                        <HeaderLink href={route('pipeline.create')}>New opportunity</HeaderLink>
                    ) : null
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Open deals</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.open}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Overdue follow-ups</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.overdue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Won value</p>
                    <p className="mt-2 font-display text-2xl font-bold">{Number(stats.won_value).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lost</p>
                    <p className="mt-2 font-display text-2xl font-bold">{stats.lost}</p>
                </div>
            </div>

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
                <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search opportunities" className="md:col-span-2" />
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All stages</option>
                    {stages.map((s) => <option key={s} value={s}>{stageLabels[s]}</option>)}
                </select>
                {canViewAll ? (
                    <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                        <option value="">All owners</option>
                        {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                ) : (
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />
                        Overdue only
                    </label>
                )}
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <section className="mb-8 overflow-x-auto">
                <div className="flex min-w-[900px] gap-3">
                    {openStages.map((s) => (
                        <div key={s} className="w-64 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{stageLabels[s]}</p>
                            <div className="space-y-2">
                                {(board[s] || []).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={route('pipeline.show', item.id)}
                                        className="block rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <p className="font-semibold text-gf-ink dark:text-white">{item.title}</p>
                                        <p className="mt-1 text-xs text-slate-500">{item.customer}</p>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span>{Number(item.expected_value).toLocaleString()} KES</span>
                                            <span className={item.is_overdue ? 'font-semibold text-gf-red' : 'text-slate-400'}>
                                                {item.next_follow_up || 'No follow-up'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                                {!(board[s] || []).length && (
                                    <p className="px-1 py-6 text-center text-xs text-slate-400">No deals</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {canViewAll && performance?.length > 0 && (
                <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <h3 className="font-display font-bold">Salesperson performance</h3>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                            <tr>
                                <th className="px-4 py-3">Owner</th>
                                <th className="px-4 py-3">Open</th>
                                <th className="px-4 py-3">Won</th>
                                <th className="px-4 py-3">Lost</th>
                                <th className="px-4 py-3">Won value</th>
                                <th className="px-4 py-3">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {performance.map((row) => (
                                <tr key={row.owner}>
                                    <td className="px-4 py-3 font-medium">{row.owner}</td>
                                    <td className="px-4 py-3">{row.open}</td>
                                    <td className="px-4 py-3">{row.won}</td>
                                    <td className="px-4 py-3">{row.lost}</td>
                                    <td className="px-4 py-3">{Number(row.won_value).toLocaleString()}</td>
                                    <td className="px-4 py-3">{row.conversion}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Opportunity</th>
                            <th className="px-4 py-3">Customer</th>
                            {canViewAll && <th className="px-4 py-3">Owner</th>}
                            <th className="px-4 py-3">Stage</th>
                            <th className="px-4 py-3">Follow-up</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {opportunities.data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{item.reference}</div>
                                    <div className="text-slate-600 dark:text-slate-300">{item.title}</div>
                                </td>
                                <td className="px-4 py-3">{item.customer?.name}</td>
                                {canViewAll && <td className="px-4 py-3">{item.owner?.name}</td>}
                                <td className="px-4 py-3">{item.stage_label}</td>
                                <td className={`px-4 py-3 ${item.is_overdue ? 'font-semibold text-gf-red' : ''}`}>
                                    {item.next_follow_up || '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('pipeline.show', item.id)} className="text-gf-forest hover:underline">Open</Link>
                                </td>
                            </tr>
                        ))}
                        {!opportunities.data.length && (
                            <tr>
                                <td colSpan={canViewAll ? 6 : 5} className="px-4 py-10 text-center text-slate-500">No opportunities yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={opportunities.links} />
        </AppLayout>
    );
}
