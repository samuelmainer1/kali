import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function ReportShow({ report }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [reviewOpen, setReviewOpen] = useState(false);
    const reviewForm = useForm({
        decision: 'approved',
        reviewer_notes: '',
    });

    return (
        <AppLayout title={report.reference}>
            <Head title={report.reference} />
            <PageHeader
                title={report.reference}
                description={`${report.title} · ${report.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {report.is_owner && report.is_editable && permissions.includes('reports.weekly.submit') && (
                            <Link
                                href={route('reports.edit', report.id)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Edit
                            </Link>
                        )}
                        {report.is_owner && report.is_editable && permissions.includes('reports.weekly.submit') && (
                            <PrimaryButton
                                type="button"
                                onClick={() => router.post(route('reports.submit', report.id))}
                            >
                                Submit for review
                            </PrimaryButton>
                        )}
                        {report.is_reviewable && permissions.includes('reports.weekly.review') && (
                            <PrimaryButton type="button" onClick={() => setReviewOpen(true)}>
                                Review
                            </PrimaryButton>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Accomplishments</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {report.accomplishments}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Challenges</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {report.challenges || '—'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Next plans</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {report.next_plans || '—'}
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Details</h3>
                        <dl className="mt-3 space-y-2">
                            <div>
                                <dt className="text-slate-500">Author</dt>
                                <dd>{report.author?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Period</dt>
                                <dd className="capitalize">
                                    {report.period_type}<br />
                                    {report.period_start} → {report.period_end}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Department</dt>
                                <dd>{report.department || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Branch</dt>
                                <dd>{report.branch || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Status</dt>
                                <dd className="capitalize font-medium">{report.status_label}</dd>
                            </div>
                            {report.submitted_at && (
                                <div>
                                    <dt className="text-slate-500">Submitted</dt>
                                    <dd>{report.submitted_at}</dd>
                                </div>
                            )}
                            {report.reviewer && (
                                <div>
                                    <dt className="text-slate-500">Reviewed by</dt>
                                    <dd>{report.reviewer.name} · {report.reviewed_at}</dd>
                                </div>
                            )}
                            {report.reviewer_notes && (
                                <div>
                                    <dt className="text-slate-500">Reviewer notes</dt>
                                    <dd className="whitespace-pre-wrap">{report.reviewer_notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </section>
            </div>

            {reviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-display text-lg font-bold">Review report</h3>
                            <button type="button" onClick={() => setReviewOpen(false)} className="text-sm text-slate-500">
                                Close
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                reviewForm.post(route('reports.review', report.id), {
                                    onSuccess: () => setReviewOpen(false),
                                });
                            }}
                            className="space-y-3"
                        >
                            <select
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                value={reviewForm.data.decision}
                                onChange={(e) => reviewForm.setData('decision', e.target.value)}
                            >
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                                <option value="revision_requested">Request revision</option>
                            </select>
                            <textarea
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                rows={4}
                                placeholder="Notes (required for reject / revision)"
                                value={reviewForm.data.reviewer_notes}
                                onChange={(e) => reviewForm.setData('reviewer_notes', e.target.value)}
                            />
                            {reviewForm.errors.reviewer_notes && (
                                <p className="text-sm text-red-600">{reviewForm.errors.reviewer_notes}</p>
                            )}
                            <PrimaryButton disabled={reviewForm.processing}>Save review</PrimaryButton>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
