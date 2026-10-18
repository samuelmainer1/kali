import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ChatCreate({ people, departments }) {
    const { data, setData, post, processing, errors } = useForm({
        audience: 'person',
        user_id: '',
        department_id: '',
        body: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('chat.store'));
    };

    return (
        <AppLayout title="New message">
            <Head title="New message" />
            <PageHeader
                title="New message"
                description="A message to a person stays between the two of you. A message to a department is seen by everyone in that department."
                actions={<Link href={route('chat.index')} className="text-sm text-gf-forest">Back</Link>}
            />

            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap gap-2">
                    {['person', 'department'].map((audience) => (
                        <button
                            key={audience}
                            type="button"
                            onClick={() => setData('audience', audience)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                                data.audience === audience
                                    ? 'bg-gf-green text-gf-ink'
                                    : 'border border-slate-200 text-slate-600 dark:border-slate-700'
                            }`}
                        >
                            {audience === 'person' ? 'One person' : 'A department'}
                        </button>
                    ))}
                </div>

                {data.audience === 'person' ? (
                    <div>
                        <InputLabel value="Person" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.user_id} onChange={(event) => setData('user_id', event.target.value)}>
                            <option value="">Choose a person</option>
                            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                        </select>
                        <InputError message={errors.user_id} className="mt-1" />
                    </div>
                ) : (
                    <div>
                        <InputLabel value="Department" />
                        <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={data.department_id} onChange={(event) => setData('department_id', event.target.value)}>
                            <option value="">Choose a department</option>
                            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                        </select>
                        <InputError message={errors.department_id} className="mt-1" />
                    </div>
                )}

                <div>
                    <InputLabel value="Message" />
                    <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={5} value={data.body} onChange={(event) => setData('body', event.target.value)} />
                    <InputError message={errors.body} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing}>{processing ? 'Sending…' : 'Send message'}</PrimaryButton>
            </form>
        </AppLayout>
    );
}
