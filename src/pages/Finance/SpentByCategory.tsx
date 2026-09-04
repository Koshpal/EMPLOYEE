import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layout } from '../../components/common/Layout';
import { Skeleton } from '../../components/common/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { getAnalyticsOverview, getBudgets } from '../../services/finance.service';
import type { AnalyticsOverview, Budget } from '../../types/finance.types';
import { SummarySection } from '../../components/dashboard/widgets';
import { SUMMARY_STYLES } from '../../components/dashboard/helpers';
import { IconBell, IconSettings2 } from '../../components/icons/figma';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { categoryByName, iconFor } from '../../data/financeCategories';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const iconBtn =
  'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

interface Row {
  name: string;
  color: string;
  icon: string;
  spent: number;
  alloted: number;
  pct: number;
}

export default function SpentByCategory() {
  const now = new Date();
  const analyticsRes = useAsync(() => getAnalyticsOverview(now.getFullYear(), now.getMonth() + 1), []);
  const budgetsRes = useAsync<Budget[]>(() => getBudgets(), []);

  const analytics: AnalyticsOverview | null = analyticsRes.data ?? null;
  const budgets: Budget[] = useMemo(() => budgetsRes.data ?? [], [budgetsRes.data]);
  const loading = analyticsRes.loading || budgetsRes.loading;

  // Alloted amount per category name, summed across every active budget's
  // top-level categories — this is the "budgeted" side of the comparison.
  const allotedByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of budgets) {
      for (const c of b.categories ?? []) {
        if (c.parentCategoryId) continue; // sub-categories don't get their own row here
        map.set(c.name, (map.get(c.name) ?? 0) + c.allottedAmount);
      }
    }
    return map;
  }, [budgets]);

  const rows: Row[] = useMemo(() => {
    const spent = analytics?.topCategories ?? [];
    return spent
      .map((c) => {
        const meta = categoryByName(c.name);
        const alloted = allotedByCategory.get(c.name) ?? 0;
        return {
          name: c.name,
          color: meta?.color ?? '#334eac',
          icon: meta?.icon ?? 'category',
          spent: c.amount,
          alloted,
          pct: alloted > 0 ? Math.min(100, Math.round((c.amount / alloted) * 100)) : 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [analytics, allotedByCategory]);

  const chartData = rows.map((r) => ({ name: r.name, value: Math.round(r.spent), color: r.color }));

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const overLimit = rows.filter((r) => r.alloted > 0 && r.spent > r.alloted).length;
  const withinLimit = rows.filter((r) => r.alloted > 0).length - overLimit;
  const totalCategories = rows.length;

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Spent by Category" />
    </div>
  );

  const summaryTiles = [
    { label: 'WITHIN LIMIT', value: String(withinLimit), suffix: `/${totalCategories}`, note: `${totalCategories} categories`, noteIcon: 'same' as const, ...SUMMARY_STYLES.spendings },
    { label: 'TOTAL CATEGORIES', value: String(totalCategories), note: 'This month', noteIcon: 'trend' as const, ...SUMMARY_STYLES.budget },
    { label: 'OVER LIMIT', value: String(overLimit), note: overLimit ? 'Needs attention' : 'All within limits', noteIcon: 'trend' as const, ...SUMMARY_STYLES.sessions },
    { label: 'TOTAL SPENT', value: formatINR(totalSpent), note: 'This month', noteIcon: 'trend' as const, ...SUMMARY_STYLES.savings },
  ];

  const tooltipContentStyle = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border-primary)',
    borderRadius: 12,
    fontSize: 12,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (value: any) => [formatINR(Number(value ?? 0)), ''];

  return (
    <Layout title="Spent by Category" headerActions={headerActions} headerBelow={headerBelow}>
      <div className="flex flex-col gap-6 pb-8">
        <motion.div {...fadeUp}>
          <SummarySection tiles={summaryTiles} loading={loading} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left — donut + legend, mirrors the dashboard's Spends by Category widget */}
          <div className="flex w-full flex-col gap-4 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] lg:w-[336px]">
            <div>
              <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">Spends by Category</h3>
              <p className="mt-1 font-label text-[12px] leading-[22px] text-[var(--color-text-tertiary)]">
                {totalCategories} {totalCategories === 1 ? 'Category' : 'Categories'}
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                      {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {chartData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-label text-[14px] leading-6 text-[var(--color-black-mid)]">{d.name}</span>
                      </div>
                      <span className="font-label text-[14px] font-medium leading-6 text-[var(--color-black-dark)]">{formatINR(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-body-sm text-[var(--color-text-tertiary)]">
                No spending recorded yet this month.
              </div>
            )}
          </div>

          {/* Right — per-category alloted vs spent breakdown */}
          <div className="min-w-0 flex-1 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
            <h3 className="mb-3 font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">Category Breakdown</h3>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-[12px]" />)}
              </div>
            ) : rows.length === 0 ? (
              <p className="rounded-[12px] border border-[rgba(14,15,12,0.12)] p-4 text-body-sm text-[var(--color-text-secondary)]">
                No transactions recorded this month yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {rows.map((r) => {
                  const Icon = iconFor(r.icon);
                  const over = r.alloted > 0 && r.spent > r.alloted;
                  const left = Math.max(0, r.alloted - r.spent);
                  return (
                    <div key={r.name} className="rounded-[12px] border border-[rgba(14,15,12,0.12)] p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: r.color }}>
                          <Icon className="h-5 w-5 text-white" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-black-dark)]">{r.name}</p>
                          <p className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">
                            {r.alloted > 0 ? `${formatINR(r.alloted)} Alloted` : 'No budget set'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`font-grotesque text-[16px] font-medium leading-[30px] ${over ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-primary)]'}`}>
                            {formatINR(r.spent)}
                          </p>
                          {r.alloted > 0 && (
                            <p className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">
                              {over ? `${formatINR(r.spent - r.alloted)} over` : `${formatINR(left)} left`}
                            </p>
                          )}
                        </div>
                      </div>
                      {r.alloted > 0 && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-white-light)]">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${r.pct}%`, backgroundColor: over ? 'var(--color-error-dark)' : r.color }}
                            />
                          </span>
                          <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-black-lightest)]">{r.pct}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
