import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Plus } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { TransactionItem } from '../../components/finance/TransactionItem';
import { AddTransactionModal } from '../../components/finance/AddTransactionModal';
import { getTransactions } from '../../services/finance.service';
import type { Transaction, FinanceCategory } from '../../types/finance.types';

const CATEGORIES: (FinanceCategory | 'All')[] = [
  'All', 'Food', 'Travel', 'Shopping', 'Groceries', 'Bills',
  'Entertainment', 'Healthcare', 'Subscriptions' as unknown as FinanceCategory,
  'Salary', 'EMI', 'Transfers',
];

const TYPE_FILTERS = ['All', 'Income', 'Expenses'];

function groupByDate(txns: Transaction[]): [string, Transaction[]][] {
  const grouped = new Map<string, Transaction[]>();
  for (const t of txns) {
    const d = new Date(t.transactionDate);
    const key = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }
  return Array.from(grouped.entries());
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FinanceCategory | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const PAGE_SIZE = 30;

  const loadTransactions = useCallback(async (reset = false) => {
    const skip = reset ? 0 : page * PAGE_SIZE;
    setLoading(true);
    try {
      const data = await getTransactions({
        type: typeFilter === 'Income' ? 'INCOME' : typeFilter === 'Expenses' ? 'EXPENSE' : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        limit: PAGE_SIZE,
        skip,
      });
      if (reset) setTransactions(data);
      else setTransactions((prev) => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      if (!reset) setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, page]);

  useEffect(() => {
    setPage(0);
    loadTransactions(true);
  }, [typeFilter, categoryFilter]); // eslint-disable-line

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const grouped = groupByDate(filtered);

  return (
    <Layout title="Transactions">
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-h3 text-[var(--color-text-primary)]">Transactions</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full font-medium">
              {filtered.length} records
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
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

        {/* Category scroll filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c === 'All' ? 'All' : c as FinanceCategory)}
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
            <p className="font-medium">No transactions found</p>
            <p className="text-xs mt-1 text-[var(--color-text-tertiary)]">
              {search ? 'Try a different search term' : 'Sync your SMS to import transactions'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {grouped.map(([date, txns]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl overflow-hidden"
              >
                {/* Date header */}
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
            onClick={() => loadTransactions(false)}
            className="w-full py-3 rounded-xl border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] text-sm font-semibold hover:bg-[var(--color-bg-card)] transition-all"
          >
            Load more transactions
          </button>
        )}
      </div>

      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setPage(0);
            loadTransactions(true);
          }}
        />
      )}
    </Layout>
  );
}
