import React, { useEffect, useMemo, useState } from 'react';
import { Modal, fieldCls, labelCls } from '../common/Modal';
import { Button } from '../ui/Button';
import { CategoryIcon } from '../../data/categoryIcons';
import { useCategories } from '../../hooks/useCategories';
import { createBudget, updateBudget } from '../../services/finance.service';
import { apiErrorMessage } from '../../utils/apiError';
import { formatINR } from '../../utils/money';
import type { Budget, BudgetKind, BudgetPeriod } from '../../types/finance.types';

interface DraftSub {
  subCategoryId: string;
  amount: string;
  existingId?: string;
}
interface DraftLine {
  /** the user's category; absent for an old line that only has a name */
  categoryId?: string;
  legacyName?: string;
  amount: string;
  scoped: boolean;
  subs: DraftSub[];
  existingId?: string;
}

interface Props {
  open: boolean;
  budget?: Budget | null;
  onClose: () => void;
  onSaved: (b: Budget) => void;
}

const PERIODS: BudgetPeriod[] = ['WEEKLY', 'MONTHLY', 'YEARLY'];
const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const toDraft = (b?: Budget | null): DraftLine[] => {
  if (!b) return [];
  const all = b.categories ?? [];
  return all
    .filter((c) => !c.parentCategoryId)
    .map((top) => ({
      existingId: top.id,
      categoryId: top.categoryId ?? undefined,
      legacyName: top.categoryId ? undefined : top.name,
      amount: String(top.allottedAmount),
      scoped: !!top.scopedToSubCategories,
      subs: all
        .filter((s) => s.parentCategoryId === top.id && s.subCategoryId)
        .map((s) => ({ subCategoryId: s.subCategoryId as string, amount: String(s.allottedAmount), existingId: s.id })),
    }));
};

export const BudgetFormModal: React.FC<Props> = ({ open, budget, onClose, onSaved }) => {
  const editing = !!budget;
  const { categories, initialLoading: catsLoading } = useCategories({ type: 'EXPENSE' });
  const active = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<BudgetKind>('RECURRING');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(budget?.title ?? '');
    setAmount(budget ? String(budget.amount) : '');
    setKind(budget?.budgetType ?? 'RECURRING');
    setPeriod(budget?.period ?? 'MONTHLY');
    setStart((budget?.startDate ?? new Date().toISOString()).slice(0, 10));
    setEnd(budget?.endDate ? budget.endDate.slice(0, 10) : '');
    setLines(toDraft(budget));
    setError('');
    setTouched(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, budget]);

  const total = Number(amount) || 0;
  const allocated = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const problems: string[] = [];
  if (!name.trim()) problems.push('Give the budget a name.');
  if (!(total > 0)) problems.push('Enter a total amount greater than zero.');
  if (!start) problems.push('Pick a start date.');
  if (kind === 'ONE_TIME' && !end) problems.push('A one-time budget needs an end date.');
  if (end && start && end < start) problems.push('The end date is before the start date.');
  if (allocated > total + 0.001) problems.push(`Category amounts (${formatINR(allocated)}) are more than the total (${formatINR(total)}).`);
  for (const l of lines) {
    const label = l.categoryId ? active.find((c) => c.id === l.categoryId)?.name ?? categories.find((c) => c.id === l.categoryId)?.name : l.legacyName;
    const subTotal = l.subs.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    if (l.scoped && l.subs.length === 0) problems.push(`Pick at least one subcategory for ${label}, or turn off “track subcategories”.`);
    if (subTotal > (Number(l.amount) || 0) + 0.001) problems.push(`Subcategory amounts exceed ${label}’s amount.`);
  }

  const toggleCategory = (id: string) =>
    setLines((prev) => (prev.some((l) => l.categoryId === id) ? prev.filter((l) => l.categoryId !== id) : [...prev, { categoryId: id, amount: '', scoped: false, subs: [] }]));
  const patch = (key: DraftLine, p: Partial<DraftLine>) => setLines((prev) => prev.map((l) => (l === key ? { ...l, ...p } : l)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (problems.length) return;
    setBusy(true);
    setError('');
    try {
      const common = {
        title: name.trim(),
        amount: total,
        budgetType: kind,
        ...(kind === 'RECURRING' ? { period } : {}),
        startDate: new Date(`${start}T00:00:00`).toISOString(),
        ...(end ? { endDate: new Date(`${end}T23:59:59`).toISOString() } : {}),
      };
      let saved: Budget;
      if (!budget) {
        saved = await createBudget({
          ...common,
          categories: lines.map((l) => ({
            categoryId: l.categoryId,
            allottedAmount: Number(l.amount) || 0,
            scopedToSubCategories: l.scoped,
            ...(l.subs.length ? { subCategories: l.subs.map((s) => ({ subCategoryId: s.subCategoryId, allottedAmount: Number(s.amount) || 0 })) } : {}),
          })) as never,
        });
      } else {
        // Pass 1: lines (brand-new lines get their real ids back).
        const flatTop = lines.map((l) => ({
          ...(l.existingId ? { id: l.existingId } : {}),
          ...(l.categoryId ? { categoryId: l.categoryId } : { name: l.legacyName }),
          allottedAmount: Number(l.amount) || 0,
          scopedToSubCategories: l.scoped,
        }));
        const keepSubs = (parentOf: (l: DraftLine) => string | undefined) =>
          lines.flatMap((l) => {
            const parent = parentOf(l);
            return parent
              ? l.subs.map((s) => ({ ...(s.existingId ? { id: s.existingId } : {}), subCategoryId: s.subCategoryId, allottedAmount: Number(s.amount) || 0, parentCategoryId: parent }))
              : [];
          });
        const firstSubs = keepSubs((l) => l.existingId);
        saved = await updateBudget(budget.id, { ...common, categories: [...flatTop, ...firstSubs] as never });
        const newLinesWithSubs = lines.filter((l) => !l.existingId && l.subs.length);
        if (newLinesWithSubs.length) {
          // Pass 2: now that the new lines exist, attach their subcategories.
          const idByCategory = new Map((saved.categories ?? []).filter((c) => !c.parentCategoryId && c.categoryId).map((c) => [c.categoryId as string, c.id]));
          const full = [
            ...(saved.categories ?? []).filter((c) => !c.parentCategoryId).map((c) => ({ id: c.id, ...(c.categoryId ? { categoryId: c.categoryId } : { name: c.name }), allottedAmount: c.allottedAmount, scopedToSubCategories: !!c.scopedToSubCategories })),
            ...(saved.categories ?? []).filter((c) => c.parentCategoryId).map((c) => ({ id: c.id, subCategoryId: c.subCategoryId ?? undefined, name: c.subCategoryId ? undefined : c.name, allottedAmount: c.allottedAmount, parentCategoryId: c.parentCategoryId as string })),
            ...keepSubs((l) => (l.existingId ? undefined : idByCategory.get(l.categoryId ?? ''))),
          ];
          saved = await updateBudget(budget.id, { categories: full as never });
        }
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'We could not save this budget. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={busy} size="lg" title={editing ? 'Edit budget' : 'New budget'}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="bd-name" className={labelCls}>Name</label>
          <input id="bd-name" data-autofocus value={name} maxLength={150} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly household" className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bd-amount" className={labelCls}>Total (₹)</label>
            <input id="bd-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="45000" className={fieldCls} />
          </div>
          <div>
            <label htmlFor="bd-kind" className={labelCls}>Type</label>
            <select id="bd-kind" value={kind} onChange={(e) => setKind(e.target.value as BudgetKind)} className={fieldCls}>
              <option value="RECURRING">Recurring</option>
              <option value="ONE_TIME">One-time</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {kind === 'RECURRING' && (
            <div>
              <label htmlFor="bd-period" className={labelCls}>Repeats</label>
              <select id="bd-period" value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)} className={fieldCls}>
                {PERIODS.map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="bd-start" className={labelCls}>Start</label>
            <input id="bd-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="bd-end" className={labelCls}>End {kind === 'RECURRING' && '(optional)'}</label>
            <input id="bd-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={fieldCls} />
          </div>
        </div>

        <fieldset>
          <div className="mb-2 flex items-center justify-between">
            <legend className={`${labelCls} mb-0`}>Categories</legend>
            <span className={`text-xs tabular-nums ${allocated > total ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>{formatINR(allocated)} of {formatINR(total)} allocated</span>
          </div>
          {catsLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-[var(--color-bg-tertiary)]" />
          ) : active.length === 0 ? (
            <p className="rounded-xl bg-[var(--color-bg-secondary)] p-4 text-sm text-[var(--color-text-secondary)]">You have no expense categories yet. Add some under Finance → Categories first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {active.map((c) => {
                const on = lines.some((l) => l.categoryId === c.id);
                return (
                  <button key={c.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggleCategory(c.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50'}`}>
                    <CategoryIcon icon={c.icon} color={c.color} size={20} /> {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="space-y-3">
          {lines.map((l) => {
            const cat = l.categoryId ? categories.find((c) => c.id === l.categoryId) : undefined;
            const subs = (cat?.subCategories ?? []).filter((s) => s.isActive || l.subs.some((x) => x.subCategoryId === s.id));
            return (
              <div key={l.existingId ?? l.categoryId ?? l.legacyName} className="rounded-xl border border-[var(--color-border-primary)] p-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={cat?.icon} color={cat?.color} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">{cat?.name ?? l.legacyName}</span>
                  <label className="sr-only" htmlFor={`bd-line-${l.categoryId ?? l.legacyName}`}>Amount for {cat?.name ?? l.legacyName}</label>
                  <input id={`bd-line-${l.categoryId ?? l.legacyName}`} inputMode="decimal" value={l.amount} onChange={(e) => patch(l, { amount: e.target.value })} placeholder="₹ amount" className="w-28 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-right text-sm" />
                  <button type="button" aria-label={`Remove ${cat?.name ?? l.legacyName}`} onClick={() => setLines((p) => p.filter((x) => x !== l))} className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error-dark)]">Remove</button>
                </div>
                {cat && subs.length > 0 && (
                  <div className="mt-3 border-t border-dashed border-[var(--color-border-primary)] pt-3">
                    <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <input type="checkbox" checked={l.scoped} onChange={(e) => patch(l, { scoped: e.target.checked, subs: e.target.checked ? l.subs : [] })} />
                      Track specific subcategories only
                    </label>
                    {(l.scoped || l.subs.length > 0) && (
                      <ul className="space-y-1.5 pl-1">
                        {subs.map((s) => {
                          const picked = l.subs.find((x) => x.subCategoryId === s.id);
                          return (
                            <li key={s.id} className="flex items-center gap-2">
                              <input id={`bd-sub-${s.id}`} type="checkbox" checked={!!picked} onChange={(e) => patch(l, { subs: e.target.checked ? [...l.subs, { subCategoryId: s.id, amount: '' }] : l.subs.filter((x) => x.subCategoryId !== s.id) })} />
                              <label htmlFor={`bd-sub-${s.id}`} className="flex-1 text-xs text-[var(--color-text-primary)]">{s.name}</label>
                              <input aria-label={`Amount for ${s.name}`} inputMode="decimal" disabled={!picked} value={picked?.amount ?? ''} onChange={(e) => patch(l, { subs: l.subs.map((x) => (x.subCategoryId === s.id ? { ...x, amount: e.target.value } : x)) })} placeholder="₹" className="w-24 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-right text-xs disabled:opacity-40" />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {touched && problems.length > 0 && (
          <ul role="alert" className="list-disc rounded-lg bg-[var(--color-error-bg)] py-2 pl-7 pr-3 text-xs text-[var(--color-error-dark)]">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        {error && <p role="alert" className="rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-dark)]">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={busy}>{editing ? 'Save budget' : 'Create budget'}</Button>
        </div>
      </form>
    </Modal>
  );
};
