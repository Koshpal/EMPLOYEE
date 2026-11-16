import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Wallet } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { HeaderSettingsButton } from '../../components/common/HeaderSettingsButton';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { SummarySection } from '../../components/dashboard/widgets';
import { SUMMARY_STYLES } from '../../components/dashboard/helpers';
import { BudgetFormModal } from '../../components/budgets/BudgetFormModal';
import { BudgetDetailPanel, ProgressBar, STATUS_STYLE, dateShort } from '../../components/budgets/BudgetDetailPanel';
import { TransactionFormModal } from '../../components/finance/TransactionFormModal';
import { useApi } from '../../hooks/useApi';
import { getBudgets, updateBudget, deleteBudget } from '../../services/finance.service';
import { getBudgetsInsight } from '../../services/spending.service';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/apiError';
import { formatINR } from '../../utils/money';
import type { Budget, Transaction } from '../../types/finance.types';
import type { BudgetInsightCard, BudgetStatus } from '../../types/spending.types';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type StateFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';
type StatusFilter = 'ALL' | BudgetStatus;
type PeriodFilter = 'ALL' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

const selectCls = 'h-9 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-2.5 text-xs';

function BudgetRow({ card, selected, onClick }: { card: BudgetInsightCard; selected: boolean; onClick: () => void }) {
  const st = STATUS_STYLE[card.status];
  const archived = !card.isActive;
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-[12px] border px-3 py-3.5 text-left transition-colors ${selected ? 'border-[var(--color-primary)] bg-[var(--color-primary-lightest)]' : 'border-[rgba(205,208,205,0.52)] bg-[var(--color-bg-card)] hover:border-[var(--color-primary)]/40'} ${archived ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-grotesque text-[17px] font-medium text-[var(--color-black-mid)]">{card.name}</p>
          <p className="text-xs text-[var(--color-black-lightest)]">
            {card.type === 'RECURRING' ? `${card.frequency?.[0]}${card.frequency?.slice(1).toLowerCase()}` : 'One-time'} · {dateShort(card.periodStart)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[16px] font-medium tabular-nums text-[var(--color-black-dark)]">{formatINR(card.budgetAmount)}</p>
          <p className={`text-xs ${archived ? 'text-[var(--color-text-tertiary)]' : card.status === 'ON_TRACK' ? 'text-[var(--color-success-dark)]' : card.status === 'EXCEEDED' ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-warning-dark,#b45309)]'}`}>
            {archived ? 'Archived' : st.label}
          </p>
        </div>
      </div>
      <div className="mt-3"><ProgressBar pct={card.utilisationPct} color={st.bar} label={`${card.name} used`} height={6} /></div>
      <p className="mt-1.5 flex justify-between text-xs text-[var(--color-text-secondary)]">
        <span className="tabular-nums">{formatINR(card.currentSpending)} spent</span>
        <span className="tabular-nums">{card.overBy > 0 ? `${formatINR(card.overBy)} over` : `${formatINR(card.remainingAmount)} left`}</span>
      </p>
    </button>
  );
}

export default function Budgets() {
  const toast = useToast();
  const insight = useApi('insights/budgets', getBudgetsInsight);
  const entities = useApi<Budget[]>('budgets?all', () => getBudgets());

  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ACTIVE');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [toDelete, setToDelete] = useState<BudgetInsightCard | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState('');
  const [txOpen, setTxOpen] = useState(false);
  const [txEditing, setTxEditing] = useState<Transaction | null>(null);

  const cards = useMemo(() => insight.data?.data ?? [], [insight.data]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (stateFilter === 'ACTIVE' && !c.isActive) return false;
      if (stateFilter === 'ARCHIVED' && c.isActive) return false;
      if (statusFilter !== 'ALL' && (c.status !== statusFilter || !c.isActive)) return false;
      if (periodFilter === 'ONE_TIME' ? c.type !== 'ONE_TIME' : periodFilter !== 'ALL' && c.frequency !== periodFilter) return false;
      return !q || c.name.toLowerCase().includes(q);
    });
  }, [cards, query, stateFilter, statusFilter, periodFilter]);

  const selected = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;
  const summary = insight.data?.summary;
  const hasFilters = !!query || stateFilter !== 'ACTIVE' || statusFilter !== 'ALL' || periodFilter !== 'ALL';

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(id: string) {
    const b = entities.data?.find((x) => x.id === id);
    if (!b) return toast.error('Still loading your budgets — try again in a moment.');
    setEditing(b);
    setFormOpen(true);
  }

  async function toggleArchive(c: BudgetInsightCard, archive: boolean) {
    try {
      await updateBudget(c.id, { isActive: !archive });
      toast.success(archive ? `“${c.name}” archived — its history is kept` : `“${c.name}” restored`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update the budget.'));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDelBusy(true);
    setDelError('');
    try {
      await deleteBudget(toDelete.id);
      toast.success(`“${toDelete.name}” deleted`);
      setToDelete(null);
      setSelectedId(null);
    } catch (err) {
      setDelError(apiErrorMessage(err, 'We could not delete this budget.'));
    } finally {
      setDelBusy(false);
    }
  }

  const tiles = summary
    ? [
        { label: 'ACTIVE BUDGETS', value: String(summary.activeBudgets), note: `${formatINR(summary.totalAllocated)} allocated`, noteIcon: 'same' as const, ...SUMMARY_STYLES.budget },
        { label: 'TOTAL SPENT', value: formatINR(summary.totalSpent), note: 'This period', noteIcon: 'trend' as const, ...SUMMARY_STYLES.savings },
        { label: 'REMAINING', value: formatINR(summary.totalRemaining), note: 'Across active budgets', noteIcon: 'same' as const, ...SUMMARY_STYLES.spendings },
        { label: 'NEEDS ATTENTION', value: String(summary.nearLimit + summary.exceeded), note: `${summary.exceeded} over · ${summary.nearLimit} near limit`, noteIcon: 'trend' as const, ...SUMMARY_STYLES.sessions },
      ]
    : [];

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Budget" />
      <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Create budget</Button>
    </div>
  );

  return (
    <Layout title="Budgeting" headerActions={<HeaderSettingsButton />} headerBelow={headerBelow}>
      <div className="flex flex-col gap-6 pb-8">
        {tiles.length > 0 && cards.length > 0 && <motion.div {...fadeUp}><SummarySection tiles={tiles} /></motion.div>}

        {insight.initialLoading ? (
          <div className="h-64 animate-pulse rounded-[8px] bg-[var(--color-bg-tertiary)]" aria-busy="true" aria-label="Loading budgets" />
        ) : insight.error != null && !insight.data ? (
          <div role="alert" className="rounded-[12px] border border-[var(--color-error-dark)]/30 bg-[var(--color-error-bg)] p-6 text-center">
            <p className="mb-3 text-sm font-medium text-[var(--color-error-dark)]">We couldn’t load your budgets.</p>
            <Button variant="outline" onClick={insight.reload}>Try again</Button>
          </div>
        ) : cards.length === 0 ? (
          <motion.div {...fadeUp} className="flex flex-col items-center rounded-[8px] bg-[var(--color-bg-card)] py-20 text-center shadow-[var(--shadow-drop-low)]">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-primary)]/10"><Wallet className="h-9 w-9 text-[var(--color-primary)]" /></div>
            <h3 className="font-heading text-[18px] font-semibold text-[var(--color-text-primary)]">No budgets yet</h3>
            <p className="mb-6 mt-2 max-w-xs text-sm text-[var(--color-text-secondary)]">Pick the categories you want to keep an eye on and set how much you plan to spend.</p>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Create your first budget</Button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="flex w-full shrink-0 flex-col gap-4 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] xl:w-[400px]">
              <h3 className="font-heading text-[18px] font-semibold text-[var(--color-black-mid)]">All budgets</h3>
              <div className="flex h-10 items-center gap-2 rounded-[8px] border border-[var(--color-border-primary)] px-2.5">
                <Search className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search budgets" placeholder="Search budgets…" className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <select aria-label="Show" value={stateFilter} onChange={(e) => setStateFilter(e.target.value as StateFilter)} className={selectCls}>
                  <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
                </select>
                <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls}>
                  <option value="ALL">Any status</option><option value="ON_TRACK">On track</option><option value="NEAR_LIMIT">Near limit</option><option value="EXCEEDED">Over budget</option>
                </select>
                <select aria-label="Period" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)} className={selectCls}>
                  <option value="ALL">Any period</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option><option value="ONE_TIME">One-time</option>
                </select>
              </div>
              <div className="flex flex-col gap-3">
                {visible.map((c) => <BudgetRow key={c.id} card={c} selected={c.id === selected?.id} onClick={() => setSelectedId(c.id)} />)}
                {visible.length === 0 && (
                  <div className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                    <p>No budgets match these filters.</p>
                    {hasFilters && <button className="mt-2 font-semibold text-[var(--color-primary)] hover:underline" onClick={() => { setQuery(''); setStateFilter('ACTIVE'); setStatusFilter('ALL'); setPeriodFilter('ALL'); }}>Clear filters</button>}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {selected ? (
                <BudgetDetailPanel
                  key={selected.id}
                  budgetId={selected.id}
                  onEdit={() => openEdit(selected.id)}
                  onToggleArchive={(a) => void toggleArchive(selected, a)}
                  onDelete={() => { setDelError(''); setToDelete(selected); }}
                  onAddExpense={() => { setTxEditing(null); setTxOpen(true); }}
                  onEditTransaction={(t) => { setTxEditing(t); setTxOpen(true); }}
                />
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-[8px] bg-[var(--color-bg-card)] p-8 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-drop-low)]">Select a budget to see its breakdown.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <BudgetFormModal open={formOpen} budget={editing} onClose={() => setFormOpen(false)} onSaved={(b) => { setSelectedId(b.id); toast.success(editing ? 'Budget updated' : 'Budget created'); }} />
      <TransactionFormModal open={txOpen} transaction={txEditing} defaultBudgetId={txEditing ? undefined : selected?.id} onClose={() => setTxOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete “${toDelete?.name ?? ''}”?`}
        description={<>Your transactions stay. They simply stop counting towards this budget. To keep the history instead, <strong>archive</strong> it.</>}
        confirmLabel="Delete budget"
        destructive
        loading={delBusy}
        error={delError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </Layout>
  );
}
