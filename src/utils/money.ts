/** Indian-grouped rupee amount, e.g. ₹1,23,456 (whole rupees) — the same style the rest of the app uses. */
export function formatINR(n: number | null | undefined, opts: { paise?: boolean } = {}): string {
  const v = Number(n ?? 0);
  const abs = Math.abs(v);
  const body = opts.paise
    ? abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(abs).toLocaleString('en-IN');
  return `${v < 0 ? '−' : ''}₹${body}`;
}

/** "+12%" / "−8%" / "—" when there is nothing to compare with (server sends null). */
export function formatChange(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—';
  const r = Math.round(pct);
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}%`;
}

export const formatPct = (pct: number | null | undefined) => `${Math.round(pct ?? 0)}%`;
