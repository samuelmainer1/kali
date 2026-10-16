import Pagination from '@/Components/Pagination';
import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusClass = {
    lead: 'bg-gf-yellow/20 text-amber-800',
    active: 'bg-gf-green/15 text-gf-forest',
    inactive: 'bg-slate-200 text-slate-600',
    blocked: 'bg-gf-red/10 text-gf-red',
};

export default function CustomersIndex({ customers, filters, statuses }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const apply = (e) => {
        e.preventDefault();
        router.get(route('crm.customers.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Customers">
            <Head title="Customers" />
            <PageHeader
                title="CRM · Customers"
                description="Manage companies, contacts, and assigned salespeople."
                actions={
                    permissions.includes('customers.create') ? (
                        <HeaderLink href={route('crm.customers.create')}>Add customer</HeaderLink>
                    ) : null
                }
            />

            <form onSubmit={apply} className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
                <TextInput className="md:col-span-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, email, phone" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">All statuses</option>
                    {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button type="submit" className="rounded-xl bg-gf-ink px-4 text-sm font-semibold text-white dark:bg-gf-forest">Filter</button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                        <tr>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Salesperson</th>
                            <th className="px-4 py-3">Contacts</th>
                            <th className="px-4 py-3">Quotes</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {customers.data.map((customer) => (
                            <tr key={customer.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-xs text-slate-500">{customer.email || customer.phone || customer.country}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass[customer.status] || ''}`}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{customer.salesperson || '—'}</td>
                                <td className="px-4 py-3">{customer.contacts_count}</td>
                                <td className="px-4 py-3">{customer.quotations_count}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('crm.customers.show', customer.id)} className="text-gf-forest hover:underline">View</Link>
                                </td>
                            </tr>
                        ))}
                        {!customers.data.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No customers yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={customers.links} />
        </AppLayout>
    );
}
