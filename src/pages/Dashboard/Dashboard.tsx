import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../../components/common/Layout';
import { SessionDetailsModal } from '../../components/modals/SessionDetailsModal';
import { useAsync } from '../../hooks/useAsync';
import { coachService } from '../../services/coach.service';
import {
  getWellnessOverview, getAnalyticsOverview, getSpendingTrends, getGoals,
  getBudgets, getBudgetProgress, getConsent,
} from '../../services/finance.service';
import type { Consultation, ConsultationStats } from '../../types/booking.types';
import type {
  WellnessOverview, AnalyticsOverview, FinancialGoal, Budget, BudgetProgress,
} from '../../types/finance.types';
import {
  SummarySection, UpcomingSessionCard, IncomeExpenseChart,
  SpendsByCategoryCard, GoalsCompletionCard, FinancialGoalsTable, BudgetsWidget,
  DuesReminderCard,
} from '../../components/dashboard/widgets';
import { SUMMARY_STYLES, inr, type GoalRow } from '../../components/dashboard/helpers';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function fmtDay(iso?: string) {
  if (!iso) return { month: '—', day: '—', weekday: '' };
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}
function fmtTimeRange(start?: string, end?: string) {
  if (!start) return '';
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const s = new Date(start).toLocaleTimeString('en-US', opts);
  const e = end ? new Date(end).toLocaleTimeString('en-US', opts) : '';
  return e ? `${s}-${e}` : s;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [detailsFor, setDetailsFor] = useState<Consultation | null>(null);

  // Each domain loads independently: fast endpoints paint immediately, slow ones
  // fill in with their own skeleton. No single page-wide spinner.
  const statsRes = useAsync(() => coachService.getMyConsultationStats(), []);
  const latestRes = useAsync(() => coachService.getLatestConsultation(), []);
  const wellnessRes = useAsync(() => getWellnessOverview(), []);
  const analyticsRes = useAsync(() => getAnalyticsOverview(), []);
  const trendsRes = useAsync(() => getSpendingTrends(6), []);
  const goalsRes = useAsync(() => getGoals(), []);
  const budgetsRes = useAsync<Budget[]>(
    () =>
      getConsent()
        .then((c) => (c.hasConsented ? getBudgets() : ([] as Budget[])))
        .catch(() => [] as Budget[]),
    [],
  );

  const stats: ConsultationStats | null = statsRes.data ?? null;
  const latest: Consultation | null = latestRes.data ?? null;
  const wellness: WellnessOverview | null = wellnessRes.data ?? null;
  const analytics: AnalyticsOverview | null = analyticsRes.data ?? null;
  // Memoised so their identity is stable for the downstream useMemo deps.
  const goals: FinancialGoal[] = useMemo(() => goalsRes.data ?? [], [goalsRes.data]);
  const budgets: Budget[] = useMemo(() => budgetsRes.data ?? [], [budgetsRes.data]);

  const trends = useMemo(
    () =>
      (trendsRes.data?.trends ?? []).slice(-7).map((t) => ({
        name: t.period,
        Income: t.totalIncome,
        Expense: t.totalExpense,
      })),
    [trendsRes.data],
  );

  // Budget progress depends on the budgets list; fetches once it lands.
  const progressRes = useAsync<Record<string, BudgetProgress>>(async () => {
    const list = budgetsRes.data ?? [];
    const entries = await Promise.all(
      list.slice(0, 3).map(async (b) => {
        try { return [b.id, await getBudgetProgress(b.id)] as const; } catch { return null; }
      }),
    );
    return Object.fromEntries(entries.filter(Boolean) as [string, BudgetProgress][]);
  }, [budgetsRes.data]);
  const budgetProgress: Record<string, BudgetProgress> = progressRes.data ?? {};

  const summaryTiles = useMemo(() => {
    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
    return [
      {
        label: 'Spendings',
        value: inr(wellness?.monthlyExpenses ?? 0),
        suffix: `/ ${inr(wellness?.monthlyIncome ?? 0)}`,
        note: wellness
          ? `${wellness.expenseChange > 0 ? '+' : ''}${wellness.expenseChange}% vs last month`
          : 'This month',
        noteIcon: 'trend' as const,
        ...SUMMARY_STYLES.spendings,
      },
      {
        label: 'BUDGET',
        value: inr(totalBudgeted),
        note: budgets.length ? `Across ${budgets.length} budget${budgets.length > 1 ? 's' : ''}` : 'Similar to last month',
        noteIcon: 'same' as const,
        ...SUMMARY_STYLES.budget,
      },
      {
        label: 'SESSIONS ATTENDED',
        value: String(stats?.confirmed ?? 0),
        note: `${stats?.thisMonth ?? 0} this month`,
        noteIcon: 'trend' as const,
        ...SUMMARY_STYLES.sessions,
      },
      {
        label: 'SAVINGS',
        value: inr(wellness?.savings ?? 0),
        note: wellness ? `${wellness.savingsRate}% savings rate` : 'This month',
        noteIcon: 'trend' as const,
        ...SUMMARY_STYLES.savings,
      },
    ];
  }, [wellness, budgets, stats]);

  const goalRows: GoalRow[] = goals.slice(0, 6).map((g) => ({
    name: g.title,
    target: `₹${inr(g.targetAmount)}`,
    saved: `₹${inr(g.savedAmount)}`,
    deadline: fmtDate(g.goalDate),
    progress: g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0,
  }));

  const goalStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.isAchieved || g.savedAmount >= g.targetAmount).length;
    const upcoming = goals.filter((g) => g.savedAmount === 0).length;
    const pending = total - completed - upcoming;
    return {
      total,
      completed,
      pending: Math.max(0, pending),
      upcoming,
      percent: total ? (completed / total) * 100 : 0,
    };
  }, [goals]);

  const budgetRows = budgets.slice(0, 3).map((b) => ({
    name: b.title,
    tasks: (b.categories ?? []).filter((c) => !c.parentCategoryId).length,
    progress: budgetProgress[b.id]?.percentageSpent ?? 0,
  }));

  const catData = (analytics?.topCategories ?? []).slice(0, 6).map((c) => ({ name: c.name, value: Math.round(c.amount) }));
  const day = fmtDay(latest?.slot?.startTime);

  return (
    <Layout title="Overview">
      <div className="flex flex-col gap-6 pb-8">
        <motion.div {...fadeUp}>
          <SummarySection tiles={summaryTiles} loading={wellnessRes.loading} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <UpcomingSessionCard
            loading={latestRes.loading}
            hasSession={!!latest}
            month={day.month}
            day={day.day}
            name={latest?.coach?.fullName ?? 'No upcoming session'}
            role={latest?.coach?.expertise?.[0] ?? 'Book a coaching session'}
            weekday={day.weekday}
            time={fmtTimeRange(latest?.slot?.startTime, latest?.slot?.endTime)}
            status={latest ? 'Confirmed' : 'None'}
            onReschedule={() => navigate('/sessions')}
            onDetails={() => latest && setDetailsFor(latest)}
            onJoin={() => (latest?.meetingLink ? window.open(latest.meetingLink, '_blank') : navigate('/coaches'))}
          />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex flex-col gap-6 lg:flex-row">
          <IncomeExpenseChart
            loading={trendsRes.loading}
            data={trends}
            subLeft={trends.length ? `₹${inr(trends[trends.length - 1].Income)} in` : undefined}
            subRight={trends.length ? `₹${inr(trends[trends.length - 1].Expense)} out` : undefined}
          />
          <SpendsByCategoryCard
            loading={analyticsRes.loading}
            data={catData}
            subCatCount={catData.length}
            onViewAll={() => navigate('/finance/spent-by-category')}
          />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="flex flex-col gap-6 lg:flex-row">
          <GoalsCompletionCard {...goalStats} loading={goalsRes.loading} />
          <FinancialGoalsTable loading={goalsRes.loading} rows={goalRows} onViewAll={() => navigate('/finance/goals')} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="flex flex-col gap-6 lg:flex-row">
          <BudgetsWidget
            loading={budgetsRes.loading}
            rows={budgetRows}
            onViewAll={() => navigate('/finance/budgets')}
          />
          <DuesReminderCard maxItems={4} onViewAll={() => navigate('/finance/dues-reminders')} />
        </motion.div>
      </div>

      <SessionDetailsModal
        isOpen={!!detailsFor}
        session={detailsFor}
        onClose={() => setDetailsFor(null)}
        onFeedbackSubmitted={() => setDetailsFor(null)}
      />
    </Layout>
  );
};

export default Dashboard;
