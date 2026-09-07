import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../services/finance.service';
import type { FinancialGoal, CreateGoalPayload } from '../../types/finance.types';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { SummarySection } from '../../components/dashboard/widgets';
import { SUMMARY_STYLES, inr } from '../../components/dashboard/helpers';
import { IconBell, IconSettings2 } from '../../components/icons/figma';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const ICONS = [
  { emoji: '🎯', label: 'General' },
  { emoji: '🏠', label: 'House' },
  { emoji: '🚗', label: 'Car' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '💰', label: 'Savings' },
  { emoji: '🏦', label: 'Investment' },
  { emoji: '📱', label: 'Gadget' },
  { emoji: '🎓', label: 'Education' },
  { emoji: '💍', label: 'Wedding' },
  { emoji: '🏖️', label: 'Vacation' },
  { emoji: '🏋️', label: 'Health' },
  { emoji: '🎮', label: 'Gaming' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
const progressOf = (g: FinancialGoal) =>
  g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;

// ─── Modal ───────────────────────────────────────────────────────────────────

interface GoalModalProps {
  goal?: FinancialGoal | null;
  onClose: () => void;
  onSave: (data: CreateGoalPayload, id?: string) => Promise<void>;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [name, setName] = useState(goal?.title ?? '');
  const [icon, setIcon] = useState(goal?.iconResId ?? '🎯');
  const [amount, setAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [saving, setSaving] = useState(goal ? String(goal.savedAmount) : '');
  const [date, setDate] = useState(goal ? goal.goalDate.slice(0, 10) : '');
  const [saving_state, setSavingState] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Goal name is required');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid target amount');
    if (!date) return setError('Select a target date');

    setError('');
    setSavingState(true);
    try {
      await onSave(
        {
          title: name.trim(),
          iconResId: icon,
          targetAmount: Number(amount),
          savedAmount: Number(saving) || 0,
          goalDate: new Date(date).toISOString(),
        },
        goal?.id,
      );
      onClose();
    } catch {
      setError('Failed to save goal. Please try again.');
    } finally {
      setSavingState(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md rounded-[16px] bg-[var(--color-bg-card)] shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-6 py-4">
          <h2 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
            {goal ? 'Edit Goal' : 'New Financial Goal'}
          </h2>
          <button onClick={onClose} className="rounded-[8px] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-2 block font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((i) => (
                <button
                  key={i.emoji}
                  type="button"
                  onClick={() => setIcon(i.emoji)}
                  title={i.label}
                  className={`rounded-[12px] border-2 p-2 text-xl transition-all ${
                    icon === i.emoji
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-lightest)]'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary-mid)]'
                  }`}
                >
                  {i.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">Goal Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vacation Fund, New Car…"
              className="w-full rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-body-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">Target Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-body-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">Saved So Far (₹)</label>
              <input
                type="number"
                min="0"
                value={saving}
                onChange={(e) => setSaving(e.target.value)}
                placeholder="0"
                className="w-full rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-body-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">Target Date</label>
            <input
              type="date"
              value={date}
              min={goal ? undefined : minDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-4 py-2.5 text-body-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {error && <p className="rounded-[8px] bg-[var(--color-error-bg)] px-3 py-2 text-body-xs text-[var(--color-error-dark)]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[8px] border border-[var(--color-border-primary)] px-4 py-2.5 text-body-sm font-semibold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-bg-tertiary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving_state}
              className="flex-1 rounded-[8px] bg-[var(--color-primary)] px-4 py-2.5 text-body-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-darkest)] disabled:opacity-60"
            >
              {saving_state ? 'Saving…' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ goal, onCancel, onConfirm }: { goal: FinancialGoal; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm rounded-[16px] bg-[var(--color-bg-card)] p-6 text-center shadow-[var(--shadow-xl)]"
      >
        <div className="mb-3 text-4xl">{goal.iconResId}</div>
        <h3 className="mb-2 font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">Delete Goal?</h3>
        <p className="mb-6 text-body-sm text-[var(--color-text-secondary)]">
          “<strong>{goal.title}</strong>” will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-[8px] border border-[var(--color-border-primary)] px-4 py-2.5 text-body-sm font-semibold text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-[8px] bg-[var(--color-error-dark)] px-4 py-2.5 text-body-sm font-semibold text-white transition-all hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Goals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<FinancialGoal | null>(null);
  const [deleteGoal_, setDeleteGoal] = useState<FinancialGoal | null>(null);

  async function load() {
    try {
      setError('');
      const data = await getGoals();
      setGoals(data);
    } catch {
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Deep link from the Get-started checklist: /finance/goals?new=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      setEditGoal(null);
      setShowModal(true);
    }
  }, []);

  async function handleSave(payload: CreateGoalPayload, id?: string) {
    if (id) {
      const updated = await updateGoal(id, payload);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } else {
      const created = await createGoal(payload);
      setGoals((prev) => [...prev, created]);
    }
  }

  async function handleDelete(id: string) {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setDeleteGoal(null);
  }

  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.isAchieved || g.savedAmount >= g.targetAmount).length;
    const atRisk = goals.filter((g) => !(g.isAchieved || g.savedAmount >= g.targetAmount) && progressOf(g) < 30).length;
    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
    return { total, achieved, atRisk, totalSaved };
  }, [goals]);

  const summaryTiles = [
    { label: 'GOALS ACHIEVED', value: String(stats.achieved), suffix: `/${stats.total}`, note: `${stats.total} goals`, noteIcon: 'same' as const, ...SUMMARY_STYLES.spendings },
    { label: 'TOTAL GOALS', value: String(stats.total), note: 'This month', noteIcon: 'trend' as const, ...SUMMARY_STYLES.budget },
    { label: 'AT RISK', value: String(stats.atRisk), note: stats.atRisk ? 'Needs attention' : 'All on track', noteIcon: 'trend' as const, ...SUMMARY_STYLES.sessions },
    { label: 'TOTAL SAVED', value: `₹${inr(stats.totalSaved)}`, note: 'Across all goals', noteIcon: 'trend' as const, ...SUMMARY_STYLES.savings },
  ];

  const iconBtn =
    'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Goals" />
      <button
        onClick={() => { setEditGoal(null); setShowModal(true); }}
        className="flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-4 text-[14px] leading-6 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
      >
        <Plus className="h-5 w-5" />
        Create Goal
      </button>
    </div>
  );

  return (
    <Layout title="Goals" headerActions={headerActions} headerBelow={headerBelow}>
      <div className="flex flex-col gap-6 pb-8">
        <motion.div {...fadeUp}>
          <SummarySection tiles={summaryTiles} loading={loading} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <div className="flex min-w-0 flex-col gap-3 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">Financial Goals</h3>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-full animate-pulse rounded-[6px] bg-[var(--color-bg-tertiary)]" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[12px] bg-[var(--color-error-bg)] p-6 text-center">
                <p className="mb-3 text-body-sm font-medium text-[var(--color-error-dark)]">{error}</p>
                <button onClick={load} className="text-body-xs font-semibold text-[var(--color-primary)] hover:underline">Try again</button>
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--color-primary-lightest)] text-3xl">🎯</div>
                <p className="font-label text-[16px] font-medium leading-7 text-[var(--color-neutral-600)]">No goals yet</p>
                <p className="max-w-xs text-body-sm text-[var(--color-grey-darkest)]">
                  Set financial goals to track your savings progress and stay motivated.
                </p>
                <button
                  onClick={() => { setEditGoal(null); setShowModal(true); }}
                  className="mt-3 flex h-10 items-center gap-1 rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-4 text-body-sm text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
                >
                  <Plus className="h-5 w-5" />
                  Create your first goal
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="text-body-sm text-[var(--color-black-mid)]">
                      <th className="p-2 text-left font-normal">Goal</th>
                      <th className="p-2 text-center font-normal">Target</th>
                      <th className="p-2 text-center font-normal">Saved</th>
                      <th className="p-2 text-center font-normal">Deadline</th>
                      <th className="p-2 text-center font-normal">Progress</th>
                      <th className="w-16 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((g) => {
                      const progress = progressOf(g);
                      return (
                        <tr key={g.id} className="group text-body-sm text-[var(--color-black-mid)]">
                          <td className="max-w-[220px] truncate p-2">
                            <span className="mr-2">{g.iconResId}</span>
                            {g.title}
                          </td>
                          <td className="whitespace-nowrap p-2 text-center">₹{inr(g.targetAmount)}</td>
                          <td className="whitespace-nowrap p-2 text-center">₹{inr(g.savedAmount)}</td>
                          <td className="whitespace-nowrap p-2 text-center">{formatDate(g.goalDate)}</td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-2 px-2">
                              <span className="h-1.5 min-w-[64px] flex-1 overflow-hidden rounded-full bg-[var(--color-white-light)]">
                                <span
                                  className="block h-full rounded-full bg-[var(--color-primary)]"
                                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                                />
                              </span>
                              <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => { setEditGoal(g); setShowModal(true); }}
                                className="rounded-[6px] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)]"
                                aria-label="Edit goal"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteGoal(g)}
                                className="rounded-[6px] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error-dark)]"
                                aria-label="Delete goal"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <GoalModal
            goal={editGoal}
            onClose={() => { setShowModal(false); setEditGoal(null); }}
            onSave={handleSave}
          />
        )}
        {deleteGoal_ && (
          <DeleteConfirm
            goal={deleteGoal_}
            onCancel={() => setDeleteGoal(null)}
            onConfirm={() => handleDelete(deleteGoal_.id)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
