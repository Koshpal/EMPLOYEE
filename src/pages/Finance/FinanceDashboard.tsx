import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Repeat, AlertCircle,
  ChevronRight, RefreshCw, Zap, Target,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Layout } from '../../components/common/Layout';
import { useAsync } from '../../hooks/useAsync';
import { Skeleton } from '../../components/common/Skeleton';
import { ScoreRing } from '../../components/finance/ScoreRing';
import { InsightCard } from '../../components/finance/InsightCard';
import { TransactionItem } from '../../components/finance/TransactionItem';
import {
  getWellnessOverview, getLatestScore, getSmartInsights,
  getTransactions, getAnalyticsOverview, getSpendingTrends,
  getConsent, generateInsights, calculateScore, getGoals,
} from '../../services/finance.service';
import type { WellnessOverview, FinancialScore, FinancialInsight, Transaction, AnalyticsOverview, FinancialGoal, MonthlyTrend } from '../../types/finance.types';
import { CATEGORY_COLORS } from '../../components/finance/TransactionItem';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function formatINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Consent is the one gate; everything else loads on its own timeline so each
  // card shows its own skeleton and fast endpoints don't wait on slow ones.
  const consentRes = useAsync(() => getConsent(), []);
  useEffect(() => {
    if (consentRes.data && !consentRes.data.hasConsented) {
      navigate('/finance/consent');
    }
  }, [consentRes.data, navigate]);

  const overviewRes = useAsync(() => getWellnessOverview(), []);
  const scoreRes = useAsync(() => getLatestScore(), []);
  const insightsRes = useAsync(() => getSmartInsights(5), []);
  const txnsRes = useAsync(() => getTransactions({ page: 1, limit: 8 }), []);
  const analyticsRes = useAsync(() => getAnalyticsOverview(), []);
  const trendsRes = useAsync(() => getSpendingTrends(6), []);
  const goalsRes = useAsync(() => getGoals(), []);

  const overview: WellnessOverview | null = overviewRes.data ?? null;
  const score: FinancialScore | null = scoreRes.data ?? null;
  const transactions: Transaction[] = txnsRes.data?.transactions ?? [];
  const analytics: AnalyticsOverview | null = analyticsRes.data ?? null;
  const trends: MonthlyTrend[] = trendsRes.data?.trends ?? [];
  const goals: FinancialGoal[] = goalsRes.data ?? [];

  // "Mark read" overlays locally without refetching the list.
  const [readInsightIds, setReadInsightIds] = useState<Set<string>>(new Set());
  const insights: FinancialInsight[] = (insightsRes.data ?? []).map((i) =>
    readInsightIds.has(i.id) ? { ...i, isRead: true } : i,
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([generateInsights(), calculateScore()]);
    // Each widget re-fetches independently and shows its own skeleton meanwhile.
    [overviewRes, scoreRes, insightsRes, txnsRes, analyticsRes, trendsRes, goalsRes]
      .forEach((r) => r.reload());
    setRefreshing(false);
  };

  if (consentRes.loading) {
    return (
      <Layout title="Financial Wellness">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        </div>
      </Layout>
    );
  }

  const trendData = trends.slice(-6).map((t) => ({
    name: t.period,
    Income: t.totalIncome,
    Expenses: t.totalExpense,
  }));

  const pieData = (analytics?.topCategories ?? []).slice(0, 6).map((c) => ({
    name: c.name,
    value: Math.round(c.amount),
    color: (CATEGORY_COLORS as Record<string, string>)[c.name] ?? '#7f8c8d',
  }));

  return (
    <Layout title="Financial Wellness">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div {...fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-[var(--color-text-primary)]">Financial Wellness</h1>
            <p className="text-body-md text-[var(--color-text-secondary)] mt-1">
              Your personal financial intelligence dashboard
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </motion.div>

        {/* Score + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Score Card */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate('/finance/score')}
          >
            <p className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Wellness Score</p>
            {scoreRes.loading ? (
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            ) : (
              <ScoreRing score={score?.score ?? 0} size={120} />
            )}
            <div className="text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">Tap to view breakdown</p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {overviewRes.loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[104px] rounded-2xl" />
                ))
              : [
              {
                label: 'Monthly Income',
                value: formatINR(overview?.monthlyIncome ?? 0),
                icon: TrendingUp,
                color: 'var(--color-success-dark)',
                bg: 'var(--color-success-bg)',
                sub: 'This month',
              },
              {
                label: 'Monthly Expenses',
                value: formatINR(overview?.monthlyExpenses ?? 0),
                icon: TrendingDown,
                color: 'var(--color-error-dark)',
                bg: 'rgba(245,90,81,0.1)',
                sub: overview ? `${overview.expenseChange > 0 ? '+' : ''}${overview.expenseChange}% vs last month` : '—',
              },
              {
                label: 'Savings',
                value: formatINR(overview?.savings ?? 0),
                icon: Wallet,
                color: 'var(--color-primary)',
                bg: 'var(--color-primary-lightest)',
                sub: overview ? `${overview.savingsRate}% rate` : '—',
              },
              {
                label: 'Subscriptions',
                value: formatINR(overview?.subscriptionSpend ?? 0),
                icon: Repeat,
                color: '#3498db',
                bg: 'rgba(52,152,219,0.1)',
                sub: `${overview?.activeSubscriptions ?? 0} active`,
              },
              {
                label: 'EMI Load',
                value: formatINR(overview?.emiSpend ?? 0),
                icon: Zap,
                color: 'var(--color-warning-dark)',
                bg: 'var(--color-warning-bg)',
                sub: overview ? `${overview.emiRatio}% of income` : '—',
              },
              {
                label: 'Burn Rate',
                value: `${overview?.burnRatePercent ?? 0}%`,
                icon: AlertCircle,
                color: (overview?.burnRatePercent ?? 0) > 90 ? 'var(--color-error-dark)' : 'var(--color-text-secondary)',
                bg: (overview?.burnRatePercent ?? 0) > 90 ? 'rgba(245,90,81,0.1)' : 'var(--color-bg-tertiary)',
                sub: 'Projected monthly spend',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">{stat.label}</span>
                </div>
                <p className="text-h4 text-[var(--color-text-primary)] font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend Chart */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h5 text-[var(--color-text-primary)]">Income vs Expenses</h3>
              <button
                onClick={() => navigate('/finance/analytics')}
                className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {trendsRes.loading ? (
              <Skeleton className="h-48 w-full" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#80b597" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#80b597" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#334eac" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#334eac" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', borderRadius: 12 }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#80b597" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#334eac" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">
                No trend data yet. Sync transactions to see trends.
              </div>
            )}
          </motion.div>

          {/* Category Pie */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h5 text-[var(--color-text-primary)]">Spending Breakdown</h3>
              <button
                onClick={() => navigate('/finance/analytics')}
                className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {analyticsRes.loading ? (
              <Skeleton className="h-48 w-full" />
            ) : pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, '']}
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', borderRadius: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                        ₹{d.value.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">
                No spending data yet. Sync your transactions to see breakdown.
              </div>
            )}
          </motion.div>
        </div>

        {/* Goals Preview */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.28 }}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-primary-lightest)]">
                <Target className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-h5 text-[var(--color-text-primary)]">Financial Goals</h3>
            </div>
            <button
              onClick={() => navigate('/finance/goals')}
              className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
            >
              {goals.length > 0 ? 'View all' : 'Set goals'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {goalsRes.loading ? (
            <Skeleton className="h-28 w-full" />
          ) : goals.length > 0 ? (() => {
            const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
            const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
            const completed = goals.filter((g) => g.savedAmount >= g.targetAmount).length;
            const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{goals.length} goal{goals.length !== 1 ? 's' : ''} · {completed} completed</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{overallPct}% overall</span>
                </div>
                <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${overallPct}%`, backgroundColor: 'var(--color-primary)' }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {goals.slice(0, 3).map((g) => {
                    const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
                    return (
                      <div key={g.id} className="bg-[var(--color-bg-secondary)] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{g.iconResId}</span>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{g.title}</span>
                        </div>
                        <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-1.5 mb-1">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? 'var(--color-success-dark)' : 'var(--color-primary)' }} />
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{pct}% saved</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">No goals yet.</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Set savings goals and track your progress here.</p>
            </div>
          )}
        </motion.div>

        {/* Bottom Row: Insights + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Smart Insights */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.3 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h5 text-[var(--color-text-primary)]">Smart Insights</h3>
              <button
                onClick={() => navigate('/finance/insights')}
                className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {insightsRes.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 4).map((ins) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    compact
                    onRead={() => setReadInsightIds((prev) => new Set(prev).add(ins.id))}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">No insights yet.</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Sync transactions to generate smart insights.</p>
              </div>
            )}
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.35 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h5 text-[var(--color-text-primary)]">Recent Transactions</h3>
              <button
                onClick={() => navigate('/finance/transactions')}
                className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {txnsRes.loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-[var(--color-border-primary)]">
                {transactions.slice(0, 6).map((txn) => (
                  <TransactionItem key={txn.id} transaction={txn} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">No transactions yet.</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Enable SMS sync from the mobile app to auto-import transactions.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
