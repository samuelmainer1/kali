import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function CampaignShow({ campaign }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];

    return (
        <AppLayout title={campaign.reference}>
            <Head title={campaign.reference} />
            <PageHeader
                title={campaign.name}
                description={`${campaign.reference} · ${campaign.status_label}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('marketing.campaigns.index')} className="text-sm text-gf-forest">Back</Link>
                        {permissions.includes('marketing.manage') && (
                            <Link href={route('marketing.campaigns.edit', campaign.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Content</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{campaign.content || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="font-display font-bold">Audience</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{campaign.audience || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display font-bold">Linked leads</h3>
                            <Link href={route('marketing.leads.index')} className="text-sm text-gf-forest hover:underline">View all</Link>
                        </div>
                        <ul className="space-y-2 text-sm">
                            {campaign.leads.map((lead) => (
                                <li key={lead.id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                                    <span>{lead.name} {lead.company ? `· ${lead.company}` : ''}</span>
                                    <span className="capitalize text-slate-500">{lead.status}</span>
                                </li>
                            ))}
                            {!campaign.leads.length && <li className="py-4 text-center text-slate-500">No leads linked yet.</li>}
                        </ul>
                    </div>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Details</h3>
                    <dl className="mt-3 space-y-2">
                        <div><dt className="text-slate-500">Channel</dt><dd className="capitalize">{campaign.channel}</dd></div>
                        <div><dt className="text-slate-500">Status</dt><dd className="capitalize">{campaign.status_label}</dd></div>
                        <div><dt className="text-slate-500">Budget</dt><dd>{campaign.budget ? `${campaign.currency} ${Number(campaign.budget).toLocaleString()}` : '—'}</dd></div>
                        <div><dt className="text-slate-500">Dates</dt><dd>{campaign.start_date || '—'} → {campaign.end_date || '—'}</dd></div>
                        <div><dt className="text-slate-500">Created by</dt><dd>{campaign.creator || '—'}</dd></div>
                        <div><dt className="text-slate-500">Notes</dt><dd className="whitespace-pre-wrap">{campaign.notes || '—'}</dd></div>
                    </dl>
                </section>
            </div>
        </AppLayout>
    );
}
