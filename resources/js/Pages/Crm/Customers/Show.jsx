import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function CustomerShow({ customer }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];

    return (
        <AppLayout title={customer.name}>
            <Head title={customer.name} />
            <PageHeader
                title={customer.name}
                description={`${customer.status} · ${customer.country}`}
                actions={
                    <div className="flex gap-2">
                        {permissions.includes('quotations.create') && (
                            <HeaderLink href={route('sales.quotations.create', { customer_id: customer.id })}>
                                New quotation
                            </HeaderLink>
                        )}
                        {permissions.includes('customers.update') && (
                            <Link href={route('crm.customers.edit', customer.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                                Edit
                            </Link>
                        )}
                        {permissions.includes('customers.delete') && (
                            <button
                                type="button"
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gf-red"
                                onClick={() => {
                                    if (confirm('Delete this customer?')) {
                                        router.delete(route('crm.customers.destroy', customer.id));
                                    }
                                }}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-display font-bold">Company details</h3>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-slate-500">Email</dt><dd>{customer.email || '—'}</dd></div>
                        <div><dt className="text-slate-500">Phone</dt><dd>{customer.phone || '—'}</dd></div>
                        <div><dt className="text-slate-500">Website</dt><dd>{customer.website || '—'}</dd></div>
                        <div><dt className="text-slate-500">Tax number</dt><dd>{customer.tax_number || '—'}</dd></div>
                        <div><dt className="text-slate-500">Salesperson</dt><dd>{customer.salesperson?.name || '—'}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-slate-500">Notes</dt><dd>{customer.notes || '—'}</dd></div>
                    </dl>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Contacts</h3>
                    <ul className="mt-3 space-y-3 text-sm">
                        {customer.contacts.map((contact) => (
                            <li key={contact.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                <p className="font-medium">{contact.name} {contact.is_primary ? '· Primary' : ''}</p>
                                <p className="text-slate-500">{contact.email || contact.phone}</p>
                            </li>
                        ))}
                        {!customer.contacts.length && <li className="text-slate-500">No contacts</li>}
                    </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="font-display font-bold">Addresses</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {customer.addresses.map((address) => (
                            <div key={address.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                                <p className="font-semibold capitalize">{address.label}</p>
                                <p>{address.line1}</p>
                                <p className="text-slate-500">{[address.city, address.country].filter(Boolean).join(', ')}</p>
                            </div>
                        ))}
                        {!customer.addresses.length && <p className="text-slate-500">No addresses</p>}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Recent quotations</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        {customer.quotations.map((quote) => (
                            <li key={quote.id}>
                                <Link href={route('sales.quotations.show', quote.id)} className="text-gf-forest hover:underline">
                                    {quote.reference}
                                </Link>
                                <span className="ml-2 capitalize text-slate-500">{quote.status}</span>
                            </li>
                        ))}
                        {!customer.quotations.length && <li className="text-slate-500">No quotations yet</li>}
                    </ul>
                </section>
            </div>
        </AppLayout>
    );
}
