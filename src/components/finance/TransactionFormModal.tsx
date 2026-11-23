import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { Modal, fieldCls, labelCls } from '../common/Modal';
import { Button } from '../ui/Button';
import { useApi } from '../../hooks/useApi';
import { nameKey, useCategories } from '../../hooks/useCategories';
import { createTransaction, getBudgets, updateTransaction } from '../../services/finance.service';
import { createCategory } from '../../services/category.service';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/apiError';
import type { Budget, BudgetCategoryRow, Transaction } from '../../types/finance.types';
import type { CategoryType } from '../../types/spending.types';

interface Props {
  open: boolean;
  /** Edit this transaction; omit to record a new manual one. */
  transaction?: Transaction | null;
  /** Pre-select a budget (e.g. "Add expense" from a budget page). */
  defaultBudgetId?: string | null;
  onClose: () => void;
  onSaved?: (tx: Transaction) => void;
}

const MODES = [
  ['UPI', 'UPI'], ['DEBIT_CARD', 'Debit card'], ['CREDIT_CARD', 'Credit card'],
  ['NET_BANKING', 'Net banking'], ['WALLET', 'Wallet'], ['CASH', 'Cash'], ['OTHER', 'Other'],
] as const;

const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const dateOnly = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Does a budget's window contain this yyyy-mm-dd? (Recurring budgets with no end date run forever.) */
function budgetCoversDay(b: Budget, day: string): boolean {
  const d = new Date(`${day}T12:00:00`).getTime();
  if (new Date(b.startDate).getTime() > d + 12 * 3600_000) return false;
  if (b.endDate && new Date(b.endDate).getTime() < d - 12 * 3600_000) return false;
  return true;
}

export const TransactionFormModal: React.FC<Props> = ({ open, transaction, defaultBudgetId, onClose, onSaved }) => {
  const toast = useToast();
  const editing = !!transaction;
  // Facts reported by the bank / SMS can't be rewritten — only how they're filed.
  const factsLocked = editing && transaction!.origin !== 'MANUAL';

  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState('');
  // The category / sub-category are held (and sent) by NAME — the user's library names are unique.
  const [categoryName, setCategoryName] = useState('');
  const [subName, setSubName] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [lineId, setLineId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [quickName, setQuickName] = useState<string | null>(null);
  const [quickBusy, setQuickBusy] = useState(false);

  const { categories, initialLoading: catsLoading, error: catsError, reload: reloadCats } = useCategories({ type });
  const budgetsApi = useApi<Budget[]>(open ? 'budgets?active=true&forForm' : null, () => getBudgets({ isActive: true }));
  const budgets = useMemo(() => (budgetsApi.data ?? []).filter((b) => b.isActive !== false), [budgetsApi.data]);

  useEffect(() => {
    if (!open) return;
    const t = transaction;
    /* eslint-disable react-hooks/set-state-in-effect */
    setType(t ? (t.type === 'INCOME' ? 'INCOME' : 'EXPENSE') : 'EXPENSE');
    setAmount(t ? String(t.amount) : '');
    setDate(t ? dateOnly(t.transactionDate) : todayLocal());
    setTitle(t?.description ?? t?.receiverName ?? t?.senderName ?? '');
    setNotes(t?.notes ?? '');
    setMode(t?.mode ?? '');
    setCategoryName(!t || !t.category || nameKey(t.category) === 'uncategorized' ? '' : t.category);
    setSubName(t?.subCategory ?? '');
    setBudgetId(t?.budgetId ?? defaultBudgetId ?? '');
    // Left on "Same as category": the transaction's category decides which budget line it counts against.
    setLineId('');
    setError('');
    setTouched(false);
    setQuickName(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, transaction, defaultBudgetId]);

  // ── budget lines ──────────────────────────────────────────────────────────
  // By default a transaction counts against the budget line for ITS OWN category, and the budget gains
  // that category (₹0 allocation) if it doesn't have it yet. Naming a budget category explicitly
  // overrides that: the line then decides the category.
  // Every active budget is offered (the server accepts a user-chosen budget whatever its dates);
  // ones whose period doesn't include the transaction date are labelled in the dropdown.
  const eligibleBudgets = useMemo(() => (type === 'EXPENSE' ? budgets : []), [budgets, type]);
  const budget = eligibleBudgets.find((b) => b.id === budgetId) ?? null;
  const lines = useMemo(() => (budget?.categories ?? []).filter((c) => !c.parentCategoryId), [budget]);
  const chosenLine: BudgetCategoryRow | null = budget ? lines.find((l) => l.id === lineId) ?? null : null;
  const lockedCategory = chosenLine?.name ?? '';
  const categoryLocked = !!chosenLine && !!lockedCategory;

  // Keep selections consistent when the budget / line changes.
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (categoryLocked && nameKey(categoryName) !== nameKey(lockedCategory)) {
      setCategoryName(lockedCategory);
      setSubName('');
    }
    if (lineId && budget && !chosenLine) setLineId('');
    if (budgetId && !budget && budgetsApi.data) setBudgetId(''); // chosen budget no longer eligible for this date
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, categoryLocked, lockedCategory, categoryName, budgetId, budget, budgetsApi.data, lineId, chosenLine]);

  const category = categories.find((c) => nameKey(c.name) === nameKey(categoryName)) ?? null;
  // The line this transaction will count against when none is named: the one for its category.
  const autoLine: BudgetCategoryRow | null =
    budget && !chosenLine && category
      ? lines.find((l) => nameKey(l.name) === nameKey(category.name)) ?? null
      : null;
  const line = chosenLine ?? autoLine;
  const lineSubs = useMemo(() => (line ? (budget?.categories ?? []).filter((c) => c.parentCategoryId === line.id) : []), [budget, line]);
  const willAddToBudget = !!budget && !chosenLine && !!category && !autoLine;
  const scoped = !!line?.scopedToSubCategories;
  const subOptions = useMemo(() => {
    const active = (category?.subCategories ?? []).filter((s) => s.isActive || nameKey(s.name) === nameKey(subName));
    if (!scoped) return active;
    const allowed = new Set(lineSubs.map((s) => nameKey(s.name)));
    return active.filter((s) => allowed.has(nameKey(s.name)));
  }, [category, scoped, lineSubs, subName]);
  const categoryOptions = useMemo(
    () => categories.filter((c) => c.isActive || nameKey(c.name) === nameKey(categoryName)),
    [categories, categoryName],
  );

  function changeType(next: CategoryType) {
    if (next === type) return;
    setType(next);
    setCategoryName('');
    setSubName('');
    setBudgetId('');
    setLineId('');
  }
  function changeCategory(name: string) {
    setCategoryName(name);
    setSubName(''); // a sub-category always belongs to exactly one category
  }

  const amountNum = Number(amount);
  const problems: Record<string, string> = {};
  if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) problems.amount = 'Enter an amount greater than zero';
  else if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) problems.amount = 'Use at most two decimal places';
  if (!date) problems.date = 'Pick a date';
  if (budget && !chosenLine && !categoryName && lines.length > 1) problems.category = 'Pick a category — or a budget category';
  if (scoped && !subName) problems.sub = 'This budget tracks sub-categories — pick one';

  async function quickCreate() {
    const name = (quickName ?? '').trim();
    if (!name) return;
    setQuickBusy(true);
    try {
      const created = await createCategory({ name, type });
      toast.success(created.restored ? `Restored “${created.name}”` : `Created “${created.name}”`);
      setCategoryName(created.name);
      setSubName('');
      setQuickName(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the category.'));
    } finally {
      setQuickBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(problems).length) return;
    setBusy(true);
    setError('');
    try {
      const taxonomy = {
        category: categoryName || null,
        subCategory: categoryName ? subName || null : null,
        budgetId: type === 'EXPENSE' && budget ? budget.id : null,
        // Only sent when the user named a budget category; otherwise the server uses the transaction's category.
        budgetCategoryId: type === 'EXPENSE' && budget && chosenLine ? chosenLine.id : null,
      };
      const common = {
        description: title.trim() || null,
        notes: notes.trim() || null,
        mode: mode || null,
        ...taxonomy,
      };
      let saved: Transaction;
      if (editing && transaction) {
        const res = await updateTransaction(transaction.id, {
          ...common,
          ...(factsLocked ? {} : { amount: amountNum, type, transactionDate: new Date(`${date}T12:00:00`).toISOString() }),
        });
        saved = res;
        const w = (res.warnings ?? []).map(warningText).filter(Boolean);
        toast.success(w.length ? `Saved. ${w.join(' ')}` : 'Transaction updated');
      } else {
        saved = await createTransaction({
          ...common,
          amount: amountNum,
          type,
          transactionDate: new Date(`${date}T12:00:00`).toISOString(),
        });
        toast.success('Transaction added');
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'We could not save this transaction. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (touched ? problems[k] : undefined);

  return (
    <Modal open={open} onClose={onClose} busy={busy} size="md" title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-2">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <label
              key={t}
              className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
              } ${factsLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <input type="radio" name="tx-type" className="sr-only" checked={type === t} disabled={factsLocked} onChange={() => changeType(t)} />
              {t === 'EXPENSE' ? 'Expense' : 'Income'}
            </label>
          ))}
        </div>
        {factsLocked && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
            <Lock className="h-3 w-3" aria-hidden="true" /> Amount, date and type come from your bank message and can’t be changed.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-amount" className={labelCls}>Amount (₹)</label>
            <input id="tx-amount" data-autofocus inputMode="decimal" value={amount} disabled={factsLocked} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-invalid={!!err('amount')} aria-describedby="tx-amount-err" className={fieldCls} />
            <p id="tx-amount-err" role={err('amount') ? 'alert' : undefined} className="mt-1 min-h-4 text-xs text-[var(--color-error-dark)]">{err('amount')}</p>
          </div>
          <div>
            <label htmlFor="tx-date" className={labelCls}>Date</label>
            <input id="tx-date" type="date" value={date} max={todayLocal()} disabled={factsLocked} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            <p role={err('date') ? 'alert' : undefined} className="mt-1 min-h-4 text-xs text-[var(--color-error-dark)]">{err('date')}</p>
          </div>
        </div>

        <div>
          <label htmlFor="tx-title" className={labelCls}>Description</label>
          <input id="tx-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dinner with friends" className={fieldCls} />
        </div>

        {type === 'EXPENSE' && (
          <div>
            <label htmlFor="tx-budget" className={labelCls}>Budget <span className="font-normal normal-case text-[var(--color-text-tertiary)]">(optional)</span></label>
            <select id="tx-budget" value={budgetId} onChange={(e) => { setBudgetId(e.target.value); setLineId(''); }} className={fieldCls} disabled={budgetsApi.initialLoading}>
              <option value="">No budget</option>
              {eligibleBudgets.map((b) => <option key={b.id} value={b.id}>{b.title}{budgetCoversDay(b, date) ? '' : ' (outside its dates)'}</option>)}
            </select>
            {budgetsApi.error != null && <p role="alert" className="mt-1 text-xs text-[var(--color-error-dark)]">Couldn’t load your budgets — you can still save without one.</p>}
          </div>
        )}

        {budget && lines.length > 0 && (
          <div>
            <label htmlFor="tx-line" className={labelCls}>Budget category <span className="font-normal normal-case text-[var(--color-text-tertiary)]">(optional)</span></label>
            <select id="tx-line" value={chosenLine?.id ?? ''} onChange={(e) => { setLineId(e.target.value); setSubName(''); }} className={fieldCls}>
              <option value="">Same as category</option>
              {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <p className="mt-1 min-h-4 text-xs text-[var(--color-text-tertiary)]">
              {chosenLine
                ? `Counts as “${chosenLine.name}”.`
                : willAddToBudget
                  ? `“${category?.name}” isn’t in “${budget.title}” yet — it will be added so this spend is counted.`
                  : category
                    ? `Counts against “${category.name}” in this budget.`
                    : 'Pick a category below, or a budget category here.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-cat" className={labelCls}>
              Category {categoryLocked && <Lock className="ml-1 inline h-3 w-3" aria-label="Set by the budget" />}
            </label>
            <select id="tx-cat" value={category?.name ?? categoryName} disabled={categoryLocked || catsLoading} onChange={(e) => changeCategory(e.target.value)} className={fieldCls}>
              <option value="">{catsLoading ? 'Loading…' : 'Uncategorised'}</option>
              {categoryOptions.map((c) => <option key={c.id} value={c.name}>{c.name}{c.isActive ? '' : ' (archived)'}</option>)}
            </select>
            {categoryLocked && <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Set by the budget category you chose.</p>}
            <p role={err('category') ? 'alert' : undefined} className="mt-1 text-xs text-[var(--color-error-dark)]">{err('category')}</p>
            {catsError != null && categories.length === 0 && (
              <p role="alert" className="mt-1 text-xs text-[var(--color-error-dark)]">Couldn’t load categories. <button type="button" className="font-semibold underline" onClick={reloadCats}>Retry</button></p>
            )}
          </div>
          <div>
            <label htmlFor="tx-sub" className={labelCls}>Subcategory</label>
            <select id="tx-sub" value={subName} disabled={!categoryName || subOptions.length === 0} onChange={(e) => setSubName(e.target.value)} aria-invalid={!!err('sub')} className={fieldCls}>
              <option value="">{!categoryName ? 'Pick a category first' : subOptions.length === 0 ? 'None available' : scoped ? 'Select…' : 'None'}</option>
              {subOptions.map((s) => <option key={s.id} value={s.name}>{s.name}{s.isActive ? '' : ' (archived)'}</option>)}
            </select>
            <p role={err('sub') ? 'alert' : undefined} className="mt-1 min-h-4 text-xs text-[var(--color-error-dark)]">{err('sub')}</p>
          </div>
        </div>

        {!categoryLocked && (
          quickName === null ? (
            <button type="button" onClick={() => setQuickName('')} className="-mt-2 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create a new {type === 'EXPENSE' ? 'expense' : 'income'} category
            </button>
          ) : (
            <div className="-mt-2 flex gap-2">
              <input
                aria-label="New category name"
                autoFocus
                value={quickName}
                maxLength={60}
                onChange={(e) => setQuickName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void quickCreate(); }
                  if (e.key === 'Escape') { e.stopPropagation(); setQuickName(null); }
                }}
                placeholder="Category name"
                className={`${fieldCls} py-2`}
              />
              <Button type="button" size="sm" loading={quickBusy} onClick={() => void quickCreate()}>Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setQuickName(null)}>Cancel</Button>
            </div>
          )
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="tx-mode" className={labelCls}>Paid with</label>
            <select id="tx-mode" value={mode} onChange={(e) => setMode(e.target.value)} className={fieldCls}>
              <option value="">Not specified</option>
              {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tx-notes" className={labelCls}>Notes</label>
            <input id="tx-notes" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className={fieldCls} />
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-dark)]">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={busy}>{editing ? 'Save changes' : 'Add transaction'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/** Plain-language text for the server's non-fatal notes about an edit. */
export function warningText(code: string): string {
  switch (code) {
    case 'category_overridden_by_budget': return 'The budget’s category was used.';
    case 'subcategory_not_in_budget': return 'That subcategory isn’t part of the budget, so it was left out.';
    case 'subcategory_cleared_category_changed': return 'Subcategory was cleared because the category changed.';
    case 'budget_cleared': return 'It no longer counts towards the budget.';
    case 'category_cleared_type_changed': return 'Category was cleared because the type changed.';
    default: return '';
  }
}
