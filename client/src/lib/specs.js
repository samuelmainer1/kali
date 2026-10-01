export function specsToText(specs) {
  if (!Array.isArray(specs)) {
    if (typeof specs === 'string') return specs;
    return '';
  }
  return specs
    .filter((s) => s && (s.name || s.value))
    .map((s) => `${s.name || ''}: ${s.value || ''}`.trim())
    .join('\n');
}

export function parseSpecs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        if (typeof s === 'string') return parseLine(s);
        return { name: String(s?.name || '').trim(), value: String(s?.value || '').trim() };
      })
      .filter((s) => s && s.name && s.value);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        return parseSpecs(JSON.parse(trimmed));
      } catch {
        /* fall through */
      }
    }
    return trimmed
      .split(/\r?\n/)
      .map((line) => parseLine(line.replace(/^[\s•\-\*]+/, '')))
      .filter(Boolean);
  }
  return [];
}

function parseLine(line) {
  const text = String(line || '').trim();
  if (!text) return null;
  const idx = text.search(/[:\-–—=]/);
  if (idx < 0) return { name: 'Detail', value: text };
  const name = text.slice(0, idx).trim();
  const value = text.slice(idx + 1).replace(/^[\s:\-–—=]+/, '').trim();
  if (!name || !value) return null;
  return { name, value };
}

export function variantsToText(variants) {
  if (!Array.isArray(variants) || !variants.length) return '';
  return variants.map((v) => `${v.name}: ${(v.options || []).join(', ')}`).join('\n');
}
