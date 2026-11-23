import React, { useState } from 'react';
import { Archive, ArchiveRestore, ChevronDown, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../../data/categoryIcons';
import { TransactionItem } from '../finance/TransactionItem';
import { useApi } from '../../hooks/useApi';
import { categoryKey, useCategories } from '../../hooks/useCategories';
import { getBudgetDetailInsight } from '../../services/spending.service';
import { getBudgetTransactions } from '../../services/finance.service';
import { formatINR } from '../../utils/money';
import type { BudgetDetailInsight, BudgetStatus } from '../../types/spending.types';
import type { Transaction } from '../../types/finance.types';

export const STATUS_STYLE: Record<BudgetStatus, { label: string; cls: string; bar: string }> = {
  ON_TRACK: { label: 'On track', cls: 'border-[var(--color-success-dark)] text-[var(--color-success-dark)]', bar: 'var(--color-primary)' },
  NEAR_LIMIT: { label: 'Near limit', cls: 'border-[var(--color-warning-dark,#b45309)] text-[var(--color-warning-dark,#b45309)]', bar: 'var(--color-warning-dark,#d97706)' },
  EXCEEDED: { label: 'Over budget', cls: 'border-[var(--color-error)] text-[var(--color-error-dark)]', bar: 'var(--color-error-dark)' },
};

export const dateShort = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const ProgressBar: React.FC<{ pct: number; color: string; label: string; height?: number }> = ({ pct, color, label, height = 7 }) => (
  <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(pct))} className="w-full overflow-hidden rounded-full bg-[var(--color-white-light,var(--color-bg-tertiary))]" style={{ height }}>
    <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }} />
  </div>
);

interface Props {
  budgetId: string;
  onEdit: () => void;
  onToggleArchive: (archive: boolean) => void;
  onDelete: () => void;
  onAddExpense: () => void;
  onEditTransaction: (t: Transaction) => void;
}

export const BudgetDetailPanel: React.FC<Props> = ({ budgetId, onEdit, onToggleArchive, onDelete, onAddExpense, onEditTransaction }) => {
  const { data, initialLoading, error, reload } = useApi<BudgetDetailInsight>(`insights/budget/${budgetId}`, () => getBudgetDetailInsight(budgetId));
  const { byName, forTransaction } = useCategories({ includeArchived: true });
  const [openLine, setOpenLine] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const txApi = useApi(`tx/budget/${budgetId}/${page}`, () => getBudgetTransactions(budgetId, { page, limit: 10 }));

  if (initialLoading) return <div aria-busy="true" aria-label="Loading budget" className="h-96 animate-pulse rounded-[8px] bg-[var(--color-bg-tertiary)]" />;
  if (error && !data) {
    return (
      <div role="alert" className="rounded-[8px] border border-[var(--color-error-dark)]/30 bg-[var(--color-error-bg)] p-6 text-center">
        <p className="mb-3 text-sm font-medium text-[var(--color-error-dark)]">We couldn’t load this budget.</p>
        <Button variant="outline" onClick={reload}>Try again</Button>
      </div>
    );
  }
  if (!data) return null;
  const b = data;
  const st = STATUS_STYLE[b.status];
  const archived = !b.isActive;
  const over = b.overBy > 0;
  const trend = b.dailyTrend.map((d) => ({ day: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), spent: d.spent }));

  return (
    <div className="flex flex-col gap-5 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="truncate font-grotesque text-[24px] font-medium text-[var(--color-black-mid)]">{b.name}</h2>
            {archived ? (
              <span className="rounded-full border border-[var(--color-border-primary)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">Archived</span>
            ) : (
              <span className={`rounded-full border px-3 py-1 text-xs ${st.cls}`}>{st.label}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-grey-darkest,var(--color-text-secondary))]">
            {b.type === 'RECURRING' ? `${b.frequency?.[0]}${b.frequency?.slice(1).toLowerCase()} · ` : 'One-time · '}
            {dateShort(b.periodStart)} – {dateShort(b.periodEnd)}
            {b.daysRemaining !== null && b.lifecycle === 'ACTIVE' ? ` · ${b.daysRemaining} day${b.daysRemaining === 1 ? '' : 's'} left` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
          {!archived && <Button size="sm" onClick={onAddExpense}><Plus className="mr-1 h-4 w-4" /> Add expense</Button>}
          <Button variant="outline" size="sm" onClick={() => onToggleArchive(!archived)} aria-label={archived ? 'Restore budget' : 'Archive budget'}>
            {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} aria-label="Delete budget"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {!archived && b.status !== 'ON_TRACK' && (
        <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${b.status === 'EXCEEDED' ? 'border-[var(--color-error)]/40 bg-[var(--color-error-bg)] text-[var(--color-error-dark)]' : 'border-[var(--color-warning-dark,#d97706)]/40 bg-[var(--color-warning-bg,#fffbeb)] text-[var(--color-warning-dark,#b45309)]'}`}>
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {b.status === 'EXCEEDED'
              ? <>You’re over this budget by <strong>{formatINR(b.overBy)}</strong> ({Math.round(b.utilisationPct)}% used).</>
              : <>You’ve used <strong>{Math.round(b.utilisationPct)}%</strong> of this budget — {formatINR(b.remainingAmount)} left{b.daysRemaining !== null ? ` for ${b.daysRemaining} more day${b.daysRemaining === 1 ? '' : 's'}` : ''}.</>}
            {b.projectedSpend !== null && b.status === 'NEAR_LIMIT' && b.projectedSpend > b.budgetAmount && <> At this pace you’d spend about {formatINR(b.projectedSpend)}.</>}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--color-border-primary)] bg-[var(--color-border-primary)] sm:grid-cols-4">
        {[
          ['Allocated', formatINR(b.budgetAmount)],
          ['Spent', formatINR(b.currentSpending)],
          [over ? 'Over by' : 'Remaining', formatINR(over ? b.overBy : b.remainingAmount)],
          ['Transactions', String(b.transactionCount)],
        ].map(([k, v]) => (
          <div key={k} className="bg-[var(--color-bg-card)] p-4 text-center">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">{k}</dt>
            <dd className={`mt-1 text-[20px] tabular-nums ${k === 'Over by' ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-black-mid)]'}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-[var(--color-text-secondary)]"><span>Progress</span><span className="tabular-nums">{Math.round(b.utilisationPct)}%</span></div>
        <ProgressBar pct={b.utilisationPct} color={st.bar} label="Budget used" height={9} />
      </div>

      {!archived && b.lifecycle === 'ACTIVE' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Daily average', formatINR(b.dailyAverage)],
            ['Projected by period end', b.projectedSpend === null ? '—' : formatINR(b.projectedSpend)],
            ['Safe to spend per day', b.safeDailySpend === null ? '—' : formatINR(b.safeDailySpend)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--color-bg-secondary)] p-3">
              <p className="text-xs text-[var(--color-text-secondary)]">{k}</p>
              <p className="mt-0.5 text-[17px] font-medium tabular-nums text-[var(--color-text-primary)]">{v}</p>
            </div>
          ))}
        </div>
      )}

      <section aria-label="Categories in this budget" className="flex flex-col gap-3">
        <h3 className="font-grotesque text-[16px] font-medium text-[var(--color-black-mid)]">Categories</h3>
        {b.lines.length === 0 && <p className="rounded-xl border border-[var(--color-border-primary)] p-4 text-sm text-[var(--color-text-secondary)]">This budget has no categories yet. Edit it to add some.</p>}
        {b.lines.map((l) => {
          const cat = byName.get(categoryKey('EXPENSE', l.name));
          const lst = l.utilisationPct >= 100 ? STATUS_STYLE.EXCEEDED : l.utilisationPct >= 80 ? STATUS_STYLE.NEAR_LIMIT : STATUS_STYLE.ON_TRACK;
          const open = openLine === l.lineId;
          return (
            <div key={l.lineId} className="rounded-xl border border-[var(--color-border-primary)] p-3.5">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={cat?.icon ?? l.icon} color={cat?.color ?? l.color} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-grotesque text-[15px] font-medium text-[var(--color-black-dark)]">{l.name}{l.scopedToSubCategories && <span className="ml-2 text-[10px] font-semibold uppercase text-[var(--color-text-tertiary)]">Subcategories only</span>}</p>
                    <p className="shrink-0 text-sm tabular-nums text-[var(--color-text-secondary)]">{formatINR(l.spent)} / {formatINR(l.allocated)}</p>
                  </div>
                  <div className="mt-1.5"><ProgressBar pct={l.utilisationPct} color={lst.bar} label={`${l.name} used`} /></div>
                  <p className={`mt-1 text-xs ${l.remaining < 0 ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>
                    {l.remaining < 0 ? `Over by ${formatINR(-l.remaining)}` : `${formatINR(l.remaining)} left`} · {l.transactionCount} transaction{l.transactionCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              {l.subCategories.length > 0 && (
                <>
                  <button type="button" aria-expanded={open} onClick={() => setOpenLine(open ? null : l.lineId)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
                    {open ? 'Hide' : 'Show'} {l.subCategories.length} subcategor{l.subCategories.length === 1 ? 'y' : 'ies'}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <ul className="mt-3 space-y-3 border-t border-dashed border-[var(--color-border-primary)] pt-3">
                      {l.subCategories.map((s) => (
                        <li key={s.lineId}>
                          <div className="flex justify-between text-sm"><span className="text-[var(--color-text-primary)]">{s.name}</span><span className="tabular-nums text-[var(--color-text-secondary)]">{formatINR(s.spent)} / {formatINR(s.allocated)}</span></div>
                          <div className="mt-1"><ProgressBar pct={s.utilisationPct} color={s.utilisationPct >= 100 ? STATUS_STYLE.EXCEEDED.bar : 'var(--color-primary)'} label={`${s.name} used`} height={5} /></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </section>

      {trend.length > 1 && (
        <section aria-label="Daily spending" className="flex flex-col gap-2">
          <h3 className="font-grotesque text-[16px] font-medium text-[var(--color-black-mid)]">Spending this period</h3>
          <div className="h-48" role="img" aria-label={`Daily spending chart for ${b.name}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-primary)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} width={40} />
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Bar dataKey="spent" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {b.type === 'RECURRING' && b.history.length > 1 && (
        <section aria-label="Past periods" className="flex flex-col gap-2">
          <h3 className="font-grotesque text-[16px] font-medium text-[var(--color-black-mid)]">Past periods</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-[var(--color-text-secondary)]"><th className="py-1.5 pr-3 font-medium">Period</th><th className="py-1.5 pr-3 text-right font-medium">Spent</th><th className="py-1.5 pr-3 text-right font-medium">Of</th><th className="py-1.5 text-right font-medium">Used</th></tr></thead>
              <tbody>
                {b.history.map((h) => (
                  <tr key={h.periodStart} className="border-t border-[var(--color-border-primary)]">
                    <td className="py-2 pr-3">{dateShort(h.periodStart)}{h.isCurrent && <span className="ml-2 text-xs text-[var(--color-primary)]">current</span>}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatINR(h.spent)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[var(--color-text-secondary)]">{formatINR(h.allocated)}</td>
                    <td className={`py-2 text-right tabular-nums ${h.status === 'EXCEEDED' ? 'text-[var(--color-error-dark)]' : ''}`}>{Math.round(h.utilisationPct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-label="Transactions in this budget" className="flex flex-col gap-2">
        <h3 className="font-grotesque text-[16px] font-medium text-[var(--color-black-mid)]">Transactions</h3>
        {txApi.initialLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />
        ) : txApi.error != null && !txApi.data ? (
          <p role="alert" className="text-sm text-[var(--color-error-dark)]">Couldn’t load transactions. <button className="font-semibold underline" onClick={txApi.reload}>Retry</button></p>
        ) : !txApi.data || txApi.data.transactions.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border-primary)] p-4 text-sm text-[var(--color-text-secondary)]">No transactions count towards this budget in this period yet.</p>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border-primary)]">
              {txApi.data.transactions.map((t) => (
                <TransactionItem key={t.id} transaction={t} meta={forTransaction(t)} onEdit={onEditTransaction} />
              ))}
            </div>
            {(page > 1 || txApi.data.hasMore) && (
              <div className="flex items-center justify-between pt-1 text-sm">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-xs text-[var(--color-text-tertiary)]">Page {page}</span>
                <Button variant="ghost" size="sm" disabled={!txApi.data.hasMore} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
