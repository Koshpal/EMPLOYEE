import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Plus, ListChecks } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { TransactionItem } from '../../components/finance/TransactionItem';
import { GetAppButton } from '../../components/onboarding/GetAppButton';
import { useTransactionStream } from '../../hooks/useTransactionStream';
import { TransactionFormModal } from '../../components/finance/TransactionFormModal';
import { BulkCategorizeBar } from '../../components/finance/BulkCategorizeBar';
import { useCategories } from '../../hooks/useCategories';
import type { Transaction } from '../../types/finance.types';

const UNCATEGORISED = '__uncategorised__';

const TYPE_FILTERS = ['All', 'Income', 'Expenses'] as const;

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  connecting: { label: 'Connecting…', dot: 'bg-[var(--color-text-tertiary)]', text: 'text-[var(--color-text-tertiary)]' },
  live: { label: 'Live', dot: 'bg-[var(--color-success-dark)]', text: 'text-[var(--color-success-dark)]' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-[var(--color-warning-dark)]', text: 'text-[var(--color-warning-dark)]' },
  offline: { label: 'Offline', dot: 'bg-[var(--color-text-tertiary)]', text: 'text-[var(--color-text-tertiary)]' },
};

function groupByDate(txns: Transaction[]): [string, Transaction[]][] {
  const grouped = new Map<string, Transaction[]>();
  for (const t of txns) {
    const key = new Date(t.transactionDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }
  return Array.from(grouped.entries());
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [urlParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState<string>(
    urlParams.get('uncategorised') ? UNCATEGORISED : urlParams.get('category') ?? 'All',
  ); // 'All' | UNCATEGORISED | a category NAME
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { categories, forTransaction } = useCategories();
  const dateError = from && to && from > to ? 'The start date is after the end date' : '';

  const filters = useMemo(
    () => ({
      type:
        typeFilter === 'Income' ? 'INCOME' : typeFilter === 'Expenses' ? 'EXPENSE' : undefined,
      category: categoryFilter !== 'All' && categoryFilter !== UNCATEGORISED ? categoryFilter : undefined,
      uncategorized: categoryFilter === UNCATEGORISED ? true : undefined,
      from: !dateError && from ? from : undefined,
      to: !dateError && to ? to : undefined,
      search: debouncedSearch || undefined,
    }),
    [typeFilter, categoryFilter, from, to, dateError, debouncedSearch],
  );

  const { transactions, loading, loadingMore, hasMore, loadMore, status, error, retry } =
    useTransactionStream(filters);

  const filtered = transactions;
  const hasFilters = categoryFilter !== 'All' || typeFilter !== 'All' || !!from || !!to || !!debouncedSearch;
  const clearFilters = () => { setCategoryFilter('All'); setTypeFilter('All'); setFrom(''); setTo(''); setSearch(''); };

  const toggleSelect = (t: Transaction) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(t.id)) n.delete(t.id); else n.add(t.id);
      return n;
    });
  const exitSelect = () => { setSelecting(false); setSelected(new Set()); };
  // Only expenses can be bulk-filed: the bulk call takes one category for all rows.
  const selectedTxns = filtered.filter((t) => selected.has(t.id));

  const grouped = groupByDate(filtered);
  const st = STATUS_META[status] ?? STATUS_META.connecting;

  return (
    <Layout title="Transactions">
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-[var(--color-text-primary)]">Transactions</h2>
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold ${st.text}`}
              title="Transactions sync from your mobile app in near real-time"
            >
              <span className={`w-2 h-2 rounded-full ${st.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
              {st.label}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full font-medium">
              {filtered.length} shown
            </span>
            <button
              onClick={() => (selecting ? exitSelect() : setSelecting(true))}
              aria-pressed={selecting}
              className={`flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-xs font-semibold ${selecting ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'}`}
            >
              <ListChecks className="h-4 w-4" /> {selecting ? 'Done' : 'Select'}
            </button>
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex h-9 items-center gap-1 rounded-[8px] bg-[var(--color-primary)] pl-2.5 pr-3.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-darkest)]"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants, categories..."
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                typeFilter === f
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="tx-from" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">From</label>
            <input id="tx-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-2.5 text-xs" />
          </div>
          <div>
            <label htmlFor="tx-to" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">To</label>
            <input id="tx-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-2.5 text-xs" />
          </div>
          {hasFilters && <button onClick={clearFilters} className="h-9 text-xs font-semibold text-[var(--color-primary)] hover:underline">Clear filters</button>}
          {dateError && <p role="alert" className="text-xs text-[var(--color-error-dark)]">{dateError}</p>}
        </div>

        {/* Category filters — the employee's own categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter by category">
          {[{ id: 'All', name: 'All' }, { id: UNCATEGORISED, name: 'Uncategorised' }, ...categories.filter((c) => c.isActive).map((c) => ({ id: c.name, name: c.name }))].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              aria-pressed={categoryFilter === c.id}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === c.id
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {categoryFilter === c.id && <Filter className="w-2.5 h-2.5" />}
              {c.name}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {loading && transactions.length === 0 ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-[var(--color-bg-card)] rounded-xl animate-pulse border border-[var(--color-border-primary)]" />
            ))}
          </div>
        ) : error && transactions.length === 0 ? (
          <div role="alert" className="text-center py-16 text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-text-primary)]">We couldn't load your transactions</p>
            <p className="text-xs mt-1 mb-5 text-[var(--color-text-tertiary)]">Check your connection and try again. Your data is safe.</p>
            <button onClick={() => void retry()} className="rounded-[8px] bg-[var(--color-primary)] px-6 py-2.5 text-sm text-white hover:bg-[var(--color-primary-darkest)]">Retry</button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-text-secondary)]">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{hasFilters ? 'No transactions match these filters' : 'No transactions yet'}</p>
            <p className="text-xs mt-1 mb-5 text-[var(--color-text-tertiary)]">
              {hasFilters
                ? 'Try a wider date range or a different category.'
                : 'Add one yourself, or install the Koshpal app and your transactions import automatically from SMS.'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="rounded-[8px] border border-[var(--color-border-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-primary)]">Clear filters</button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-[8px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white">Add a transaction</button>
                <GetAppButton />
              </div>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {grouped.map(([date, txns]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">{date}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {txns.length} txn{txns.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="px-4 divide-y divide-[var(--color-border-primary)]">
                  {txns.map((txn) => (
                    <TransactionItem
                      key={txn.id}
                      transaction={txn}
                      showDate={false}
                      meta={forTransaction(txn)}
                      onEdit={(t) => { setEditing(t); setFormOpen(true); }}
                      selectable={selecting ? { selected: selected.has(txn.id), onToggle: toggleSelect } : undefined}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 rounded-xl border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] text-sm font-semibold hover:bg-[var(--color-bg-card)] transition-all disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more transactions'}
          </button>
        )}
      </div>

      {selecting && selectedTxns.length > 0 && (
        <BulkCategorizeBar transactions={selectedTxns} onDone={exitSelect} onCancel={exitSelect} />
      )}
      <TransactionFormModal
        open={formOpen}
        transaction={editing}
        onClose={() => setFormOpen(false)}
      />
    </Layout>
  );
}
