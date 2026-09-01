import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react';
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

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
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

// ─── Card ────────────────────────────────────────────────────────────────────
function BudgetCard({
  budget, progress, onEdit, onDelete,
}: {
  budget: Budget;
  progress?: BudgetProgress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const spent = progress?.totalSpent ?? 0;
  const pct = progress ? Math.min(100, progress.percentageSpent) : 0;
  const over = progress?.overBudget ?? false;
  const tops = (budget.categories ?? []).filter((c) => !c.parentCategoryId);

  return (
    <motion.div {...fadeUp} className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">{budget.title}</h3>
            <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
              {budget.budgetType === 'RECURRING' ? (budget.period ?? 'Recurring') : 'One-time'} · {tops.length} categories
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--color-primary)]/10 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)]">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-[var(--color-error-bg)] text-[var(--color-text-tertiary)] hover:text-[var(--color-error-dark)]">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Spent</p>
          <p className="text-h5 font-bold text-[var(--color-text-primary)] tabular-nums">{formatINR(spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Budget</p>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)] tabular-nums">{formatINR(budget.amount)}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: over ? 'var(--color-error-dark)' : 'linear-gradient(90deg, var(--color-primary), #6366f1)',
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: over ? 'var(--color-error-dark)' : 'var(--color-primary)' }}>
          {progress ? `${Math.round(progress.percentageSpent)}%` : '—'}
        </span>
        {tops.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)]">
            {open ? 'Hide' : 'Categories'}
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)] space-y-1.5">
          {tops.map((c) => {
            const Icon = iconFor(c.iconResId ?? categoryByName(c.name)?.icon);
            const p = progress?.categories.find((x) => x.id === c.id);
            return (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <Icon className="w-3.5 h-3.5" style={{ color: c.colorHex }} />
                <span className="text-[var(--color-text-secondary)] flex-1">{c.name}</span>
                <span className="tabular-nums text-[var(--color-text-tertiary)]">
                  {p ? `${formatINR(p.spent)} / ` : ''}{formatINR(c.allottedAmount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
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
export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [progress, setProgress] = useState<Record<string, BudgetProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [toDelete, setToDelete] = useState<Budget | null>(null);

  async function load() {
    try {
      setError('');
      const list = await getBudgets();
      setBudgets(list);
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
    setToDelete(null);
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = Object.values(progress).reduce((s, p) => s + p.totalSpent, 0);

  return (
    <Layout title="Budgets">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <motion.div {...fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-[var(--color-text-primary)]">Budgets</h1>
            <p className="text-body-md text-[var(--color-text-secondary)] mt-1">Plan spending by category and track it against your transactions</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </motion.div>

        {budgets.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ['Budgets', String(budgets.length)],
              ['Total Budgeted', formatINR(totalBudgeted)],
              ['Total Spent', formatINR(totalSpent)],
            ].map(([label, value]) => (
              <motion.div key={label} {...fadeUp} className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-4">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
                <p className="text-h4 font-bold text-[var(--color-text-primary)] tabular-nums mt-2">{value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]" />
          </div>
        ) : error ? (
          <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-dark)]/30 rounded-2xl p-6 text-center">
            <p className="text-sm text-[var(--color-error-dark)] font-medium mb-3">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Try again</button>
          </div>
        ) : budgets.length === 0 ? (
          <motion.div {...fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
              <Wallet className="w-9 h-9 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-2">No budgets yet</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">Create a budget, pick the categories it covers, and watch your spending against it.</p>
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Create your first budget
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                progress={progress[b.id]}
                onEdit={() => { setEditing(b); setShowModal(true); }}
                onDelete={() => setToDelete(b)}
              />
            ))}
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
