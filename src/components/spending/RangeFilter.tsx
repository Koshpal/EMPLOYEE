import React, { useState } from 'react';
import { RANGE_OPTIONS } from '../../utils/range';
import type { RangeKey, RangeSelection } from '../../types/spending.types';

interface Props {
  value: RangeSelection;
  onChange: (next: RangeSelection) => void;
}

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Preset ranges + a custom from/to. A custom range is only applied once it is valid (from ≤ to). */
export const RangeFilter: React.FC<Props> = ({ value, onChange }) => {
  const [from, setFrom] = useState(value.from ?? '');
  const [to, setTo] = useState(value.to ?? '');
  // "Custom" stays selected while the dates are incomplete; the page keeps its previous data until both are valid.
  const [custom, setCustom] = useState(value.range === 'CUSTOM');
  const invalid = !!from && !!to && from > to;

  function pick(range: RangeKey) {
    setCustom(range === 'CUSTOM');
    if (range !== 'CUSTOM') return onChange({ range });
    if (from && to && from <= to) onChange({ range, from, to });
  }
  function setDates(f: string, t: string) {
    setFrom(f);
    setTo(t);
    if (f && t && f <= t) onChange({ range: 'CUSTOM', from: f, to: t });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="range-select" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Period</label>
        <select id="range-select" value={custom ? 'CUSTOM' : value.range} onChange={(e) => pick(e.target.value as RangeKey)} className="h-10 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 text-sm">
          {RANGE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>
      {custom && (
        <>
          <div>
            <label htmlFor="range-from" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">From</label>
            <input id="range-from" type="date" value={from} max={to || today()} onChange={(e) => setDates(e.target.value, to)} className="h-10 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="range-to" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">To</label>
            <input id="range-to" type="date" value={to} min={from || undefined} max={today()} onChange={(e) => setDates(from, e.target.value)} className="h-10 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 text-sm" />
          </div>
          {invalid && <p role="alert" className="pb-2 text-xs text-[var(--color-error-dark)]">The start date is after the end date.</p>}
          {!invalid && (!from || !to) && <p className="pb-2 text-xs text-[var(--color-text-tertiary)]">Pick both dates to apply.</p>}
        </>
      )}
    </div>
  );
};
