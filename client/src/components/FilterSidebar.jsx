import { useLang } from '../context/LangContext';

export default function FilterSidebar({
  brands = [],
  selectedBrands = [],
  onBrandToggle,
  minP,
  maxP,
  onMinP,
  onMaxP,
  priceLo = 0,
  priceHi = 100000,
  minR = '0',
  onMinR,
  dealOnly = false,
  onDealOnly,
  onClear,
  activeFilterCount = 0,
}) {
  const lo = Number(priceLo) || 0;
  const hi = Math.max(lo + 1, Number(priceHi) || 100000);
  const { t } = useLang();
  const minVal = minP === '' || minP == null ? lo : Math.min(hi, Math.max(lo, Number(minP) || lo));
  const maxVal = maxP === '' || maxP == null ? hi : Math.min(hi, Math.max(lo, Number(maxP) || hi));

  function onSlideMin(e) {
    const v = Number(e.target.value);
    onMinP?.(String(Math.min(v, maxVal)));
  }
  function onSlideMax(e) {
    const v = Number(e.target.value);
    onMaxP?.(String(Math.max(v, minVal)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{t('filters')}</h3>
        {activeFilterCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs text-orange-500 hover:underline">
            {t('clearAll')}
          </button>
        )}
      </div>
      <div className="border-t border-gray-200" />

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('priceRange')}</h4>
        <div className="relative h-8 mb-2">
          <input
            type="range"
            min={lo}
            max={hi}
            value={minVal}
            onChange={onSlideMin}
            className="absolute w-full accent-[#015837]"
            aria-label="Minimum price"
          />
          <input
            type="range"
            min={lo}
            max={hi}
            value={maxVal}
            onChange={onSlideMax}
            className="absolute w-full accent-orange-500"
            aria-label="Maximum price"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={minP}
            onChange={(e) => onMinP?.(e.target.value)}
            placeholder={t('min')}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none focus:border-orange-500"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min="0"
            value={maxP}
            onChange={(e) => onMaxP?.(e.target.value)}
            placeholder={t('max')}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm outline-none focus:border-orange-500"
          />
        </div>
      </div>
      <div className="border-t border-gray-200" />

      {brands.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('brand')}</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((b) => (
                <label key={b} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => onBrandToggle?.(b)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200" />
        </>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('rating')}</h4>
        <div className="space-y-2">
          {[
            { v: '0', label: t('anyRating') },
            { v: '4', label: '4★ & above' },
            { v: '3', label: '3★ & above' },
            { v: '2', label: '2★ & above' },
            { v: '1', label: '1★ & above' },
          ].map((opt) => (
            <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="min-rating"
                checked={String(minR) === opt.v}
                onChange={() => onMinR?.(opt.v)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200" />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={dealOnly}
          onChange={(e) => onDealOnly?.(e.target.checked)}
          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-sm text-gray-700">{t('dealsOnly')}</span>
      </label>
    </div>
  );
}
