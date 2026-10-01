import { useOutletContext } from 'react-router-dom';
import { brandFromSite } from '../lib/brand';

export function useBrand() {
  const ctx = useOutletContext() || {};
  return brandFromSite(ctx.site);
}
