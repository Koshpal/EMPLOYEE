import React, { useEffect, useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import {
  getReminders, createReminder, updateReminder, deleteReminder,
  type Reminder as ApiReminder,
} from '../../services/reminder.service';
import { Badge } from '../ui/Badge';
import {
  IconAngleDown, IconAngleRight, IconMoreOptions, IconClock, IconTrendArrow,
  IconComparison, IconArrowUpRight, IconCalendarCheck, IconCheckCircleFilled, IconPlus,
} from '../icons/figma';
import { inr } from './helpers';
import { Skeleton, InlineLoader } from '../common/Skeleton';

/* ── shared ─────────────────────────────────────────────────────────────── */

/** Figma "Monthly" filter button — outline, 40px, Outfit 14. */
export function PeriodButton({
  value = 'Monthly',
  variant = 'outline',
  onClick,
}: {
  value?: string;
  variant?: 'outline' | 'ghost';
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 items-center gap-1 rounded-[8px] pl-4 pr-2.5 text-body-sm transition-colors ${
        variant === 'outline'
          ? 'border border-[var(--color-border-primary)] text-[var(--color-black-light)] hover:border-[var(--color-primary)]'
          : 'text-[var(--color-primary)]'
      }`}
    >
      {value}
      <IconAngleDown size={20} />
    </button>
  );
}

/** Figma widget card — white, radius 8, p-16, Drop Shadow Low. */
export function WidgetCard({
  title,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)] ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={`flex min-h-0 flex-1 flex-col ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function Kebab() {
  return <IconMoreOptions size={24} className="text-[var(--color-text-tertiary)]" />;
}

/** Small "view all" link used to open a dashboard card's full tab page. */
function ViewAllLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-10 items-center gap-1 pl-4 pr-2.5 text-body-sm text-[var(--color-primary)]">
      view all
      <IconAngleRight size={20} />
    </button>
  );
}

/* ── Summary ────────────────────────────────────────────────────────────── */

type SummaryTile = {
  label: string;
  value: string;
  suffix?: string;
  note: string;
  Icon: React.FC<{ size?: number | string; className?: string }>;
  bg: string;
  circle: string;
  labelColor: string;
  noteIcon: 'trend' | 'same';
};

export function SummarySection({ tiles, loading = false }: { tiles: SummaryTile[]; loading?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-[8px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
          Summary
        </h3>
        <PeriodButton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`s-${i}`} className="min-h-[196px] rounded-[16px]" />
          ))}
        {!loading &&
          tiles.map((t) => (
          <div
            key={t.label}
            className="flex min-h-[196px] flex-col justify-center gap-4 rounded-[16px] px-4 py-6"
            style={{ backgroundColor: t.bg }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[25px] text-white"
              style={{ backgroundColor: t.circle }}
            >
              <t.Icon size={20} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] leading-[26px]" style={{ color: t.labelColor }}>
                {t.label}
              </p>
              <p className="flex items-baseline gap-1 text-[var(--color-black-mid)]">
                <span className="font-heading text-[24px] font-semibold leading-[36px]">{t.value}</span>
                {t.suffix && (
                  <span className="text-body-sm text-[var(--color-black-mid)]">{t.suffix}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex items-center rounded-full bg-white p-0.5">
                {t.noteIcon === 'trend' ? (
                  <IconTrendArrow size={16} className="text-[var(--color-success)]" />
                ) : (
                  <IconComparison size={16} className="text-[var(--color-success)]" />
                )}
              </span>
              <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-black-mid)]">
                {t.note}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Upcoming Session ───────────────────────────────────────────────────── */

export function UpcomingSessionCard({
  month = '—',
  day = '—',
  name = 'No upcoming session',
  role = 'Book a coaching session',
  weekday = '',
  time = '',
  status = 'None',
  loading = false,
  hasSession = true,
  onReschedule,
  onDetails,
  onJoin,
}: {
  month?: string;
  day?: string;
  name?: string;
  role?: string;
  weekday?: string;
  time?: string;
  status?: string;
  loading?: boolean;
  hasSession?: boolean;
  onReschedule?: () => void;
  onDetails?: () => void;
  onJoin?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-center gap-2.5">
        <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-dark)]">
          Upcoming Session
        </h3>
        {!loading && hasSession && <Badge variant="secondary">{status}</Badge>}
      </div>
      {loading ? (
        <Skeleton className="h-[104px] rounded-[12px]" />
      ) : !hasSession ? (
        <div className="flex flex-col items-center justify-between gap-4 rounded-[12px] border border-[rgba(35,35,35,0.1)] bg-[var(--color-bg-card)] p-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[16px] leading-7 text-[var(--color-black-dark)]">No upcoming session</p>
            <p className="text-body-sm text-[var(--color-grey-darkest)]">
              Book a 1-on-1 with a financial coach to see it here.
            </p>
          </div>
          <button
            onClick={onJoin}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] px-5 text-[15px] leading-7 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
          >
            Find a coach
            <IconArrowUpRight size={20} />
          </button>
        </div>
      ) : (
      <div className="flex flex-col items-center gap-4 rounded-[12px] border border-[rgba(35,35,35,0.1)] bg-[var(--color-bg-card)] p-4 lg:flex-row lg:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center rounded-[12px] bg-[var(--color-white-mid)] px-5 py-2">
              <span className="text-body-sm text-black">{month}</span>
              <span className="font-label text-[24px] font-semibold leading-8 text-black">{day}</span>
            </div>
            <span className="hidden h-[68px] w-px bg-[var(--color-border-primary)] sm:block" />
          </div>
          <div className="flex flex-col items-center gap-6 py-0.5 sm:flex-row">
            <div className="flex flex-col items-start">
              <p className="text-[20px] leading-9 text-[var(--color-black-dark)]">{name}</p>
              <p className="text-[16px] leading-7 text-[var(--color-grey-darkest)]">{role}</p>
            </div>
            <div className="flex h-[56px] items-center gap-3 rounded-[8px] border-[0.8px] border-[var(--color-border-primary)] bg-white/60 px-3 py-2.5">
              <IconClock size={24} className="text-[var(--color-black-dark)]" />
              <span className="text-[16px] leading-7 text-[var(--color-black-dark)]">
                {weekday}. {time}
              </span>
              <span className="text-[19px] font-extralight text-[var(--color-grey-mid)]">|</span>
              <button
                onClick={onReschedule}
                className="flex items-center gap-1.5 text-[16px] leading-7 text-[var(--color-black-dark)]"
              >
                <IconCalendarCheck size={20} />
                Reschedule
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDetails}
            className="flex h-12 items-center justify-center rounded-[8px] px-6 text-[16px] leading-7 text-[var(--color-primary)] underline"
          >
            View Details
          </button>
          <button
            onClick={onJoin}
            className="flex h-12 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] pl-6 pr-3 text-[16px] leading-7 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
          >
            Join&nbsp;Session
            <IconArrowUpRight size={24} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

/* ── Income vs Expense (line) ──────────────────────────────────────────── */

export function IncomeExpenseChart({
  data,
  subLeft,
  subRight,
  loading = false,
}: {
  data: { name: string; Income: number; Expense: number }[];
  subLeft?: string;
  subRight?: string;
  loading?: boolean;
}) {
  const series = data.length
    ? data
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => ({ name, Income: 0, Expense: 0 }));
  if (loading) {
    return (
      <WidgetCard title="Income vs Expense" className="h-full flex-1">
        <Skeleton className="h-[236px] w-full" />
      </WidgetCard>
    );
  }
  return (
    <WidgetCard title="Income vs Expense" className="h-full flex-1">
      <div className="mb-2 flex items-center gap-2.5 font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">
        {subLeft && <span>{subLeft}</span>}
        {subRight && <span>{subRight}</span>}
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-primary)" strokeDasharray="0" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-black-mid)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: 'var(--color-black-mid)' }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
              }
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-white-light)',
                boxShadow: 'var(--shadow-soft)',
                fontSize: 12,
              }}
              formatter={((v: unknown) => `₹${inr(Number(v))}`) as never}
            />
            <Line type="monotone" dataKey="Income" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="Expense" stroke="var(--color-warning)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4">
        <Legend color="var(--color-primary)" label="Income" />
        <Legend color="var(--color-warning)" label="Expense" />
      </div>
    </WidgetCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-body-sm text-[var(--color-black-mid)]">
      <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/* ── Spends by Category (donut) ────────────────────────────────────────── */

const CAT_COLORS = ['var(--color-secondary-500)', 'var(--color-primary)', 'var(--color-warning)', '#7ea8f8', '#a5d6a7', '#adadad'];

export function SpendsByCategoryCard({
  data,
  subCatCount = 0,
  loading = false,
  onViewAll,
}: {
  data: { name: string; value: number }[];
  subCatCount?: number;
  loading?: boolean;
  onViewAll?: () => void;
}) {
  const slices = data.slice(0, 6);
  const action = (
    <div className="flex items-center gap-1">
      {onViewAll && <ViewAllLink onClick={onViewAll} />}
      <PeriodButton />
    </div>
  );
  if (loading) {
    return (
      <WidgetCard title="Spends by Category" action={action} className="w-full lg:w-[336px]">
        <Skeleton className="h-[200px] w-full" />
      </WidgetCard>
    );
  }
  return (
    <WidgetCard
      title="Spends by Category"
      action={action}
      className="w-full lg:w-[336px]"
    >
      <div className="mb-3 flex gap-2.5 font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">
        <span>{slices.length} Categories</span>
        <span>{subCatCount} Sub-categories</span>
      </div>
      {slices.length ? (
        <div className="flex flex-1 items-center">
          <div className="h-[172px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={4}
                  cornerRadius={8}
                  stroke="none"
                >
                  {slices.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={((v: unknown) => `₹${inr(Number(v))}`) as never} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 p-2.5">
            {slices.map((s, i) => (
              <div key={s.name} className="flex h-[23px] items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                />
                <span className="truncate text-body-sm text-[var(--color-black-mid)]">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No allocation data available" body="Sync transactions to see category spend." />
      )}
    </WidgetCard>
  );
}

/* ── Goals Completion gauge ────────────────────────────────────────────── */

export function GoalsCompletionCard({
  percent,
  total,
  completed,
  pending,
  upcoming,
  loading = false,
}: {
  percent: number;
  total: number;
  completed: number;
  pending: number;
  upcoming: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <WidgetCard title="Goals Completion Rate" action={<PeriodButton value="All" />} className="w-full lg:w-[336px]">
        <Skeleton className="h-[200px] w-full" />
      </WidgetCard>
    );
  }
  if (total === 0) {
    return (
      <WidgetCard title="Goals Completion Rate" action={<PeriodButton value="All" />} className="w-full lg:w-[336px]">
        <EmptyState title="No goals yet" body="Set a savings goal to track your completion rate here." />
      </WidgetCard>
    );
  }
  return (
    <WidgetCard
      title="Goals Completion Rate"
      action={<PeriodButton value="All" />}
      className="w-full lg:w-[336px]"
    >
      <div className="flex flex-col items-center gap-4">
        <Gauge percent={percent} />
        <div className="flex w-full items-start justify-between">
          {[
            { n: total, l: 'Total Goal', c: 'var(--color-black-mid)' },
            { n: completed, l: 'Completed', c: 'var(--color-secondary-500)' },
            { n: pending, l: 'Pending', c: 'var(--color-warning)' },
            { n: upcoming, l: 'Upcoming', c: 'var(--color-error-500)' },
          ].map((s) => (
            <div key={s.l} className="flex flex-col gap-1.5">
              <span className="text-[20px] leading-9" style={{ color: s.c }}>
                {s.n}
              </span>
              <span className="text-[12px] leading-[22px] text-[var(--color-black-mid)]">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}

function Gauge({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const W = 260;
  const H = 150;
  const cx = W / 2;
  const cy = H - 8;
  const r = 110;
  const a = Math.PI * (1 - p / 100);
  const end = { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  const large = p > 50 ? 1 : 0;
  return (
    <div className="relative" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="gaugegrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-secondary-500)" />
            <stop offset="55%" stopColor="var(--color-warning)" />
            <stop offset="100%" stopColor="var(--color-error-500)" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-white-light)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#gaugegrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center">
        <span className="font-heading text-[28px] font-normal leading-[46px] text-[var(--color-secondary-500)]">
          {Math.round(p)}%
        </span>
        <span className="text-body-sm text-[var(--color-grey-darkest)]">Completed</span>
      </div>
    </div>
  );
}

/* ── Financial Goals table ─────────────────────────────────────────────── */

export type GoalRow = { name: string; target: string; saved: string; deadline: string; progress: number };

export function FinancialGoalsTable({
  rows,
  onViewAll,
  loading = false,
}: {
  rows: GoalRow[];
  onViewAll?: () => void;
  loading?: boolean;
}) {
  return (
    <WidgetCard
      title="Financial Goals"
      action={
        <button onClick={onViewAll} className="flex h-10 items-center gap-1 pl-4 pr-2.5 text-body-sm text-[var(--color-primary)]">
          view all
          <IconAngleRight size={20} />
        </button>
      }
      className="flex-1"
    >
      {loading ? (
        <div className="flex flex-col gap-2 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="text-body-sm text-[var(--color-black-mid)]">
              <th className="p-2 text-left font-normal">Goal</th>
              <th className="p-2 text-center font-normal">Target</th>
              <th className="p-2 text-center font-normal">Saved</th>
              <th className="p-2 text-center font-normal">Deadline</th>
              <th className="p-2 text-center font-normal">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-body-sm text-[var(--color-grey-darkest)]">
                  No goals yet. Set a savings goal to track it here.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.name} className="text-body-sm text-[var(--color-black-mid)]">
                <td className="max-w-[200px] truncate p-2">{r.name}</td>
                <td className="p-2 text-center">{r.target}</td>
                <td className="p-2 text-center">{r.saved}</td>
                <td className="p-2 text-center">{r.deadline}</td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-1 px-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-white-light)]">
                      <span
                        className="block h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${Math.max(0, Math.min(100, r.progress))}%` }}
                      />
                    </span>
                    <span className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-neutral-600)]">
                      {Math.round(r.progress)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </WidgetCard>
  );
}

/* ── Budgets widget ────────────────────────────────────────────────────── */

const BUDGET_COLORS = ['var(--color-warning)', 'var(--color-secondary-500)', 'var(--color-primary)'];

export function BudgetsWidget({
  rows,
  loading = false,
  onViewAll,
}: {
  rows: { name: string; tasks: number; progress: number }[];
  loading?: boolean;
  onViewAll?: () => void;
}) {
  const data = (rows.length ? rows : [
    { name: 'Budget 1', tasks: 0, progress: 0 },
  ]).slice(0, 3).map((r, i) => ({ ...r, fill: BUDGET_COLORS[i % BUDGET_COLORS.length], value: r.progress }));

  const action = (
    <div className="flex items-center gap-1">
      {onViewAll && <ViewAllLink onClick={onViewAll} />}
      <Kebab />
    </div>
  );

  if (loading) {
    return (
      <WidgetCard title="Budgets" action={action} className="w-full lg:w-[497px]">
        <InlineLoader className="h-[220px]" />
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Budgets" action={action} className="w-full lg:w-[497px]">
      <div className="flex flex-col items-center">
        <div className="h-[180px] w-[220px] px-4 py-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="40%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" background cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex w-full items-start">
          <div className="flex flex-1 flex-col gap-2.5">
            <p className="font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">
              Budgets Name
            </p>
            {data.map((d) => (
              <div key={d.name} className="flex h-[23px] items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: d.fill }} />
                <span className="truncate text-body-sm text-[var(--color-black-mid)]">{d.name}</span>
              </div>
            ))}
          </div>
          <div className="flex w-20 flex-col gap-2.5">
            <p className="text-center font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">
              Tasks
            </p>
            {data.map((d) => (
              <p key={d.name} className="h-[23px] text-center text-body-sm text-[var(--color-black-mid)]">
                {d.tasks}
              </p>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            <p className="text-center font-label text-[12px] font-medium leading-[22px] text-[var(--color-grey-darkest)]">
              Progress
            </p>
            {data.map((d) => (
              <p key={d.name} className="h-[23px] text-center text-body-sm text-[var(--color-black-mid)]">
                {Math.round(d.progress)} %
              </p>
            ))}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

/* ── Dues and Reminder ─────────────────────────────────────────────────── */

function reminderDateLabel(r: ApiReminder): string {
  const iso = r.dueDate ?? r.createdAt;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * "Dues and Reminders" — a per-user checklist persisted via
 * /api/v1/employee/reminders (see services/reminder.service.ts). Updates are
 * optimistic and reconciled against the server response.
 */
export function DuesReminderCard({
  onViewAll,
  openAddSignal,
  maxItems,
}: { onViewAll?: () => void; openAddSignal?: number; maxItems?: number } = {}) {
  const [items, setItems] = useState<ApiReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReminders()
      .then((list) => { if (!cancelled) setItems(list); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // External "Add Reminder" trigger (e.g. the page header button).
  useEffect(() => {
    if (openAddSignal) setAdding(true);
  }, [openAddSignal]);

  const toggle = async (r: ApiReminder) => {
    const next = !r.isDone;
    setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, isDone: next } : i)));
    try {
      const updated = await updateReminder(r.id, { isDone: next });
      setItems((prev) => prev.map((i) => (i.id === r.id ? updated : i)));
    } catch {
      setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, isDone: r.isDone } : i)));
    }
  };

  const remove = async (id: string) => {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteReminder(id);
    } catch {
      setItems(snapshot);
    }
  };

  const add = async () => {
    const text = draft.trim();
    if (!text) { setAdding(false); return; }
    setBusy(true);
    try {
      const created = await createReminder({ text });
      setItems((prev) => [...prev, created]);
      setDraft('');
      setAdding(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <WidgetCard
      title="Dues and Reminder"
      action={(
        <div className="flex items-center gap-1">
          {onViewAll && <ViewAllLink onClick={onViewAll} />}
          <Kebab />
        </div>
      )}
      className="flex-1"
    >
      <div className="flex flex-col gap-2">
        <p className="font-grotesque text-[16px] font-medium leading-[30px] text-[var(--color-black-light)]">
          {monthLabel}
        </p>
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-[var(--color-text-tertiary)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error && items.length === 0 ? (
            <p className="py-6 text-center font-label text-[12px] leading-[22px] text-[var(--color-text-tertiary)]">
              Couldn’t load your reminders. Try again in a moment.
            </p>
          ) : items.length === 0 && !adding ? (
            <p className="py-6 text-center font-label text-[12px] leading-[22px] text-[var(--color-text-tertiary)]">
              No reminders yet. Add one below to keep track of dues and to-dos.
            </p>
          ) : (
            (maxItems ? items.slice(0, maxItems) : items).map((it) => (
              <div
                key={it.id}
                className="group flex items-center gap-2 rounded-[16px] border border-[var(--color-border-primary)] p-4"
              >
                <button onClick={() => toggle(it)} className="shrink-0" aria-label={it.isDone ? 'Mark not done' : 'Mark done'}>
                  {it.isDone ? (
                    <IconCheckCircleFilled size={24} className="text-[var(--color-primary)]" />
                  ) : (
                    <span className="block h-5 w-5 rounded-full border border-[var(--color-primary)]" />
                  )}
                </button>
                <p
                  className={`flex-1 font-label text-[12px] leading-[22px] ${
                    it.isDone ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-black-mid)]'
                  }`}
                >
                  {it.text}
                </p>
                <span className="font-label text-[12px] leading-[22px] text-[var(--color-text-tertiary)]">
                  {reminderDateLabel(it)}
                </span>
                <button
                  onClick={() => remove(it.id)}
                  aria-label="Delete reminder"
                  className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 transition-opacity hover:text-[var(--color-error-dark)] group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          {adding && (
            <input
              autoFocus
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={add}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="What needs doing?"
              className="rounded-[16px] border border-[var(--color-border-primary)] p-4 text-body-sm outline-none focus:border-[var(--color-primary)] disabled:opacity-60"
            />
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          disabled={busy}
          className="flex h-10 items-center justify-center gap-1 rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-4 text-body-sm text-white transition-colors hover:bg-[var(--color-primary-darkest)] disabled:opacity-60"
        >
          <IconPlus size={20} />
          Add new Reminder
        </button>
      </div>
    </WidgetCard>
  );
}

/* ── misc ──────────────────────────────────────────────────────────────── */

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
      <p className="font-label text-[16px] font-medium leading-7 text-[var(--color-neutral-600)]">{title}</p>
      <p className="max-w-[280px] text-body-xs text-[var(--color-grey-darkest)]">{body}</p>
    </div>
  );
}
