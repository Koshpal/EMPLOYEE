import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Pencil, Trash2, X, ChevronDown, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import {
  getBudgets, getBudgetProgress, createBudget, updateBudget, deleteBudget,
} from '../../services/finance.service';
import type {
  Budget, BudgetProgress, CreateBudgetPayload, BudgetKind, BudgetPeriod,
} from '../../types/finance.types';
import {
  DEFAULT_CATEGORIES, subCategoriesOf, categoryByName, iconFor,
} from '../../data/financeCategories';
import { SummarySection } from '../../components/dashboard/widgets';
import { SUMMARY_STYLES } from '../../components/dashboard/helpers';
import { IconBell, IconSettings2 } from '../../components/icons/figma';
import { FinanceTabs } from '../../components/finance/FinanceTabs';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

/** Figma shows full Indian-grouped numbers (₹2,000 — not ₹2.0K). */
function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

const PERIODS: BudgetPeriod[] = ['WEEKLY', 'MONTHLY', 'YEARLY'];

/** A budget may hold categories outside the default set — never crash on it. */
function catMeta(catId: string): { id: string; name: string; icon: string; color: string } {
  return (
    DEFAULT_CATEGORIES.find((c) => c.id === catId) ?? {
      id: catId,
      name: catId,
      icon: 'category',
      color: '#334eac',
    }
  );
}

// ── the picker's working model ──────────────────────────────────────────────
interface DraftSub { name: string; icon: string; amount: string; on: boolean; existingId?: string }
interface DraftCat { catId: string; amount: string; subs: DraftSub[]; existingId?: string }

function draftFromBudget(b?: Budget | null): DraftCat[] {
  if (!b) return [];
  const tops = (b.categories ?? []).filter((c) => !c.parentCategoryId);
  return tops.map((top) => {
    const cat = categoryByName(top.name);
    const catId = cat?.id ?? top.name;
    const savedSubs = (b.categories ?? []).filter((c) => c.parentCategoryId === top.id);
    const subs: DraftSub[] = subCategoriesOf(catId).map((s) => {
      const saved = savedSubs.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
      return {
        name: s.name, icon: s.icon,
        amount: saved ? String(saved.allottedAmount) : '',
        on: !!saved, existingId: saved?.id,
      };
    });
    // keep any saved sub that isn't in the default set so re-saving doesn't drop it
    for (const saved of savedSubs) {
      if (!subs.some((x) => x.name.toLowerCase() === saved.name.toLowerCase())) {
        subs.push({ name: saved.name, icon: 'category', amount: String(saved.allottedAmount), on: true, existingId: saved.id });
      }
    }
    return { catId, amount: String(top.allottedAmount), subs, existingId: top.id };
  });
}

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  budget?: Budget | null;
  onClose: () => void;
  onSave: (data: CreateBudgetPayload, id?: string) => Promise<void>;
}

function BudgetModal({ budget, onClose, onSave }: ModalProps) {
  const [title, setTitle] = useState(budget?.title ?? '');
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '');
  const [kind, setKind] = useState<BudgetKind>(budget?.budgetType ?? 'RECURRING');
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? 'MONTHLY');
  const [startDate, setStartDate] = useState(
    (budget?.startDate ?? new Date().toISOString()).slice(0, 10),
  );
  const [endDate, setEndDate] = useState(budget?.endDate ? budget.endDate.slice(0, 10) : '');
  const [drafts, setDrafts] = useState<DraftCat[]>(draftFromBudget(budget));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleCategory(catId: string) {
    setDrafts((prev) => {
      const exists = prev.find((d) => d.catId === catId);
      if (exists) return prev.filter((d) => d.catId !== catId);
      const subs: DraftSub[] = subCategoriesOf(catId).map((s) => ({
        name: s.name, icon: s.icon, amount: '', on: false,
      }));
      return [...prev, { catId, amount: '', subs }];
    });
  }
  const patchCat = (catId: string, patch: Partial<DraftCat>) =>
    setDrafts((p) => p.map((d) => (d.catId === catId ? { ...d, ...patch } : d)));
  const patchSub = (catId: string, name: string, patch: Partial<DraftSub>) =>
    setDrafts((p) =>
      p.map((d) =>
        d.catId === catId
          ? { ...d, subs: d.subs.map((s) => (s.name === name ? { ...s, ...patch } : s)) }
          : d,
      ),
    );

  const totalBudget = Number(amount) || 0;
  const allocated = drafts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('Give the budget a name');
    if (!totalBudget || totalBudget <= 0) return setError('Enter a valid budget amount');
    if (!startDate) return setError('Pick a start date');
    if (allocated > totalBudget) return setError('Category allocations exceed the total budget');

    for (const d of drafts) {
      const catAmt = Number(d.amount) || 0;
      const subTotal = d.subs.filter((s) => s.on).reduce((s, x) => s + (Number(x.amount) || 0), 0);
      if (subTotal > catAmt) {
        return setError(`Sub-category allocations exceed ${catMeta(d.catId).name} allocation`);
      }
    }

    setError('');
    setBusy(true);
    try {
      const common = {
        title: title.trim(),
        amount: totalBudget,
        budgetType: kind,
        ...(kind === 'RECURRING' ? { period } : {}),
        startDate: new Date(startDate).toISOString(),
        ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
      };

      let payload: CreateBudgetPayload;
      if (budget) {
        // UPDATE: flat category items. Existing rows carry an id; a sub-category
        // is a flat item with parentCategoryId. Subs of a brand-new category
        // can't be attached in the same call — save, then reopen to add them.
        const flat: any[] = [];
        for (const d of drafts) {
          const cat = catMeta(d.catId);
          flat.push({
            ...(d.existingId ? { id: d.existingId } : {}),
            name: cat.name,
            allottedAmount: Number(d.amount) || 0,
            colorHex: cat.color,
            iconResId: cat.icon,
          });
          if (!d.existingId) continue; // new category → subs skipped this round
          for (const s of d.subs.filter((x) => x.on)) {
            flat.push({
              ...(s.existingId ? { id: s.existingId } : {}),
              name: s.name,
              allottedAmount: Number(s.amount) || 0,
              parentCategoryId: d.existingId,
            });
          }
        }
        payload = { ...common, ...(flat.length ? { categories: flat } : {}) } as CreateBudgetPayload;
      } else {
        // CREATE: nested categories with subCategories
        const categories = drafts.map((d) => {
          const cat = catMeta(d.catId);
          const subCategories = d.subs
            .filter((s) => s.on)
            .map((s) => ({ name: s.name, allottedAmount: Number(s.amount) || 0 }));
          return {
            name: cat.name,
            allottedAmount: Number(d.amount) || 0,
            colorHex: cat.color,
            iconResId: cat.icon,
            ...(subCategories.length ? { subCategories } : {}),
          };
        });
        payload = { ...common, ...(categories.length ? { categories } : {}) };
      }

      await onSave(payload, budget?.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save budget. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const fieldCls =
    'w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20';
  const labelCls =
    'text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)] sticky top-0 bg-[var(--color-bg-card)]">
          <h2 className="text-h5 text-[var(--color-text-primary)]">
            {budget ? 'Edit Budget' : 'New Budget'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Name</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. September household" className={fieldCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Total Budget (₹)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="45000" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as BudgetKind)} className={fieldCls}>
                <option value="RECURRING">Recurring</option>
                <option value="ONE_TIME">One-time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {kind === 'RECURRING' && (
              <div>
                <label className={labelCls}>Frequency</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)} className={fieldCls}>
                  {PERIODS.map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>End Date (optional)</label>
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={fieldCls} />
            </div>
          </div>

          {/* Category picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Categories</label>
              <span className={`text-xs font-medium tabular-nums ${allocated > totalBudget ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {formatINR(allocated)} / {formatINR(totalBudget)} allocated
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {DEFAULT_CATEGORIES.map((c) => {
                const Icon = iconFor(c.icon);
                const active = drafts.some((d) => d.catId === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    title={c.name}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: c.color }} />
                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)] leading-none truncate w-full text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-selected-category amount + sub-categories */}
          {drafts.map((d) => {
            const cat = catMeta(d.catId);
            const subs = subCategoriesOf(d.catId);
            const Icon = iconFor(cat.icon);
            return (
              <div key={d.catId} className="rounded-xl border border-[var(--color-border-primary)] p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-1">{cat.name}</span>
                  <input
                    type="number" min="0" value={d.amount}
                    onChange={(e) => patchCat(d.catId, { amount: e.target.value })}
                    placeholder="Amount ₹"
                    className="w-28 px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm text-right focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                {subs.length > 0 && (
                  <div className="pl-6 space-y-1.5">
                    {d.subs.map((s) => {
                      const SIcon = iconFor(s.icon);
                      return (
                        <div key={s.name} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => patchSub(d.catId, s.name, { on: !s.on })}
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              s.on
                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                : 'border-[var(--color-border-primary)]'
                            }`}
                          >
                            {s.on ? '✓' : ''}
                          </button>
                          <SIcon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                          <span className="text-xs text-[var(--color-text-secondary)] flex-1">{s.name}</span>
                          <input
                            type="number" min="0" value={s.amount} disabled={!s.on}
                            onChange={(e) => patchSub(d.catId, s.name, { amount: e.target.value })}
                            placeholder="₹"
                            className="w-24 px-2.5 py-1 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-xs text-right focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-40"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {error && <p className="text-xs text-[var(--color-error-dark)] bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {busy ? 'Saving…' : budget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function periodLabel(b: Budget) {
  if (b.budgetType !== 'RECURRING') return 'One-time';
  return b.period ? b.period[0] + b.period.slice(1).toLowerCase() : 'Recurring';
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Left: "All Budgets" list row ───────────────────────────────────────────
function BudgetListRow({
  budget, selected, onClick,
}: {
  budget: Budget;
  selected: boolean;
  onClick: () => void;
}) {
  const tops = (budget.categories ?? []).filter((c) => !c.parentCategoryId);
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[12px] border px-3 py-3.5 text-left transition-colors ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-lightest)]'
          : 'border-[rgba(205,208,205,0.52)] bg-[var(--color-bg-card)] hover:border-[var(--color-primary)]/40'
      }`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-grotesque text-[18px] font-medium leading-8 text-[var(--color-black-mid)]">
              {budget.title}
            </p>
            <p className="font-label text-[14px] font-medium leading-[26px] text-[var(--color-black-lightest)]">
              {shortDate(budget.startDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-grotesque text-[18px] font-medium leading-8 text-[var(--color-black-dark)]">
              {formatINR(budget.amount)}
            </p>
            <p className="font-label text-[14px] font-medium leading-[26px] text-[var(--color-grey-darkest)]">
              {periodLabel(budget)}
            </p>
          </div>
        </div>
        <div className="h-px w-full bg-[var(--color-border-primary)]" />
        <div className="flex items-center gap-2.5">
          <span className="flex-1 font-label text-[14px] font-medium leading-[26px] text-[var(--color-black-light)]">
            Categories:
          </span>
          <div className="flex items-center gap-1">
            {tops.slice(0, 3).map((c) => {
              const Icon = iconFor(c.iconResId ?? categoryByName(c.name)?.icon);
              return (
                <span
                  key={c.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.colorHex || 'var(--color-primary)' }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
              );
            })}
            {tops.length > 3 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-white-lightest)] text-[11px] font-medium text-[var(--color-black-mid)]">
                +{tops.length - 3}
              </span>
            )}
          </div>
          <ChevronRight className="h-6 w-6 text-[var(--color-text-tertiary)]" />
        </div>
      </div>
    </button>
  );
}

// ─── Right: budget detail (header + overview + per-category) ────────────────
function BudgetDetail({
  budget, progress, onEdit, onDelete, onAddExpense,
}: {
  budget: Budget;
  progress?: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
  onAddExpense: () => void;
}) {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const spent = progress?.totalSpent ?? 0;
  const left = Math.max(0, budget.amount - spent);
  const pct = progress ? Math.min(100, Math.round(progress.percentageSpent)) : 0;
  const over = progress?.overBudget ?? false;
  const tops = (budget.categories ?? []).filter((c) => !c.parentCategoryId);
  const subsOf = (parentId: string) =>
    (budget.categories ?? []).filter((c) => c.parentCategoryId === parentId);

  return (
    <div className="flex flex-col gap-5 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="truncate font-grotesque text-[24px] font-medium leading-[44px] text-[var(--color-black-mid)]">
              {budget.title}
            </p>
            <span
              className={`flex h-[31px] shrink-0 items-center whitespace-nowrap rounded-[22px] border px-3 text-[14px] leading-6 ${
                over
                  ? 'border-[var(--color-error)] text-[var(--color-error-dark)]'
                  : 'border-[var(--color-success-dark)] text-[var(--color-success-dark)]'
              }`}
            >
              {over ? 'Over budget' : 'On Track'}
            </span>
          </div>
          <p className="font-label text-[16px] font-medium leading-7 text-[var(--color-grey-darkest)]">
            {shortDate(budget.startDate)}
            {budget.endDate ? ` - ${shortDate(budget.endDate)}` : ''}
          </p>
        </div>
        <div className="flex h-11 shrink-0 items-center gap-3">
          <button
            onClick={onEdit}
            className="flex h-10 items-center gap-1 whitespace-nowrap rounded-[8px] border border-[var(--color-primary)] pl-4 pr-2.5 text-[14px] leading-6 text-[var(--color-primary)]"
          >
            Edit Budget
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onAddExpense}
            className="flex h-10 items-center gap-1 whitespace-nowrap rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-4 text-[14px] leading-6 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
          >
            <Plus className="h-5 w-5" />
            Add Expense
          </button>
          <button
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] text-[var(--color-text-tertiary)] hover:border-[var(--color-error)] hover:text-[var(--color-error-dark)]"
            aria-label="Delete budget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--color-border-primary)] sm:grid-cols-4">
        {[
          ['Budget Allocated', budget.amount.toLocaleString('en-IN')],
          ['Amount used', Math.round(spent).toLocaleString('en-IN')],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col items-center gap-1 p-4">
            <p className="whitespace-nowrap font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-grey-darkest)]">{label}</p>
            <p className="text-[20px] leading-9 text-[var(--color-black-mid)]">{value}</p>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1 p-4">
          <p className="whitespace-nowrap font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-grey-darkest)]">Amount left</p>
          <span className="flex h-8 items-center rounded-[20px] bg-[var(--color-info-bg)] px-4 font-label text-[14px] leading-6 text-[var(--color-primary)]">
            {Math.round(left).toLocaleString('en-IN')} ({100 - pct}%)
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4">
          <p className="whitespace-nowrap font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-grey-darkest)]">Progress</p>
          <div className="flex w-full items-center gap-1">
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-white-light)]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: over ? 'var(--color-error-dark)' : 'var(--color-primary)' }}
              />
            </span>
            <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Per-category rows */}
      <div className="flex flex-col gap-3">
        {tops.length === 0 && (
          <p className="rounded-[12px] border border-[rgba(14,15,12,0.12)] p-4 text-body-sm text-[var(--color-text-secondary)]">
            This budget has no categories yet. Use “Edit Budget” to add some.
          </p>
        )}
        {tops.map((c) => {
          const Icon = iconFor(c.iconResId ?? categoryByName(c.name)?.icon);
          const cp = progress?.categories.find((x) => x.id === c.id);
          const catSpent = cp?.spent ?? 0;
          const catLeft = Math.max(0, c.allottedAmount - catSpent);
          const catPct = c.allottedAmount > 0 ? Math.min(100, Math.round((catSpent / c.allottedAmount) * 100)) : 0;
          const subs = subsOf(c.id);
          const open = openCat === c.id;
          return (
            <div key={c.id} className="rounded-[12px] border border-[rgba(14,15,12,0.12)] pt-3.5">
              <div className="flex items-center gap-7 px-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: c.colorHex || 'var(--color-primary)' }}>
                    <Icon className="h-6 w-6 text-white" />
                  </span>
                  <div>
                    <p className="font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-black-dark)]">{c.name}</p>
                    <p className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">
                      {formatINR(c.allottedAmount)} Alloted
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-white-light)]">
                    <span className="block h-full rounded-full" style={{ width: `${catPct}%`, backgroundColor: c.colorHex || 'var(--color-primary)' }} />
                  </span>
                  <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-black-lightest)]">{catPct}%</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-grotesque text-[18px] font-medium leading-8 text-[var(--color-primary)]">{formatINR(catLeft)}</span>
                  <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">Amount left</span>
                </div>
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-[var(--color-white-lightest)] px-3.5 py-2">
                <span className="font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-black-light)]">Sub-categories</span>
                {subs.length > 0 && (
                  <button
                    onClick={() => setOpenCat(open ? null : c.id)}
                    className="flex items-center gap-1 text-[16px] leading-7 text-[var(--color-primary)] underline"
                  >
                    {open ? 'View less' : 'View more'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {open && subs.length > 0 && (
                <div className="flex flex-col gap-4 px-3.5 pb-4">
                  {subs.map((s) => {
                    const SIcon = iconFor(categoryByName(s.name)?.icon);
                    const sp = cp?.subCategories.find((x) => x.id === s.id);
                    const sSpent = sp?.spent ?? 0;
                    const sPct = s.allottedAmount > 0 ? Math.min(100, Math.round((sSpent / s.allottedAmount) * 100)) : 0;
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: c.colorHex || 'var(--color-primary)' }}>
                          <SIcon className="h-5 w-5 text-white" />
                        </span>
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-medium leading-4 tracking-[0.14px] text-[var(--color-black-dark)]">{s.name}</span>
                            <span className="flex items-center gap-2.5">
                              <span className="text-[10px] font-semibold leading-4 tracking-[0.1px] text-[var(--color-black-lightest)]">{sPct}% used</span>
                              <span className="text-[14px] font-medium leading-4 text-[var(--color-black-dark)]">-{formatINR(sSpent)}</span>
                            </span>
                          </div>
                          <span className="h-[7px] w-full overflow-hidden rounded-full bg-[rgba(205,208,205,0.52)]">
                            <span className="block h-full rounded-full" style={{ width: `${sPct}%`, backgroundColor: c.colorHex || 'var(--color-primary)' }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Delete confirm ──────────────────────────────────────────────────────────
function DeleteConfirm({ budget, onCancel, onConfirm }: { budget: Budget; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6 shadow-2xl text-center">
        <div className="mb-3 flex justify-center"><Wallet className="w-9 h-9 text-[var(--color-primary)]" /></div>
        <h3 className="text-h5 text-[var(--color-text-primary)] mb-2">Delete Budget?</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">"<strong>{budget.title}</strong>" will be permanently deleted.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-error-dark)] text-white text-sm font-semibold hover:opacity-90">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const iconBtn =
  'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [progress, setProgress] = useState<Record<string, BudgetProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [toDelete, setToDelete] = useState<Budget | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    try {
      setError('');
      const list = await getBudgets();
      setBudgets(list);
      setSelectedId((cur) => cur ?? list[0]?.id ?? null);
      const entries = await Promise.all(
        list.map(async (b) => {
          try { return [b.id, await getBudgetProgress(b.id)] as const; }
          catch { return null; }
        }),
      );
      setProgress(Object.fromEntries(entries.filter(Boolean) as [string, BudgetProgress][]));
    } catch {
      setError('Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleSave(payload: CreateBudgetPayload, id?: string) {
    if (id) await updateBudget(id, payload);
    else await createBudget(payload);
    await load();
  }
  async function handleDelete(id: string) {
    await deleteBudget(id);
    setBudgets((p) => p.filter((b) => b.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setToDelete(null);
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = Object.values(progress).reduce((s, p) => s + p.totalSpent, 0);
  const overCount = Object.values(progress).filter((p) => p.overBudget).length;
  const onTrackCount = budgets.length - overCount;

  const filtered = useMemo(
    () => budgets.filter((b) => b.title.toLowerCase().includes(query.trim().toLowerCase())),
    [budgets, query],
  );
  const selected = budgets.find((b) => b.id === selectedId) ?? null;

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Budget" />
      <button
        onClick={() => { setEditing(null); setShowModal(true); }}
        className="flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-4 text-[14px] leading-6 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
      >
        <Plus className="h-5 w-5" />
        Create Budget
      </button>
    </div>
  );

  const summaryTiles = [
    { label: 'ON TRACK', value: String(onTrackCount), note: `${budgets.length} total`, noteIcon: 'same' as const, ...SUMMARY_STYLES.spendings },
    { label: 'TOTAL BUDGETS', value: formatINR(totalBudgeted), note: `${budgets.length} budget${budgets.length === 1 ? '' : 's'}`, noteIcon: 'trend' as const, ...SUMMARY_STYLES.budget },
    { label: 'OVER BUDGET', value: String(overCount), note: overCount ? 'Needs attention' : 'All within limits', noteIcon: 'trend' as const, ...SUMMARY_STYLES.sessions },
    { label: 'TOTAL SPENT', value: formatINR(totalSpent), note: 'This period', noteIcon: 'trend' as const, ...SUMMARY_STYLES.savings },
  ];

  return (
    <Layout title="Budgeting" headerActions={headerActions} headerBelow={headerBelow}>
      <div className="flex flex-col gap-6 pb-8">
        {budgets.length > 0 && (
          <motion.div {...fadeUp}>
            <SummarySection tiles={summaryTiles} />
          </motion.div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--color-primary)]" />
          </div>
        ) : error ? (
          <div className="rounded-[12px] border border-[var(--color-error-dark)]/30 bg-[var(--color-error-bg)] p-6 text-center">
            <p className="mb-3 text-sm font-medium text-[var(--color-error-dark)]">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Try again</button>
          </div>
        ) : budgets.length === 0 ? (
          <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-[8px] bg-[var(--color-bg-card)] py-20 text-center shadow-[var(--shadow-drop-low)]">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-primary)]/10">
              <Wallet className="h-9 w-9 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-[var(--color-text-primary)]">No budgets yet</h3>
            <p className="mb-6 mt-2 max-w-xs text-body-sm text-[var(--color-text-secondary)]">
              Create a budget, pick the categories it covers, and track your spending against it.
            </p>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 rounded-[8px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-darkest)]"
            >
              <Plus className="h-4 w-4" /> Create your first budget
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            {/* Left — All Budgets */}
            <div className="flex w-full shrink-0 flex-col gap-4 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] xl:w-[400px]">
              <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">All Budgets</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 flex-1 items-center gap-2 rounded-[8px] border border-[var(--color-border-primary)] px-2.5">
                  <Search className="h-5 w-5 text-[var(--color-text-tertiary)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search budgets..."
                    className="w-full bg-transparent text-[12px] leading-[22px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
                  />
                </div>
                <button className={iconBtn} aria-label="Filter"><SlidersHorizontal className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-3">
                {filtered.map((b) => (
                  <BudgetListRow key={b.id} budget={b} selected={b.id === selectedId} onClick={() => setSelectedId(b.id)} />
                ))}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-body-sm text-[var(--color-text-secondary)]">No budgets match “{query}”.</p>
                )}
              </div>
            </div>

            {/* Right — detail */}
            <div className="min-w-0 flex-1">
              {selected ? (
                <BudgetDetail
                  budget={selected}
                  progress={progress[selected.id]}
                  onEdit={() => { setEditing(selected); setShowModal(true); }}
                  onDelete={() => setToDelete(selected)}
                  onAddExpense={() => navigate('/finance/transactions')}
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-[8px] bg-[var(--color-bg-card)] p-8 text-body-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-drop-low)]">
                  Select a budget to see its breakdown.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <BudgetModal
            budget={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSave={handleSave}
          />
        )}
        {toDelete && (
          <DeleteConfirm budget={toDelete} onCancel={() => setToDelete(null)} onConfirm={() => handleDelete(toDelete.id)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
