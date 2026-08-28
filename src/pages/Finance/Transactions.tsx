import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { TransactionItem } from '../../components/finance/TransactionItem';
import { GetAppButton } from '../../components/onboarding/GetAppButton';
import { useTransactionStream } from '../../hooks/useTransactionStream';
import type { Transaction } from '../../types/finance.types';

const CATEGORIES: string[] = [
  'All', 'Food', 'Travel', 'Shopping', 'Groceries', 'Bills',
  'Entertainment', 'Healthcare', 'Subscription', 'Salary', 'EMI', 'Transfers',
];

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
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('All');

  const filters = useMemo(
    () => ({
      type:
        typeFilter === 'Income' ? 'INCOME' : typeFilter === 'Expenses' ? 'EXPENSE' : undefined,
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
    }),
    [typeFilter, categoryFilter],
  );

  const { transactions, loading, loadingMore, hasMore, loadMore, status } =
    useTransactionStream(filters);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.senderName?.toLowerCase().includes(q) ||
        t.receiverName?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const grouped = groupByDate(filtered);
  const st = STATUS_META[status] ?? STATUS_META.connecting;

  return (
    <Layout title="Transactions">
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-h3 text-[var(--color-text-primary)]">Transactions</h1>
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

        {/* Category scroll filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === c
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {categoryFilter === c && <Filter className="w-2.5 h-2.5" />}
              {c}
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
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-text-secondary)]">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? 'No transactions found' : 'No transactions yet'}</p>
            <p className="text-xs mt-1 mb-5 text-[var(--color-text-tertiary)]">
              {search
                ? 'Try a different search term'
                : 'Install the Koshpal app and your transactions import automatically from SMS.'}
            </p>
            {!search && <GetAppButton />}
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
                    <TransactionItem key={txn.id} transaction={txn} showDate={false} />
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
    </Layout>
  );
}
