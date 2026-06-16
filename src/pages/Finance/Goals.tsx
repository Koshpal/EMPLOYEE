import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, X, CalendarDays, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../../services/finance.service';
import type { FinancialGoal, CreateGoalPayload } from '../../types/finance.types';

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

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface GoalModalProps {
  goal?: FinancialGoal | null;
  onClose: () => void;
  onSave: (data: CreateGoalPayload, id?: string) => Promise<void>;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [name, setName] = useState(goal?.goalName ?? '');
  const [icon, setIcon] = useState(goal?.icon ?? '🎯');
  const [amount, setAmount] = useState(goal ? String(goal.goalAmount) : '');
  const [saving, setSaving] = useState(goal ? String(goal.saving) : '');
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
        { goalName: name.trim(), icon, goalAmount: Number(amount), saving: Number(saving) || 0, goalDate: date },
        goal?._id,
      );
      onClose();
    } catch {
      setError('Failed to save goal. Please try again.');
    } finally {
      setSavingState(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)]">
          <h2 className="text-h5 text-[var(--color-text-primary)]">
            {goal ? 'Edit Goal' : 'New Financial Goal'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((i) => (
                <button
                  key={i.emoji}
                  type="button"
                  onClick={() => setIcon(i.emoji)}
                  title={i.label}
                  className={`text-xl p-2 rounded-xl border-2 transition-all ${
                    icon === i.emoji
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  {i.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Goal name */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">Goal Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vacation Fund, New Car…"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">Target Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">Saved So Far (₹)</label>
              <input
                type="number"
                min="0"
                value={saving}
                onChange={(e) => setSaving(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
          </div>

          {/* Target date */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 block">Target Date</label>
            <input
              type="date"
              value={date}
              min={goal ? undefined : minDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>

          {error && <p className="text-xs text-[var(--color-error-dark)] bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving_state}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving_state ? 'Saving…' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = goal.goalAmount > 0 ? Math.min(100, (goal.saving / goal.goalAmount) * 100) : 0;
  const completed = progress >= 100;
  const days = daysLeft(goal.goalDate);
  const remaining = Math.max(0, goal.goalAmount - goal.saving);

  return (
    <motion.div
      {...fadeUp}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-5 hover:shadow-md transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-2xl">
            {goal.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">{goal.goalName}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              {completed
                ? <CheckCircle2 className="w-3 h-3 text-[var(--color-success-dark)]" />
                : <Circle className="w-3 h-3 text-[var(--color-text-tertiary)]" />}
              <span className={`text-xs font-medium ${completed ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>
                {completed ? 'Completed' : `${days} days left`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[var(--color-primary)]/10 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-[var(--color-error-bg)] text-[var(--color-text-tertiary)] hover:text-[var(--color-error-dark)] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Saved</p>
          <p className="text-h5 font-bold text-[var(--color-text-primary)] tabular-nums">{formatINR(goal.saving)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Target</p>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)] tabular-nums">{formatINR(goal.goalAmount)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: completed
              ? 'var(--color-success-dark)'
              : 'linear-gradient(90deg, var(--color-primary), #6366f1)',
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
          <CalendarDays className="w-3 h-3" />
          <span>{formatDate(goal.goalDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold" style={{ color: completed ? 'var(--color-success-dark)' : 'var(--color-primary)' }}>
            {Math.round(progress)}%
          </span>
          {!completed && (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              · {formatINR(remaining)} to go
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ goal, onCancel, onConfirm }: { goal: FinancialGoal; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6 shadow-2xl text-center"
      >
        <div className="text-4xl mb-3">{goal.icon}</div>
        <h3 className="text-h5 text-[var(--color-text-primary)] mb-2">Delete Goal?</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          "<strong>{goal.goalName}</strong>" will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-error-dark)] text-white text-sm font-semibold hover:opacity-90 transition-all"
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

  async function handleSave(payload: CreateGoalPayload, id?: string) {
    if (id) {
      const updated = await updateGoal(id, payload);
      setGoals((prev) => prev.map((g) => (g._id === id ? updated : g)));
    } else {
      const created = await createGoal(payload);
      setGoals((prev) => [...prev, created]);
    }
  }

  async function handleDelete(id: string) {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g._id !== id));
    setDeleteGoal(null);
  }

  // Summary stats
  const totalGoals = goals.length;
  const completed = goals.filter((g) => g.saving >= g.goalAmount).length;
  const totalTarget = goals.reduce((s, g) => s + g.goalAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saving, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  return (
    <Layout title="Financial Goals">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div {...fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-[var(--color-text-primary)]">Financial Goals</h1>
            <p className="text-body-md text-[var(--color-text-secondary)] mt-1">
              Track and manage your savings targets
            </p>
          </div>
          <button
            onClick={() => { setEditGoal(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </motion.div>

        {/* Summary cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Goals', value: String(totalGoals), icon: Target, color: 'var(--color-primary)', bg: 'var(--color-primary-lightest)' },
              { label: 'Completed', value: String(completed), icon: CheckCircle2, color: 'var(--color-success-dark)', bg: 'var(--color-success-bg)' },
              { label: 'Total Target', value: formatINR(totalTarget), icon: TrendingUp, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
              { label: 'Total Saved', value: formatINR(totalSaved), icon: CalendarDays, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ delay: 0.05 * i }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{s.label}</span>
                </div>
                <p className="text-h4 font-bold text-[var(--color-text-primary)] tabular-nums">{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Overall progress bar */}
        {goals.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Overall Progress</span>
              <span className="text-sm font-bold text-[var(--color-primary)]">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${overallProgress}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), #6366f1, #06b6d4)',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[var(--color-text-tertiary)]">{formatINR(totalSaved)} saved</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{formatINR(totalTarget)} target</span>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]" />
          </div>
        ) : error ? (
          <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-dark)]/30 rounded-2xl p-6 text-center">
            <p className="text-sm text-[var(--color-error-dark)] font-medium mb-3">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Try again</button>
          </div>
        ) : goals.length === 0 ? (
          <motion.div {...fadeUp} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5 text-4xl">
              🎯
            </div>
            <h3 className="text-h4 text-[var(--color-text-primary)] mb-2">No goals yet</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
              Set financial goals to track your savings progress and stay motivated.
            </p>
            <button
              onClick={() => { setEditGoal(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create your first goal
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={() => { setEditGoal(goal); setShowModal(true); }}
                onDelete={() => setDeleteGoal(goal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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
            onConfirm={() => handleDelete(deleteGoal_._id)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
