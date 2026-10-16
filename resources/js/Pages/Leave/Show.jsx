import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function LeaveShow({ leaveRequest }) {
    const rejectForm = useForm({ rejection_reason: '' });

    return (
        <AppLayout title={leaveRequest.reference}>
            <Head title={leaveRequest.reference} />
            <PageHeader
                title={leaveRequest.reference}
                description={`${leaveRequest.leave_type?.name || leaveRequest.leave_type_name} · ${leaveRequest.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('leave.index')} className="text-sm text-gf-forest">Back</Link>
                        {leaveRequest.can_edit && (
                            <Link href={route('leave.edit', leaveRequest.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {leaveRequest.can_approve && (
                            <PrimaryButton type="button" onClick={() => router.post(route('leave.approve', leaveRequest.id))}>
                                Approve
                            </PrimaryButton>
                        )}
                        {leaveRequest.can_cancel && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Cancel this leave request?')) {
                                        router.post(route('leave.cancel', leaveRequest.id));
                                    }
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Reason</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                            {leaveRequest.reason || '—'}
                        </p>
                        {leaveRequest.rejection_reason && (
                            <div className="mt-4 rounded-xl bg-gf-red/10 px-3 py-2 text-sm text-gf-red">
                                <span className="font-semibold">Rejection reason:</span> {leaveRequest.rejection_reason}
                            </div>
                        )}
                    </div>

                    {leaveRequest.can_approve && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                rejectForm.post(route('leave.reject', leaveRequest.id));
                            }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <h3 className="font-display font-bold">Reject request</h3>
                            <textarea
                                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                                rows={3}
                                placeholder="Rejection reason"
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                            />
                            <button type="submit" className="rounded-xl bg-gf-red px-4 py-2 text-sm font-semibold text-white" disabled={rejectForm.processing}>
                                Reject
                            </button>
                        </form>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Details</h3>
                    <dl className="mt-3 space-y-2">
                        <div><dt className="text-slate-500">Employee</dt><dd>{leaveRequest.requester?.name || leaveRequest.requester_name}</dd></div>
                        <div><dt className="text-slate-500">Type</dt><dd>{leaveRequest.leave_type?.name || leaveRequest.leave_type_name}</dd></div>
                        <div><dt className="text-slate-500">Dates</dt><dd>{leaveRequest.start_date} → {leaveRequest.end_date}</dd></div>
                        <div><dt className="text-slate-500">Days</dt><dd>{leaveRequest.days}{leaveRequest.is_half_day ? ` (half day · ${leaveRequest.half_day_period})` : ''}</dd></div>
                        <div><dt className="text-slate-500">Department</dt><dd>{leaveRequest.department || '—'}</dd></div>
                        <div><dt className="text-slate-500">Branch</dt><dd>{leaveRequest.branch || '—'}</dd></div>
                        <div><dt className="text-slate-500">Status</dt><dd>{leaveRequest.status_label}</dd></div>
                        {leaveRequest.approver && (
                            <div><dt className="text-slate-500">Decided by</dt><dd>{leaveRequest.approver.name}</dd></div>
                        )}
                        {leaveRequest.approved_at && (
                            <div><dt className="text-slate-500">Decided at</dt><dd>{leaveRequest.approved_at}</dd></div>
                        )}
                    </dl>
                </section>
            </div>
        </AppLayout>
    );
}
