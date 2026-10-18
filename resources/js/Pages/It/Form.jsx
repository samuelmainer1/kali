import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ItForm({ categories, priorities, department }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: categories[0] || 'other',
        priority: 'medium',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('it.requests.store'));
    };

    return (
        <AppLayout title="New IT request">
            <Head title="New IT request" />
            <PageHeader
                title="New IT request"
                description={`This goes to ${department.name}.`}
                actions={<Link href={route('it.requests.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                    <InputLabel value="Title" />
                    <TextInput className="mt-1 w-full" value={data.title} onChange={(event) => setData('title', event.target.value)} placeholder="e.g. Email not opening" />
                    <InputError message={errors.title} className="mt-1" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Category" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.category} onChange={(event) => setData('category', event.target.value)}>
                            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <InputError message={errors.category} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Priority" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.priority} onChange={(event) => setData('priority', event.target.value)}>
                            {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <InputError message={errors.priority} className="mt-1" />
                    </div>
                </div>
                <div>
                    <InputLabel value="What do you need?" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={5} value={data.description} onChange={(event) => setData('description', event.target.value)} />
                    <InputError message={errors.description} className="mt-1" />
                </div>
                <PrimaryButton disabled={processing}>{processing ? 'Sending…' : 'Send to IT & Marketing'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
