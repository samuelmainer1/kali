import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function PipelineForm({ opportunity, options, prefill }) {
    const editing = Boolean(opportunity?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        title: opportunity?.title || '',
        customer_id: opportunity?.customer_id || prefill?.customer_id || '',
        owner_id: opportunity?.owner_id || options.default_owner || '',
        stage: opportunity?.stage || 'new_lead',
        expected_value: opportunity?.expected_value ?? '',
        currency: opportunity?.currency || 'KES',
        next_follow_up: opportunity?.next_follow_up || '',
        quotation_id: opportunity?.quotation_id || '',
        notes: opportunity?.notes || '',
        lost_reason: opportunity?.lost_reason || '',
    });

    const quotations = options.quotations.filter((q) => !data.customer_id || String(q.customer_id) === String(data.customer_id));

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('pipeline.update', opportunity.id));
        else post(route('pipeline.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit opportunity' : 'New opportunity'}>
            <Head title={editing ? 'Edit opportunity' : 'New opportunity'} />
            <PageHeader
                title={editing ? 'Edit opportunity' : 'New opportunity'}
                description="Capture the deal, owner, stage, and next follow-up."
                actions={<Link href={route('pipeline.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Title" />
                    <TextInput className="mt-1 w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Customer" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.customer_id} onChange={(e) => setData({ ...data, customer_id: e.target.value, quotation_id: '' })}>
                            <option value="">Select customer</option>
                            {options.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <InputError message={errors.customer_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Owner" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.owner_id} onChange={(e) => setData('owner_id', e.target.value)}>
                            {options.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <InputError message={errors.owner_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Stage" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.stage} onChange={(e) => setData('stage', e.target.value)}>
                            {options.stages.map((s) => <option key={s} value={s}>{options.stageLabels[s]}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Expected value (KES)" />
                        <TextInput type="number" min="0" step="0.01" className="mt-1 w-full" value={data.expected_value} onChange={(e) => setData('expected_value', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Next follow-up" />
                        <TextInput type="date" className="mt-1 w-full" value={data.next_follow_up} onChange={(e) => setData('next_follow_up', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Linked quotation" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.quotation_id} onChange={(e) => setData('quotation_id', e.target.value)}>
                            <option value="">None</option>
                            {quotations.map((q) => <option key={q.id} value={q.id}>{q.reference}</option>)}
                        </select>
                    </div>
                </div>
                {data.stage === 'lost' && (
                    <div>
                        <InputLabel value="Lost reason" />
                        <TextInput className="mt-1 w-full" value={data.lost_reason} onChange={(e) => setData('lost_reason', e.target.value)} />
                        <InputError message={errors.lost_reason} className="mt-1" />
                    </div>
                )}
                <div>
                    <InputLabel value="Notes" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={4} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <PrimaryButton disabled={processing}>{editing ? 'Update opportunity' : 'Create opportunity'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
