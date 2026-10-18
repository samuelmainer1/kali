import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function PipelineShow({ opportunity, stages, stageLabels }) {
    const stageForm = useForm({
        stage: opportunity.stage,
        lost_reason: opportunity.lost_reason || '',
    });

    return (
        <AppLayout title={opportunity.reference}>
            <Head title={opportunity.title} />
            <PageHeader
                title={opportunity.title}
                description={`${opportunity.reference} · ${opportunity.stage_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('pipeline.index')} className="text-sm text-gf-forest">Back</Link>
                        {opportunity.can_edit && (
                            <Link href={route('pipeline.edit', opportunity.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Deal notes</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {opportunity.notes || '—'}
                        </p>
                        {opportunity.quotation && (
                            <p className="mt-4 text-sm">
                                Linked quotation:{' '}
                                <Link href={route('sales.quotations.show', opportunity.quotation.id)} className="font-semibold text-gf-forest hover:underline">
                                    {opportunity.quotation.reference}
                                </Link>
                            </p>
                        )}
                    </div>

                    {opportunity.can_edit && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                stageForm.post(route('pipeline.stage', opportunity.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Move stage</h3>
                            <select
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                value={stageForm.data.stage}
                                onChange={(e) => stageForm.setData('stage', e.target.value)}
                            >
                                {stages.map((s) => <option key={s} value={s}>{stageLabels[s]}</option>)}
                            </select>
                            {stageForm.data.stage === 'lost' && (
                                <input
                                    className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="Lost reason"
                                    value={stageForm.data.lost_reason}
                                    onChange={(e) => stageForm.setData('lost_reason', e.target.value)}
                                />
                            )}
                            <PrimaryButton disabled={stageForm.processing}>Update stage</PrimaryButton>
                        </form>
                    )}
                </section>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div><dt className="text-slate-500">Customer</dt><dd>
                                <Link href={route('crm.customers.show', opportunity.customer.id)} className="text-gf-forest hover:underline">
                                    {opportunity.customer?.name}
                                </Link>
                            </dd></div>
                            <div><dt className="text-slate-500">Owner</dt><dd>{opportunity.owner?.name}</dd></div>
                            <div><dt className="text-slate-500">Expected value</dt><dd>{Number(opportunity.expected_value).toLocaleString()} {opportunity.currency}</dd></div>
                            <div><dt className="text-slate-500">Follow-up</dt><dd className={opportunity.is_overdue ? 'font-semibold text-gf-red' : ''}>{opportunity.next_follow_up || '—'}</dd></div>
                            <div><dt className="text-slate-500">Created by</dt><dd>{opportunity.creator?.name}</dd></div>
                            {opportunity.lost_reason && <div><dt className="text-slate-500">Lost reason</dt><dd>{opportunity.lost_reason}</dd></div>}
                        </dl>
                    </div>
                </aside>
            </div>
        </AppLayout>
    );
}
