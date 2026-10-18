import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function SettingsEdit({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        company_name: settings.company_name || '',
        trading_name: settings.trading_name || '',
        email: settings.email || '',
        phone: settings.phone || '',
        website: settings.website || '',
        address: settings.address || '',
        timezone: settings.timezone || 'Africa/Nairobi',
        currency: settings.currency || 'KES',
    });

    const submit = (event) => {
        event.preventDefault();
        put(route('admin.settings.update'));
    };

    return (
        <AppLayout title="Company settings">
            <Head title="Company settings" />

            <PageHeader
                title="Company settings"
                description="Core Globeflight company profile used across ILMS."
            />

            <form
                onSubmit={submit}
                className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value="Company name" />
                        <TextInput className="mt-1 w-full" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} />
                        <InputError message={errors.company_name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Trading name" />
                        <TextInput className="mt-1 w-full" value={data.trading_name} onChange={(e) => setData('trading_name', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Email" />
                        <TextInput className="mt-1 w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Phone" />
                        <TextInput className="mt-1 w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value="Website" />
                        <TextInput className="mt-1 w-full" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                        <InputError message={errors.website} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Currency" />
                        <TextInput className="mt-1 w-full" value={data.currency} onChange={(e) => setData('currency', e.target.value.toUpperCase())} />
                        <InputError message={errors.currency} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel value="Timezone" />
                        <TextInput className="mt-1 w-full" value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} />
                        <InputError message={errors.timezone} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel value="Address" />
                        <textarea
                            className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-gf-forest focus:ring-gf-forest dark:border-slate-700 dark:bg-slate-800"
                            rows={3}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                    </div>
                </div>

                <PrimaryButton disabled={processing}>
                    {processing ? 'Saving…' : 'Save settings'}
                </PrimaryButton>
            </form>
        </AppLayout>
    );
}
