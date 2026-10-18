import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function periodDefaults(periodType) {
    const now = new Date();
    if (periodType === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const title = `Monthly report — ${start.toLocaleString('en', { month: 'long', year: 'numeric' })}`;

        return {
            period_start: toLocalDateString(start),
            period_end: toLocalDateString(end),
            title,
        };
    }

    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const title = `Weekly report — ${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} to ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    return {
        period_start: toLocalDateString(start),
        period_end: toLocalDateString(end),
        title,
    };
}

export default function ReportForm({ report, defaults, periodTypes }) {
    const editing = Boolean(report?.id);
    const initial = report || defaults || periodDefaults('weekly');

    const form = useForm({
        period_type: report?.period_type || 'weekly',
        period_start: initial.period_start || '',
        period_end: initial.period_end || '',
        title: initial.title || '',
        accomplishments: report?.accomplishments || '',
        challenges: report?.challenges || '',
        next_plans: report?.next_plans || '',
        submit: false,
    });

    const { data, setData, processing, errors } = form;

    const applyPeriodType = (type) => {
        const next = periodDefaults(type);
        setData({
            ...data,
            period_type: type,
            period_start: next.period_start,
            period_end: next.period_end,
            title: next.title,
        });
    };

    const save = (shouldSubmit) => {
        form.clearErrors();
        form.transform((payload) => ({
            ...payload,
            submit: shouldSubmit ? 1 : 0,
        }));

        const options = {
            preserveScroll: true,
            onFinish: () => {
                form.transform((payload) => payload);
                setData('submit', false);
            },
        };

        if (editing) {
            form.put(route('reports.update', report.id), options);
        } else {
            form.post(route('reports.store'), options);
        }
    };

    const errorList = Object.values(errors).filter(Boolean);

    return (
        <AppLayout title={editing ? 'Edit report' : 'New report'}>
            <Head title={editing ? 'Edit report' : 'New report'} />
            <PageHeader
                title={editing ? 'Edit report' : 'New report'}
                description="Capture accomplishments, challenges, and next plans for the period."
                actions={<Link href={route('reports.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    save(false);
                }}
                className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
                {errorList.length > 0 && (
                    <div className="rounded-xl border border-gf-red/30 bg-gf-red/10 px-4 py-3 text-sm text-gf-red">
                        <p className="font-semibold">Could not save the report.</p>
                        <ul className="mt-1 list-disc pl-5">
                            {errorList.map((message) => (
                                <li key={String(message)}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Period type" />
                        <select
                            className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                            value={data.period_type}
                            onChange={(e) => applyPeriodType(e.target.value)}
                            disabled={editing}
                        >
                            {periodTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <InputError message={errors.period_type} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Title" />
                        <TextInput className="mt-1 w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        <InputError message={errors.title} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Period start" />
                        <TextInput type="date" className="mt-1 w-full" value={data.period_start} onChange={(e) => setData('period_start', e.target.value)} />
                        <InputError message={errors.period_start} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Period end" />
                        <TextInput type="date" className="mt-1 w-full" value={data.period_end} onChange={(e) => setData('period_end', e.target.value)} />
                        <InputError message={errors.period_end} className="mt-1" />
                    </div>
                </div>

                <div>
                    <InputLabel value="Accomplishments *" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={5}
                        value={data.accomplishments}
                        onChange={(e) => setData('accomplishments', e.target.value)}
                        placeholder="What did you complete this period? (required to submit)"
                    />
                    <InputError message={errors.accomplishments} className="mt-1" />
                </div>

                <div>
                    <InputLabel value="Challenges" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={3}
                        value={data.challenges}
                        onChange={(e) => setData('challenges', e.target.value)}
                        placeholder="Blockers or issues (optional)"
                    />
                </div>

                <div>
                    <InputLabel value="Next plans" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={3}
                        value={data.next_plans}
                        onChange={(e) => setData('next_plans', e.target.value)}
                        placeholder="Priorities for the next period (optional)"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <PrimaryButton disabled={processing} type="submit">
                        {processing && !data.submit ? 'Saving…' : 'Save draft'}
                    </PrimaryButton>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => save(true)}
                        className="rounded-xl border border-gf-forest px-4 py-2.5 text-sm font-semibold text-gf-forest hover:bg-gf-green/10 disabled:opacity-50"
                    >
                        {processing ? 'Submitting…' : 'Save & submit'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
