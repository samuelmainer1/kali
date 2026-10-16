import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function SupportForm({ customers, shipments, priorities, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
        customer_id: '',
        shipment_id: '',
    });

    return (
        <AppLayout title="New ticket">
            <Head title="New ticket" />
            <PageHeader
                title="New support ticket"
                description="Describe the issue and we will follow up."
                actions={<Link href={route('support.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    post(route('support.store'));
                }}
                className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
                <div>
                    <InputLabel value="Subject" />
                    <TextInput className="mt-1 w-full" value={data.subject} onChange={(e) => setData('subject', e.target.value)} />
                    <InputError message={errors.subject} className="mt-1" />
                </div>
                <div>
                    <InputLabel value="Description" />
                    <textarea
                        className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={5}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    <InputError message={errors.description} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Priority" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.priority} onChange={(e) => setData('priority', e.target.value)}>
                            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <InputLabel value="Category" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.category} onChange={(e) => setData('category', e.target.value)}>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {customers.length > 0 && (
                        <div>
                            <InputLabel value="Customer (optional)" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.customer_id} onChange={(e) => setData('customer_id', e.target.value)}>
                                <option value="">None</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    {shipments.length > 0 && (
                        <div>
                            <InputLabel value="Shipment (optional)" />
                            <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.shipment_id} onChange={(e) => setData('shipment_id', e.target.value)}>
                                <option value="">None</option>
                                {shipments.map((s) => <option key={s.id} value={s.id}>{s.reference}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <PrimaryButton disabled={processing}>Create ticket</PrimaryButton>
            </form>
        </AppLayout>
    );
}
