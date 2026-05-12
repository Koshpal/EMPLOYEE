import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { getAnalyticsOverview, getSpendingTrends } from '../../services/finance.service';
import type { AnalyticsOverview } from '../../types/finance.types';
import { CATEGORY_COLORS } from '../../components/finance/TransactionItem';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export default function Analytics() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getAnalyticsOverview(selectedYear, selectedMonth),
      getSpendingTrends(12),
    ]).then(([anal, tr]) => {
      if (anal.status === 'fulfilled') setAnalytics(anal.value);
      if (tr.status === 'fulfilled') setTrends((tr.value as any).trends ?? []);
    }).finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const now2 = new Date();
    if (selectedYear === now2.getFullYear() && selectedMonth === now2.getMonth() + 1) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  const trendData = trends.map((t) => ({
    name: `${MONTHS[t.month - 1]} ${String(t.year).slice(2)}`,
    Income: Math.round(t.totalIncome),
    Expenses: Math.round(t.totalExpense),
    Savings: Math.round(t.savings),
  }));

  const pieData = (analytics?.topCategories ?? []).map((c) => ({
    name: c.name,
    value: Math.round(c.amount),
    color: (CATEGORY_COLORS as Record<string, string>)[c.name] ?? '#7f8c8d',
  }));

  const weeklyData = (analytics?.weeklyBreakdown ?? []).map((w) => ({
    name: w.week,
    Income: Math.round(w.income),
    Expenses: Math.round(w.expense),
  }));

  const tooltipContentStyle = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border-primary)',
    borderRadius: 12,
    fontSize: 12,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter = (value: any) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, ''];

  return (
    <Layout title="Analytics">
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        {/* Header with month selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-h3 text-[var(--color-text-primary)]">Analytics</h1>
          <div className="flex items-center gap-1 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
            <span className="text-sm font-bold text-[var(--color-text-primary)] px-2 min-w-[90px] text-center">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-bg-card)] rounded-2xl animate-pulse border border-[var(--color-border-primary)]" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Income', value: analytics?.income ?? 0, color: '#80b597' },
              { label: 'Expenses', value: analytics?.expenses ?? 0, color: '#f55a51' },
              { label: 'Savings', value: analytics?.savings ?? 0, color: '#334eac' },
              { label: 'Savings Rate', value: `${analytics?.savingsRate ?? 0}%`, color: '#f5a038', raw: true },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-4">
                <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-2">{stat.label}</p>
                <p className="text-h4 font-bold tabular-nums" style={{ color: stat.color }}>
                  {stat.raw ? stat.value : formatINR(stat.value as number)}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Monthly Trend */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">12-Month Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipContentStyle} formatter={tooltipFormatter} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="#80b597" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#334eac" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">No trend data available</div>
          )}
        </div>

        {/* Category + Weekly side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Donut */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
            <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Category Breakdown</h3>
            {pieData.length > 0 ? (
              <div className="flex items-start gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 pt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-[var(--color-text-secondary)]">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">
                        {formatINR(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">No category data</div>
            )}
          </div>

          {/* Weekly */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
            <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Weekly Breakdown</h3>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={tooltipFormatter} />
                  <Bar dataKey="Income" fill="#80b597" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#334eac" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">No weekly data</div>
            )}
          </div>
        </div>

        {/* Savings trend line */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Savings Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipContentStyle} formatter={tooltipFormatter} />
                <Line type="monotone" dataKey="Savings" stroke="#80b597" strokeWidth={2.5} dot={{ r: 4, fill: '#80b597' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-[var(--color-text-tertiary)] text-sm">No savings data available</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
