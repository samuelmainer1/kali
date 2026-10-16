import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';

const typeClass = {
    leave: 'bg-gf-blue/15 text-sky-800',
    procurement: 'bg-gf-yellow/20 text-amber-800',
    quotations: 'bg-gf-green/15 text-gf-forest',
    reports: 'bg-violet-100 text-violet-800',
};

export default function ApprovalsIndex({ filters, total, counts, items, types }) {
    const setType = (type) => {
        router.get(route('approvals.index'), type ? { type } : {}, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Approvals">
            <Head title="Approvals hub" />
            <PageHeader
                title="Approvals hub"
                description="Everything waiting for your decision — leave, purchases, quotations, and reports."
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <button
                    type="button"
                    onClick={() => setType(null)}
                    className={`rounded-2xl border p-4 text-left dark:border-slate-800 ${!filters.type ? 'border-gf-forest bg-gf-green/10' : 'border-slate-200 bg-white dark:bg-slate-900'}`}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">All pending</p>
                    <p className="mt-2 font-display text-2xl font-bold">{total}</p>
                </button>
                {types.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => setType(type.value)}
                        className={`rounded-2xl border p-4 text-left dark:border-slate-800 ${filters.type === type.value ? 'border-gf-forest bg-gf-green/10' : 'border-slate-200 bg-white dark:bg-slate-900'}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{type.label}</p>
                        <p className="mt-2 font-display text-2xl font-bold">{counts[type.value] ?? 0}</p>
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Reference</th>
                            <th className="px-4 py-3">From</th>
                            <th className="px-4 py-3">Summary</th>
                            <th className="px-4 py-3">Waiting</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item) => (
                            <tr key={item.key}>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${typeClass[item.type] || 'bg-slate-100'}`}>
                                        {item.type_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{item.reference}</td>
                                <td className="px-4 py-3">{item.from}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.summary}</td>
                                <td className="px-4 py-3 text-slate-500">{item.waiting_label}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={item.url} className="font-semibold text-gf-forest hover:underline">
                                        Review
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {!items.length && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                    No pending approvals{filters.type ? ' in this category' : ''}. Nice work.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
