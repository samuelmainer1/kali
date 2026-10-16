import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function Stat({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-gf-ink dark:text-white">{value}</p>
        </div>
    );
}

export default function WarehouseIndex({ inventory, movements, warehouseShipments, stats, options }) {
    const permissions = usePage().props.auth.user?.permissions ?? [];
    const canManage = permissions.includes('warehouse.manage');
    const [showItem, setShowItem] = useState(false);
    const [showMove, setShowMove] = useState(false);

    const itemForm = useForm({
        sku: '',
        name: '',
        description: '',
        quantity_on_hand: 1,
        unit: 'pcs',
        branch_id: '',
        shipment_id: '',
        location_code: '',
        status: 'available',
    });

    const moveForm = useForm({
        type: 'inbound',
        inventory_item_id: '',
        shipment_id: '',
        branch_id: '',
        quantity: 1,
        reference: '',
        notes: '',
    });

    return (
        <AppLayout title="Warehouse">
            <Head title="Warehouse" />
            <PageHeader
                title="Warehouse"
                description="Inventory lots and cargo movements linked to shipments."
                actions={
                    canManage ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowItem(true)}
                                className="rounded-xl bg-gf-ink px-4 py-2.5 text-sm font-semibold text-white dark:bg-gf-forest"
                            >
                                Add item
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMove(true)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                            >
                                Record movement
                            </button>
                        </div>
                    ) : null
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Stat label="Lots" value={stats.lots} />
                <Stat label="Available qty" value={stats.available_qty} />
                <Stat label="Held lots" value={stats.held_lots} />
                <Stat label="Inbound today" value={stats.inbound_today} />
                <Stat label="Outbound today" value={stats.outbound_today} />
            </div>

            {warehouseShipments?.length > 0 && (
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-display font-bold">Shipments at warehouse</h3>
                    <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                        {warehouseShipments.map((shipment) => (
                            <li key={shipment.id} className="flex items-center justify-between gap-3 py-2">
                                <div>
                                    <p className="font-medium">{shipment.reference}</p>
                                    <p className="text-slate-500">
                                        {shipment.customer?.name || '—'} · {shipment.pieces} pcs · {shipment.current_location || 'WH'}
                                    </p>
                                </div>
                                <Link href={route('operations.shipments.show', shipment.id)} className="text-gf-forest hover:underline">
                                    Open
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="grid gap-6 xl:grid-cols-5">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 xl:col-span-3">
                    <div className="border-b border-slate-200 px-4 py-3 font-display font-bold dark:border-slate-800">
                        Inventory
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70">
                                <tr>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Qty</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Shipment</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {inventory.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-medium">{item.sku}</td>
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3">{item.quantity_on_hand} {item.unit}</td>
                                        <td className="px-4 py-3">{item.location_code || '—'}</td>
                                        <td className="px-4 py-3">{item.shipment || '—'}</td>
                                        <td className="px-4 py-3 capitalize">{item.status}</td>
                                    </tr>
                                ))}
                                {!inventory.data.length && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                            No inventory yet. Advance a shipment to warehouse or add an item.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3">
                        <Pagination links={inventory.links} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
                    <h3 className="font-display font-bold">Recent movements</h3>
                    <ul className="mt-3 space-y-3 text-sm">
                        {movements.map((movement) => (
                            <li key={movement.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                <p className="font-medium capitalize">
                                    {movement.type} · {movement.quantity} · {movement.sku}
                                </p>
                                <p className="text-slate-500">
                                    {movement.item_name} {movement.shipment ? `· ${movement.shipment}` : ''}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {movement.performed_by || 'System'} · {movement.moved_at}
                                </p>
                            </li>
                        ))}
                        {!movements.length && <li className="py-6 text-center text-slate-500">No movements yet.</li>}
                    </ul>
                </section>
            </div>

            {showItem && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-display text-lg font-bold">Add inventory item</h3>
                            <button type="button" onClick={() => setShowItem(false)} className="text-sm text-slate-500">
                                Close
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                itemForm.post(route('warehouse.items.store'), {
                                    onSuccess: () => {
                                        itemForm.reset();
                                        setShowItem(false);
                                    },
                                });
                            }}
                            className="space-y-3"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="SKU" />
                                    <TextInput className="mt-1 w-full" value={itemForm.data.sku} onChange={(e) => itemForm.setData('sku', e.target.value)} />
                                    <InputError message={itemForm.errors.sku} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Name" />
                                    <TextInput className="mt-1 w-full" value={itemForm.data.name} onChange={(e) => itemForm.setData('name', e.target.value)} />
                                    <InputError message={itemForm.errors.name} className="mt-1" />
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <InputLabel value="Qty" />
                                    <TextInput type="number" step="0.01" className="mt-1 w-full" value={itemForm.data.quantity_on_hand} onChange={(e) => itemForm.setData('quantity_on_hand', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Unit" />
                                    <TextInput className="mt-1 w-full" value={itemForm.data.unit} onChange={(e) => itemForm.setData('unit', e.target.value)} />
                                </div>
                                <div>
                                    <InputLabel value="Location" />
                                    <TextInput className="mt-1 w-full" value={itemForm.data.location_code} onChange={(e) => itemForm.setData('location_code', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Branch" />
                                    <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={itemForm.data.branch_id} onChange={(e) => itemForm.setData('branch_id', e.target.value)}>
                                        <option value="">Optional</option>
                                        {options.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Status" />
                                    <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={itemForm.data.status} onChange={(e) => itemForm.setData('status', e.target.value)}>
                                        {options.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Linked shipment" />
                                <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={itemForm.data.shipment_id} onChange={(e) => itemForm.setData('shipment_id', e.target.value)}>
                                    <option value="">Optional</option>
                                    {options.shipments.map((s) => <option key={s.id} value={s.id}>{s.reference} ({s.status})</option>)}
                                </select>
                            </div>
                            <PrimaryButton disabled={itemForm.processing}>Save item</PrimaryButton>
                        </form>
                    </div>
                </div>
            )}

            {showMove && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-display text-lg font-bold">Record cargo movement</h3>
                            <button type="button" onClick={() => setShowMove(false)} className="text-sm text-slate-500">
                                Close
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                moveForm.post(route('warehouse.movements.store'), {
                                    onSuccess: () => {
                                        moveForm.reset();
                                        setShowMove(false);
                                    },
                                });
                            }}
                            className="space-y-3"
                        >
                            <div>
                                <InputLabel value="Inventory item" />
                                <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={moveForm.data.inventory_item_id} onChange={(e) => moveForm.setData('inventory_item_id', e.target.value)}>
                                    <option value="">Select item</option>
                                    {options.items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.sku} — {item.name} (qty {item.quantity_on_hand})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={moveForm.errors.inventory_item_id} className="mt-1" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Type" />
                                    <select className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" value={moveForm.data.type} onChange={(e) => moveForm.setData('type', e.target.value)}>
                                        {options.types.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value="Quantity" />
                                    <TextInput type="number" step="0.01" className="mt-1 w-full" value={moveForm.data.quantity} onChange={(e) => moveForm.setData('quantity', e.target.value)} />
                                    <InputError message={moveForm.errors.quantity} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Notes" />
                                <textarea className="mt-1 w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800" rows={2} value={moveForm.data.notes} onChange={(e) => moveForm.setData('notes', e.target.value)} />
                            </div>
                            <PrimaryButton disabled={moveForm.processing}>Save movement</PrimaryButton>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
