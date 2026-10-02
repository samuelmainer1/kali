import { waDigits } from './brand';

export const WHATSAPP_NUMBER = '254722359298';

export function waLink(text = '', number) {
  const base = `https://wa.me/${waDigits(number || WHATSAPP_NUMBER)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
