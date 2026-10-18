import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CampaignForm({ campaign, statuses, channels }) {
    const editing = Boolean(campaign?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: campaign?.name || '',
        channel: campaign?.channel || 'email',
        status: campaign?.status || 'draft',
        audience: campaign?.audience || '',
        content: campaign?.content || '',
        budget: campaign?.budget || '',
        currency: campaign?.currency || 'KES',
        start_date: campaign?.start_date || '',
        end_date: campaign?.end_date || '',
        notes: campaign?.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('marketing.campaigns.update', campaign.id));
        else post(route('marketing.campaigns.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit campaign' : 'New campaign'}>
            <Head title={editing ? 'Edit campaign' : 'New campaign'} />
            <PageHeader
                title={editing ? 'Edit campaign' : 'New campaign'}
                description="Define channel, audience, and schedule."
                actions={<Link href={route('marketing.campaigns.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Name" />
                    <TextInput className="mt-1 w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Channel" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.channel} onChange={(e) => setData('channel', e.target.value)}>
                            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Status" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Budget" />
                        <TextInput type="number" step="0.01" className="mt-1 w-full" value={data.budget} onChange={(e) => setData('budget', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={data.currency} onChange={(e) => setData('currency', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Start date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="End date" />
                        <TextInput type="date" className="mt-1 w-full" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                    </div>
                </div>
                <div>
                    <InputLabel value="Audience" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={2} value={data.audience} onChange={(e) => setData('audience', e.target.value)} />
                </div>
                <div>
                    <InputLabel value="Content / message" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={4} value={data.content} onChange={(e) => setData('content', e.target.value)} />
                </div>
                <div>
                    <InputLabel value="Notes" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <PrimaryButton disabled={processing}>{editing ? 'Update campaign' : 'Create campaign'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
