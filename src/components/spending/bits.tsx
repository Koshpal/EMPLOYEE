import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatChange } from '../../utils/money';

/** ▲/▼ change vs the previous period. For spending, up is "bad" (red) and down "good" (green). */
export const Change: React.FC<{ pct: number | null | undefined; upIsGood?: boolean }> = ({ pct, upIsGood = false }) => {
  if (pct === null || pct === undefined) return <span className="text-xs text-[var(--color-text-tertiary)]" title="Nothing to compare with in the previous period">—</span>;
  const up = pct > 0;
  const flat = Math.round(pct) === 0;
  const good = flat ? null : up === upIsGood;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const cls = good === null ? 'text-[var(--color-text-secondary)]' : good ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-error-dark)]';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {formatChange(pct)}
      <span className="sr-only"> compared with the previous period</span>
    </span>
  );
};

export const Card: React.FC<React.PropsWithChildren<{ title?: string; className?: string; aside?: React.ReactNode }>> = ({ title, className = '', aside, children }) => (
  <section className={`rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] ${className}`}>
    {(title || aside) && (
      <div className="mb-3 flex items-center justify-between gap-3">
        {title && <h3 className="font-grotesque text-[16px] font-medium text-[var(--color-black-mid)]">{title}</h3>}
        {aside}
      </div>
    )}
    {children}
  </section>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="rounded-xl bg-[var(--color-bg-secondary)] p-3.5">
    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
    <p className="mt-1 text-[20px] font-medium tabular-nums text-[var(--color-text-primary)]">{value}</p>
    {sub && <div className="mt-0.5">{sub}</div>}
  </div>
);

export const LoadBlock: React.FC<{ height?: number; label: string }> = ({ height = 200, label }) => (
  <div aria-busy="true" aria-label={label} className="animate-pulse rounded-[8px] bg-[var(--color-bg-tertiary)]" style={{ height }} />
);

export const ErrorBlock: React.FC<{ what: string; onRetry: () => void }> = ({ what, onRetry }) => (
  <div role="alert" className="rounded-[8px] border border-[var(--color-error-dark)]/30 bg-[var(--color-error-bg)] p-6 text-center">
    <p className="mb-3 text-sm font-medium text-[var(--color-error-dark)]">We couldn’t load {what}.</p>
    <Button variant="outline" onClick={onRetry}>Try again</Button>
  </div>
);

export const EmptyBlock: React.FC<{ title: string; body: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="rounded-[8px] bg-[var(--color-bg-card)] px-6 py-12 text-center shadow-[var(--shadow-drop-low)]">
    <h3 className="font-heading text-[17px] font-semibold text-[var(--color-text-primary)]">{title}</h3>
    <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">{body}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
