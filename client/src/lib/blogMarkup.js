export function safeHttpUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.href;
  } catch {
    return '';
  }
}

export function parseInline(text) {
  const input = String(text || '');
  const parts = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(input))) {
    if (m.index > last) parts.push({ type: 'text', value: input.slice(last, m.index) });
    const href = safeHttpUrl(m[2]);
    if (href) parts.push({ type: 'link', href, label: m[1] });
    else parts.push({ type: 'text', value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < input.length) parts.push({ type: 'text', value: input.slice(last) });
  return parts.length ? parts : [{ type: 'text', value: input }];
}

export function parseBlogBlocks(content) {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const button = line.match(/^\[button:\s*([^\]]+)\]\((https?:\/\/[^)]+)\)\s*$/i);
    if (button) {
      const href = safeHttpUrl(button[2]);
      if (href) blocks.push({ type: 'button', label: button[1].trim(), href });
      else blocks.push({ type: 'paragraph', parts: parseInline(line) });
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        parts: parseInline(heading[2].trim()),
      });
      i += 1;
      continue;
    }

    if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', parts: parseInline(quote.join(' ').trim()) });
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('>') &&
      !/^#{2,4}\s/.test(lines[i]) &&
      !/^\[button:/i.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'paragraph', parts: parseInline(para.join(' ')) });
  }
  return blocks;
}
