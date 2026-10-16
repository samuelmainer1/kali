import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function LeadForm({ lead, options }) {
    const editing = Boolean(lead?.id);
    const { data, setData, post, put, processing, errors } = useForm({
        name: lead?.name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        company: lead?.company || '',
        source: lead?.source || '',
        status: lead?.status || 'new',
        campaign_id: lead?.campaign_id || '',
        customer_id: lead?.customer_id || '',
        assigned_to: lead?.assigned_to || '',
        notes: lead?.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (editing) put(route('marketing.leads.update', lead.id));
        else post(route('marketing.leads.store'));
    };

    return (
        <AppLayout title={editing ? 'Edit lead' : 'New lead'}>
            <Head title={editing ? 'Edit lead' : 'New lead'} />
            <PageHeader
                title={editing ? 'Edit lead' : 'New lead'}
                description="Capture prospect details and pipeline status."
                actions={<Link href={route('marketing.leads.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel value="Name" />
                        <TextInput className="mt-1 w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Email" />
                        <TextInput className="mt-1 w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Phone" />
                        <TextInput className="mt-1 w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Company" />
                        <TextInput className="mt-1 w-full" value={data.company} onChange={(e) => setData('company', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Source" />
                        <TextInput className="mt-1 w-full" value={data.source} onChange={(e) => setData('source', e.target.value)} placeholder="Website, event, referral…" />
                    </div>
                    <div>
                        <InputLabel value="Status" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.status} onChange={(e) => setData('status', e.target.value)}>
                            {options.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Campaign" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.campaign_id} onChange={(e) => setData('campaign_id', e.target.value)}>
                            <option value="">None</option>
                            {options.campaigns.map((c) => <option key={c.id} value={c.id}>{c.reference} — {c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="CRM customer" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.customer_id} onChange={(e) => setData('customer_id', e.target.value)}>
                            <option value="">None</option>
                            {options.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Assigned to" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.assigned_to} onChange={(e) => setData('assigned_to', e.target.value)}>
                            <option value="">Unassigned</option>
                            {options.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <InputLabel value="Notes" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <PrimaryButton disabled={processing}>{editing ? 'Update lead' : 'Create lead'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
