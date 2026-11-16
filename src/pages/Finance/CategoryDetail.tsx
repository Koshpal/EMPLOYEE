import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Layout } from '../../components/common/Layout';
import { HeaderSettingsButton } from '../../components/common/HeaderSettingsButton';
import { RangeFilter } from '../../components/spending/RangeFilter';
import { Card, Change, EmptyBlock, ErrorBlock, LoadBlock, Stat } from '../../components/spending/bits';
import { ProgressBar, STATUS_STYLE, dateShort } from '../../components/budgets/BudgetDetailPanel';
import { CategoryIcon } from '../../data/categoryIcons';
import { useApi } from '../../hooks/useApi';
import { getCategoryDetailInsight } from '../../services/spending.service';
import { formatINR, formatPct } from '../../utils/money';
import { rangeCacheKey, selectionFromSearch } from '../../utils/range';
import type { RangeSelection } from '../../types/spending.types';

/** One category: totals, comparison, sub-category split, budgets it belongs to, trend and recent transactions. */
export default function CategoryDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const sel = useMemo(() => selectionFromSearch(sp), [sp]);
  const api = useApi(`insights/category/${id}/${rangeCacheKey(sel)}`, () => getCategoryDetailInsight(id, sel));

  const onRange = (r: RangeSelection) => {
    const next = new URLSearchParams(sp);
    next.set('range', r.range);
    if (r.range === 'CUSTOM' && r.from && r.to) { next.set('from', r.from); next.set('to', r.to); } else { next.delete('from'); next.delete('to'); }
    setSp(next, { replace: true });
  };

  const notFound = (api.error as { response?: { status?: number } } | undefined)?.response?.status === 404;
  const d = api.data;
  const trend = (d?.monthlyTrend ?? []).map((p) => ({ label: p.label, total: p.total }));

  return (
    <Layout title={d?.category.name ?? 'Category'} headerActions={<HeaderSettingsButton />}>
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
        <button onClick={() => navigate(-1)} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" /> Back</button>

        {api.initialLoading ? (
          <LoadBlock height={360} label="Loading category" />
        ) : notFound ? (
          <EmptyBlock title="Category not found" body="It may have been removed, or it isn’t one of your categories." action={<Link to="/finance/categories" className="rounded-[8px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white">Back to categories</Link>} />
        ) : api.error != null && !d ? (
          <ErrorBlock what="this category" onRetry={api.reload} />
        ) : d ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={d.category.icon} color={d.category.color} size={52} />
                <div>
                  <h2 className="font-grotesque text-[24px] font-medium text-[var(--color-black-mid)]">{d.category.name}</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">{d.range.label}{!d.category.isActive && ' · Archived'}</p>
                </div>
              </div>
              <RangeFilter value={sel} onChange={onRange} />
            </div>

            {d.transactionCount === 0 ? (
              <EmptyBlock title="No spending here in this period" body="Nothing was filed under this category for these dates. Try a wider period." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Stat label="Spent" value={formatINR(d.totalSpent)} sub={<Change pct={d.percentageChange} />} />
                  <Stat label="Transactions" value={String(d.transactionCount)} />
                  <Stat label="Average" value={formatINR(d.averageTransaction)} sub={<span className="text-xs text-[var(--color-text-tertiary)]">{formatINR(d.dailyAverage)} per day</span>} />
                  <Stat label="Share of spending" value={formatPct(d.percentageOfTotal)} sub={<span className="text-xs text-[var(--color-text-tertiary)]">Before: {formatINR(d.previousPeriodSpent)}</span>} />
                </div>
                {d.highestTransaction && (
                  <p className="text-sm text-[var(--color-text-secondary)]">Largest: <strong className="tabular-nums text-[var(--color-text-primary)]">{formatINR(d.highestTransaction.amount)}</strong>{d.highestTransaction.description ? ` — ${d.highestTransaction.description}` : ''} on {dateShort(d.highestTransaction.date)}</p>
                )}

                {d.subCategories.length > 0 && (
                  <Card title="Subcategories">
                    <ul className="flex flex-col gap-3">
                      {d.subCategories.filter((s) => s.totalSpent > 0 || s.transactionCount > 0).map((s) => (
                        <li key={s.subCategoryId}>
                          <div className="flex items-baseline justify-between text-sm"><span className="font-medium">{s.subCategoryName}</span><span className="tabular-nums">{formatINR(s.totalSpent)}</span></div>
                          <div className="my-1"><ProgressBar pct={s.percentageOfCategory} color={d.category.color ?? 'var(--color-primary)'} label={`${s.subCategoryName} share`} height={5} /></div>
                          <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">{formatPct(s.percentageOfCategory)} of {d.category.name} · {s.transactionCount} txn{s.transactionCount === 1 ? '' : 's'} <Change pct={s.percentageChange} /></p>
                        </li>
                      ))}
                      {d.withoutSubCategory.transactionCount > 0 && (
                        <li className="flex items-baseline justify-between text-sm text-[var(--color-text-secondary)]"><span>No subcategory</span><span className="tabular-nums">{formatINR(d.withoutSubCategory.totalSpent)} · {d.withoutSubCategory.transactionCount} txn{d.withoutSubCategory.transactionCount === 1 ? '' : 's'}</span></li>
                      )}
                    </ul>
                  </Card>
                )}

                {d.budgets.length > 0 && (
                  <Card title="In your budgets">
                    <ul className="flex flex-col gap-3">
                      {d.budgets.map((b) => (
                        <li key={b.budgetId}>
                          <div className="flex items-baseline justify-between text-sm"><Link to="/finance/budgets" className="font-medium text-[var(--color-primary)] hover:underline">{b.budgetName}</Link><span className="tabular-nums">{formatINR(b.spent)} / {formatINR(b.allocated)}</span></div>
                          <div className="my-1"><ProgressBar pct={b.utilisationPct} color={STATUS_STYLE[b.status].bar} label={`${b.budgetName} used`} height={6} /></div>
                          <p className={`text-xs ${b.remaining < 0 ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-secondary)]'}`}>{b.remaining < 0 ? `${formatINR(-b.remaining)} over` : `${formatINR(b.remaining)} left`} · {STATUS_STYLE[b.status].label}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {trend.length > 1 && (
                  <Card title="Trend">
                    <div className="h-52" role="img" aria-label={`Monthly spending on ${d.category.name}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-primary)" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                          <Tooltip formatter={(v) => formatINR(Number(v))} />
                          <Bar dataKey="total" name="Spent" fill={d.category.color ?? 'var(--color-primary)'} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                <Card title="Recent transactions" aside={<Link to={`/finance/transactions?categoryId=${d.category.id}`} className="text-xs font-semibold text-[var(--color-primary)]">See all</Link>}>
                  <ul className="divide-y divide-[var(--color-border-primary)]">
                    {d.recentTransactions.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <div className="min-w-0"><p className="truncate font-medium">{t.description || d.category.name}{t.subCategory ? ` · ${t.subCategory}` : ''}</p><p className="text-xs text-[var(--color-text-tertiary)]">{dateShort(t.transactionDate)}</p></div>
                        <span className="shrink-0 tabular-nums">{formatINR(t.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
