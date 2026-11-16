import type { RangeKey, RangeSelection } from '../types/spending.types';

export const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: 'THIS_WEEK', label: 'This week' },
  { key: 'LAST_WEEK', label: 'Last week' },
  { key: 'THIS_MONTH', label: 'This month' },
  { key: 'LAST_MONTH', label: 'Last month' },
  { key: 'LAST_3_MONTHS', label: 'Last 3 months' },
  { key: 'LAST_6_MONTHS', label: 'Last 6 months' },
  { key: 'THIS_YEAR', label: 'This year' },
  { key: 'CUSTOM', label: 'Custom range' },
];

const KEYS = new Set<string>(RANGE_OPTIONS.map((o) => o.key));
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Query-string params for the API (and the URL) from a selection. Custom needs both dates. */
export function rangeParams(sel: RangeSelection): Record<string, string> {
  if (sel.range === 'CUSTOM') return sel.from && sel.to ? { range: 'CUSTOM', from: sel.from, to: sel.to } : { range: 'THIS_MONTH' };
  return { range: sel.range };
}

export function selectionFromSearch(sp: URLSearchParams, fallback: RangeKey = 'THIS_MONTH'): RangeSelection {
  const r = sp.get('range') ?? '';
  const range = (KEYS.has(r) ? r : fallback) as RangeKey;
  if (range !== 'CUSTOM') return { range };
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  return DATE.test(from) && DATE.test(to) && from <= to ? { range, from, to } : { range: fallback };
}

export const rangeCacheKey = (sel: RangeSelection) => JSON.stringify(rangeParams(sel));
