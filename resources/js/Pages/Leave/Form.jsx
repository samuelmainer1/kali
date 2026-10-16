import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function LeaveForm({ leaveRequest, leaveTypes, balances, halfDayPeriods }) {
    const editing = Boolean(leaveRequest?.id);

    const { data, setData, post, put, processing, errors } = useForm({
        leave_type_id: leaveRequest?.leave_type_id || leaveTypes[0]?.id || '',
        start_date: leaveRequest?.start_date || '',
        end_date: leaveRequest?.end_date || '',
        is_half_day: Boolean(leaveRequest?.is_half_day),
        half_day_period: leaveRequest?.half_day_period || 'morning',
        reason: leaveRequest?.reason || '',
    });

    const selectedBalance = balances.find((b) => String(b.leave_type_id) === String(data.leave_type_id));

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('leave.update', leaveRequest.id));
        else post(route('leave.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit leave' : 'New leave request'}>
            <Head title={editing ? 'Edit leave' : 'New leave request'} />
            <PageHeader
                title={editing ? 'Edit leave request' : 'New leave request'}
                description="Working days (Mon–Fri) are counted. Half-day uses 0.5 against your balance."
                actions={<Link href={route('leave.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                {Object.values(errors).length > 0 && (
                    <div className="rounded-xl border border-gf-red/30 bg-gf-red/10 px-4 py-3 text-sm text-gf-red">
                        <p className="font-semibold">Could not save leave request.</p>
                        <ul className="mt-1 list-disc pl-5">
                            {Object.values(errors).map((message) => (
                                <li key={String(message)}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div>
                    <InputLabel value="Leave type" />
                    <select
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        value={data.leave_type_id}
                        onChange={(e) => setData('leave_type_id', e.target.value)}
                    >
                        {leaveTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                    {selectedBalance && (
                        <p className="mt-1 text-xs text-slate-500">
                            Remaining balance: <span className="font-semibold text-gf-forest">{selectedBalance.remaining}</span> day(s)
                        </p>
                    )}
                    <InputError message={errors.leave_type_id} className="mt-1" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Start date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                        <InputError message={errors.start_date} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="End date" />
                        <TextInput
                            type="date"
                            className="mt-1 w-full"
                            value={data.is_half_day ? data.start_date : data.end_date}
                            onChange={(e) => setData('end_date', e.target.value)}
                            disabled={data.is_half_day}
                        />
                        <InputError message={errors.end_date} className="mt-1" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_half_day}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setData({
                                    ...data,
                                    is_half_day: checked,
                                    end_date: checked ? data.start_date : data.end_date,
                                });
                            }}
                        />
                        Half day
                    </label>
                    {data.is_half_day && (
                        <select
                            className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            value={data.half_day_period}
                            onChange={(e) => setData('half_day_period', e.target.value)}
                        >
                            {halfDayPeriods.map((period) => (
                                <option key={period} value={period}>{period}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <InputLabel value="Reason" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={4}
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        placeholder="Optional note for your manager"
                    />
                    <InputError message={errors.reason} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing}>
                    {processing ? 'Submitting…' : editing ? 'Update request' : 'Submit for approval'}
                </PrimaryButton>
            </form>
        </AppLayout>
    );
}
