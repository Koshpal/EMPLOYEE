import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info, Lightbulb, TriangleAlert, Sparkles } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { HeaderSettingsButton } from '../../components/common/HeaderSettingsButton';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { RangeFilter } from '../../components/spending/RangeFilter';
import { Card, Change, EmptyBlock, ErrorBlock, LoadBlock, Stat } from '../../components/spending/bits';
import { ProgressBar, STATUS_STYLE } from '../../components/budgets/BudgetDetailPanel';
import { CategoryIcon, DEFAULT_CATEGORY_COLOR } from '../../data/categoryIcons';
import { useApi } from '../../hooks/useApi';
import { getBudgetsInsight, getCategoriesInsight, getObservations, getOverviewInsight, getTrendsInsight } from '../../services/spending.service';
import { formatINR, formatPct } from '../../utils/money';
import { rangeCacheKey, selectionFromSearch } from '../../utils/range';
import type { Granularity, Observation, RangeSelection } from '../../types/spending.types';

const TABS = ['overview', 'categories', 'budgets', 'trends'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { overview: 'Overview', categories: 'Categories', budgets: 'Budgets', trends: 'Trends' };

const SEVERITY = {
  INFO: { Icon: Info, cls: 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]' },
  SUCCESS: { Icon: Lightbulb, cls: 'border-[var(--color-success-dark)]/40 bg-[var(--color-success-bg)] text-[var(--color-success-darkest,var(--color-success-dark))]' },
  WARNING: { Icon: TriangleAlert, cls: 'border-[var(--color-warning-dark,#d97706)]/40 bg-[var(--color-warning-bg,#fffbeb)] text-[var(--color-warning-dark,#b45309)]' },
  ALERT: { Icon: TriangleAlert, cls: 'border-[var(--color-error)]/40 bg-[var(--color-error-bg)] text-[var(--color-error-dark)]' },
} as const;

function Observations({ sel }: { sel: RangeSelection }) {
  const api = useApi(`insights/ai/${rangeCacheKey(sel)}`, () => getObservations(sel), { staleMs: 60_000 });
  if (api.initialLoading) return <LoadBlock height={120} label="Loading observations" />;
  if (api.error != null && !api.data) return <ErrorBlock what="your observations" onRetry={api.reload} />;
  const items: Observation[] = api.data?.observations ?? [];
  return (
    <Card title="Observations" aside={<span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Based only on your numbers</span>}>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">Nothing notable for this period yet. Record or categorise a few more transactions and check back.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((o) => {
            const { Icon, cls } = SEVERITY[o.severity];
            const href = o.budgetId ? '/finance/budgets' : o.categoryId ? `/finance/categories/${o.categoryId}` : null;
            return (
              <li key={o.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${cls}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="mt-0.5 text-sm opacity-90">{o.message}</p>
                  {href && <Link to={href} className="mt-1 inline-block text-xs font-semibold underline">View details</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {api.data && <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">{api.data.disclaimer}</p>}
    </Card>
  );
}

function Overview({ sel }: { sel: RangeSelection }) {
  const api = useApi(`insights/overview/${rangeCacheKey(sel)}`, () => getOverviewInsight(sel));
  if (api.initialLoading) return <div className="grid gap-4"><LoadBlock height={110} label="Loading overview" /><LoadBlock height={160} label="Loading" /></div>;
  if (api.error != null && !api.data) return <ErrorBlock what="your overview" onRetry={api.reload} />;
  const o = api.data!;
  const empty = o.incomeTransactionCount === 0 && o.expenseTransactionCount === 0;
  if (empty) {
    return (
      <>
        <EmptyBlock title="No transactions in this period" body="Pick a wider period, or add a transaction to start seeing where your money goes." action={<Link to="/finance/transactions" className="rounded-[8px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white">Go to transactions</Link>} />
      </>
    );
  }
  const prev = o.previousPeriod;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Income" value={formatINR(o.totalIncome)} sub={<Change pct={prev.incomeChangePct} upIsGood />} />
        <Stat label="Expenses" value={formatINR(o.totalExpenses)} sub={<Change pct={prev.expenseChangePct} />} />
        <Stat label="Net cash flow" value={<span className={o.netCashFlow < 0 ? 'text-[var(--color-error-dark)]' : ''}>{formatINR(o.netCashFlow)}</span>} />
        <Stat label="Savings rate" value={o.savingsRatePct === null ? '—' : formatPct(o.savingsRatePct)} sub={o.savingsRatePct === null ? <span className="text-xs text-[var(--color-text-tertiary)]">No income recorded</span> : undefined} />
      </div>

      {o.uncategorised.transactionCount > 0 && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3">
          <p className="text-sm text-[var(--color-text-primary)]">
            <strong>{o.uncategorised.transactionCount}</strong> expense{o.uncategorised.transactionCount === 1 ? '' : 's'} ({formatINR(o.uncategorised.totalSpent)}) {o.uncategorised.transactionCount === 1 ? 'has' : 'have'} no category, so they’re missing from your budgets.
          </p>
          <Link to="/finance/transactions?uncategorised=1" className="text-sm font-semibold text-[var(--color-primary)] underline">Categorise them</Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Budgets" aside={<Link to="/finance/budgets" className="text-xs font-semibold text-[var(--color-primary)]">Manage</Link>}>
          {o.budget.activeBudgets === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">You don’t have an active budget yet. <Link to="/finance/budgets" className="font-semibold text-[var(--color-primary)] underline">Create one</Link> to track your spending against a plan.</p>
          ) : (
            <>
              <div className="mb-1.5 flex justify-between text-sm"><span className="tabular-nums">{formatINR(o.budget.totalSpent)} of {formatINR(o.budget.totalAllocated)}</span><span className="tabular-nums text-[var(--color-text-secondary)]">{formatPct(o.budget.utilisationPct)}</span></div>
              <ProgressBar pct={o.budget.utilisationPct} color={o.budget.exceededCount ? STATUS_STYLE.EXCEEDED.bar : o.budget.nearLimitCount ? STATUS_STYLE.NEAR_LIMIT.bar : STATUS_STYLE.ON_TRACK.bar} label="Overall budget used" height={9} />
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{o.budget.activeBudgets} active · {o.budget.exceededCount} over · {o.budget.nearLimitCount} near limit</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{o.budget.note}</p>
            </>
          )}
        </Card>
        <Card title="Top spending category">
          {o.highestSpendingCategory ? (
            <Link to={`/finance/categories/${o.highestSpendingCategory.id}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-[var(--color-bg-secondary)]">
              <CategoryIcon icon={o.highestSpendingCategory.icon} color={o.highestSpendingCategory.color} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-grotesque text-[16px] font-medium">{o.highestSpendingCategory.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{formatPct(o.highestSpendingCategory.percentageOfTotal)} of your spending</p>
              </div>
              <p className="text-[18px] font-medium tabular-nums">{formatINR(o.highestSpendingCategory.totalSpent)}</p>
            </Link>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">No categorised spending in this period yet.</p>
          )}
          {o.refundsReceived > 0 && <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Refunds of {formatINR(o.refundsReceived)} are shown separately and not netted against spending.</p>}
        </Card>
      </div>
      <Observations sel={sel} />
    </div>
  );
}

function Categories({ sel }: { sel: RangeSelection }) {
  const api = useApi(`insights/categories/${rangeCacheKey(sel)}`, () => getCategoriesInsight(sel));
  if (api.initialLoading) return <LoadBlock height={320} label="Loading categories" />;
  if (api.error != null && !api.data) return <ErrorBlock what="your category breakdown" onRetry={api.reload} />;
  const d = api.data!;
  const rows = d.data.filter((c) => c.totalSpent > 0 || c.transactionCount > 0);
  const unc = d.uncategorised;
  if (rows.length === 0 && unc.transactionCount === 0) {
    return <EmptyBlock title="No spending in this period" body="Nothing to break down yet. Try a wider period." />;
  }
  const pie = [
    ...rows.map((c) => ({ name: c.categoryName, value: c.totalSpent, color: c.color ?? DEFAULT_CATEGORY_COLOR })),
    ...(unc.totalSpent > 0 ? [{ name: 'Uncategorised', value: unc.totalSpent, color: '#94A3B8' }] : []),
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card title="Share of spending">
        <div className="h-64" role="img" aria-label={`Spending by category, total ${formatINR(d.total)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2}>
                {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatINR(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-sm text-[var(--color-text-secondary)]">Total <strong className="tabular-nums text-[var(--color-text-primary)]">{formatINR(d.total)}</strong></p>
      </Card>
      <Card title="By category">
        <ul className="divide-y divide-[var(--color-border-primary)]">
          {rows.map((c) => (
            <li key={c.categoryId}>
              <Link to={`/finance/categories/${c.categoryId}`} className="flex items-center gap-3 py-3 hover:bg-[var(--color-bg-secondary)]">
                <CategoryIcon icon={c.icon} color={c.color} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.categoryName}{!c.isActive && <span className="ml-2 text-[10px] uppercase text-[var(--color-text-tertiary)]">Archived</span>}</p>
                    <p className="shrink-0 text-sm font-medium tabular-nums">{formatINR(c.totalSpent)}</p>
                  </div>
                  <ProgressBar pct={c.percentageOfTotal} color={c.color ?? DEFAULT_CATEGORY_COLOR} label={`${c.categoryName} share`} height={5} />
                  <p className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">{formatPct(c.percentageOfTotal)} · {c.transactionCount} txn{c.transactionCount === 1 ? '' : 's'} <Change pct={c.percentageChange} /></p>
                </div>
              </Link>
            </li>
          ))}
          {unc.transactionCount > 0 && (
            <li>
              <Link to="/finance/transactions?uncategorised=1" className="flex items-center gap-3 py-3 hover:bg-[var(--color-bg-secondary)]">
                <CategoryIcon icon="help-circle" color="#94A3B8" size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2"><p className="text-sm font-semibold">Uncategorised</p><p className="text-sm font-medium tabular-nums">{formatINR(unc.totalSpent)}</p></div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{formatPct(unc.percentageOfTotal)} · {unc.transactionCount} txns · tap to categorise</p>
                </div>
              </Link>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function Budgets() {
  const api = useApi('insights/budgets', getBudgetsInsight);
  if (api.initialLoading) return <LoadBlock height={240} label="Loading budgets" />;
  if (api.error != null && !api.data) return <ErrorBlock what="your budgets" onRetry={api.reload} />;
  const cards = (api.data?.data ?? []).filter((c) => c.isActive);
  if (cards.length === 0) return <EmptyBlock title="No active budgets" body="Create a budget to see how your spending compares with your plan." action={<Link to="/finance/budgets" className="rounded-[8px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white">Create a budget</Link>} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c) => {
        const st = STATUS_STYLE[c.status];
        return (
          <Link key={c.id} to="/finance/budgets" className="rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] hover:ring-1 hover:ring-[var(--color-primary)]/40">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="truncate font-grotesque text-[16px] font-medium">{c.name}</p><p className="text-xs text-[var(--color-text-secondary)]">{c.daysRemaining !== null ? `${c.daysRemaining} days left` : 'Ended'}</p></div>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
            </div>
            <div className="mt-3"><ProgressBar pct={c.utilisationPct} color={st.bar} label={`${c.name} used`} height={8} /></div>
            <p className="mt-2 flex justify-between text-sm"><span className="tabular-nums">{formatINR(c.currentSpending)} / {formatINR(c.budgetAmount)}</span><span className={`tabular-nums ${c.overBy > 0 ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-secondary)]'}`}>{c.overBy > 0 ? `${formatINR(c.overBy)} over` : `${formatINR(c.remainingAmount)} left`}</span></p>
            {c.projectedSpend !== null && c.projectedSpend > c.budgetAmount && c.overBy === 0 && <p className="mt-1 text-xs text-[var(--color-warning-dark,#b45309)]">On pace for {formatINR(c.projectedSpend)}</p>}
          </Link>
        );
      })}
    </div>
  );
}

function Trends({ sel, granularity, onGranularity }: { sel: RangeSelection; granularity: Granularity; onGranularity: (g: Granularity) => void }) {
  const api = useApi(`insights/trends/${rangeCacheKey(sel)}/${granularity}`, () => getTrendsInsight(sel, { granularity }));
  const data = useMemo(() => (api.data?.series ?? []).map((p) => ({ label: p.label, total: p.total })), [api.data]);
  return (
    <Card
      title="Spending over time"
      aside={
        <div role="group" aria-label="Group by" className="inline-flex rounded-lg bg-[var(--color-bg-tertiary)] p-0.5">
          {(['DAY', 'WEEK', 'MONTH'] as const).map((g) => (
            <button key={g} aria-pressed={granularity === g} onClick={() => onGranularity(g)} className={`rounded-md px-3 py-1 text-xs font-semibold ${granularity === g ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>{g[0] + g.slice(1).toLowerCase()}</button>
          ))}
        </div>
      }
    >
      {api.initialLoading ? <LoadBlock height={260} label="Loading trend" /> : api.error != null && !api.data ? <ErrorBlock what="your trend" onRetry={api.reload} /> : data.length === 0 || api.data!.total === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No spending in this period.</p>
      ) : (
        <>
          <div className="h-64" role="img" aria-label={`Spending per ${granularity.toLowerCase()}, total ${formatINR(api.data!.total)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-primary)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Legend />
                <Bar dataKey="total" name="Spent" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Total {formatINR(api.data!.total)} · average {formatINR(api.data!.averagePerBucket)} per {granularity.toLowerCase()}</p>
        </>
      )}
    </Card>
  );
}

export default function SpendingInsights() {
  const [sp, setSp] = useSearchParams();
  const tab: Tab = (TABS as readonly string[]).includes(sp.get('tab') ?? '') ? (sp.get('tab') as Tab) : 'overview';
  const sel = useMemo(() => selectionFromSearch(sp), [sp]);
  const granularity: Granularity = (['DAY', 'WEEK', 'MONTH'] as const).find((g) => g === sp.get('by')) ?? 'WEEK';

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSp(next, { replace: true });
  }
  const onRange = (r: RangeSelection) => update({ range: r.range, from: r.range === 'CUSTOM' ? r.from : undefined, to: r.range === 'CUSTOM' ? r.to : undefined });

  return (
    <Layout title="Spending insights" headerActions={<HeaderSettingsButton />} headerBelow={<FinanceTabs active="Insights" />}>
      <div className="flex flex-col gap-5 pb-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div role="tablist" aria-label="Insight sections" className="inline-flex self-start rounded-xl bg-[var(--color-bg-tertiary)] p-1">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => update({ tab: t === 'overview' ? undefined : t })} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>{TAB_LABEL[t]}</button>
            ))}
          </div>
          {tab !== 'budgets' && <RangeFilter value={sel} onChange={onRange} />}
        </div>
        {tab === 'overview' && <Overview sel={sel} />}
        {tab === 'categories' && <Categories sel={sel} />}
        {tab === 'budgets' && <Budgets />}
        {tab === 'trends' && <Trends sel={sel} granularity={granularity} onGranularity={(g) => update({ by: g === 'WEEK' ? undefined : g })} />}
      </div>
    </Layout>
  );
}
