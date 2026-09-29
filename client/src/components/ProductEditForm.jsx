import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { specsToText, variantsToText } from '../lib/specs';
import ProductImagesField from './ProductImagesField';

export default function ProductEditForm({ product, categories = [], vendors = [], onClose, onSaved, allowName = true }) {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    specifications: specsToText(product.specifications),
    price: product.price ?? '',
    compareAt: product.compareAt ?? '',
    stock: product.stock ?? 0,
    categoryId: product.categoryId || categories[0]?.id || '',
    vendorId: product.vendorId || vendors[0]?.id || '',
    sku: product.sku || '',
    brand: product.brand || '',
    images: product.images || [],
    variants: variantsToText(product.variants),
    featured: Boolean(product.featured),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        specifications: form.specifications,
        price: Number(form.price),
        compareAt: form.compareAt === '' ? null : Number(form.compareAt),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        sku: form.sku || undefined,
        brand: form.brand || undefined,
        variants: form.variants,
        featured: Boolean(form.featured),
      };
      // Only admins editing from the dashboard get the vendor list; their choice
      // reassigns the product. Vendors editing their own products omit it.
      if (vendors.length) payload.vendorId = form.vendorId || undefined;
      if (form.images?.length) payload.images = form.images.slice(0, 3);
      const data = await api.patch(`/products/${product.id}`, payload);
      onSaved(data.product);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-display text-xl font-bold">Edit product</h2>
        <p className="mt-1 text-xs text-ink-mute">
          Was / now: set Compare-at (was) higher than Price (now) to show a sale badge.
        </p>
        {error && <p className="mt-3 text-sm text-ember">{error}</p>}

        {allowName && (
          <>
            <label className="mt-4 block text-sm">
              <span className="text-ink-mute">Name</span>
              <input required value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-ink-mute">Description</span>
              <textarea required rows={3} value={form.description} onChange={set('description')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
            </label>
            {vendors.length > 0 && (
              <label className="mt-3 block text-sm">
                <span className="text-ink-mute">Vendor store</span>
                <select value={form.vendorId} onChange={set('vendorId')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.storeName || v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="mt-3 block text-sm">
              <span className="text-ink-mute">Specifications</span>
              <textarea
                rows={4}
                value={form.specifications}
                onChange={set('specifications')}
                placeholder={'Brand: Samsung\nScreen: 43 inch\nWarranty: 12 months'}
                className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
              />
              <span className="mt-1 block text-xs text-ink-mute">One per line as Label: Value</span>
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-ink-mute">Variants (optional)</span>
              <textarea
                rows={3}
                value={form.variants}
                onChange={set('variants')}
                placeholder={'Size: S, M, L\nColour: Black, White'}
                className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
              />
              <span className="mt-1 block text-xs text-ink-mute">One per line as Name: option, option</span>
            </label>
          </>
        )}

        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-ink-mute">Price now (KES)</span>
            <input required type="number" min="1" value={form.price} onChange={set('price')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">Was / compare-at</span>
            <input type="number" min="0" value={form.compareAt} onChange={set('compareAt')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" placeholder="Optional" />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-ink-mute">Stock</span>
            <input required type="number" min="0" value={form.stock} onChange={set('stock')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">SKU</span>
            <input
              value={form.sku}
              onChange={set('sku')}
              placeholder="Leave blank to auto-generate"
              className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
            />
          </label>
        </div>
        {allowName && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-ink-mute">Brand</span>
              <input value={form.brand} onChange={set('brand')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
            </label>
            <label className="block text-sm">
              <span className="text-ink-mute">Category</span>
              <select value={form.categoryId} onChange={set('categoryId')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-ink/10 p-3 bg-mist/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 rounded border-ink/20 text-ember focus:ring-ember"
            />
            <div>
              <span className="text-sm font-semibold block text-ink">Feature on Homepage</span>
              <span className="text-xs text-ink-mute block">Display this product in the "Featured Products" section on the front page.</span>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <ProductImagesField images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-ink/10 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-ember py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
