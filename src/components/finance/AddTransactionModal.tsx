import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react';
import { createTransaction, type CreateTransactionPayload } from '../../services/finance.service';
import type { FinanceCategory } from '../../types/finance.types';

const CATEGORIES: FinanceCategory[] = [
  'Food', 'Groceries', 'Travel', 'Shopping', 'Bills', 'Entertainment',
  'Healthcare', 'Salary', 'EMI', 'Subscription', 'Recharge', 'Utilities',
  'Fuel', 'Transfers', 'Investments', 'Education', 'Wellness', 'Uncategorized',
];

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'CASH', label: 'Cash' },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({ onClose, onSuccess }: Props) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FinanceCategory>('Uncategorized');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Enter a valid amount'); return; }

    setLoading(true);
    setError('');
    try {
      const payload: CreateTransactionPayload = {
        amount: parsed,
        type,
        category,
        source: 'MANUAL',
        transactionDate: new Date(transactionDate).toISOString(),
        ...(merchant && { merchant }),
        ...(description && { description }),
        ...(paymentMethod && { paymentMethod }),
      };
      await createTransaction(payload);
      onSuccess();
    } catch {
      setError('Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full sm:max-w-lg bg-[var(--color-bg-card)] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[var(--color-border-primary)] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Add Transaction</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
              {(['EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-all ${
                    type === t
                      ? t === 'INCOME'
                        ? 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]'
                        : 'bg-red-50 text-red-600'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {t === 'INCOME'
                    ? <ArrowDownCircle className="w-4 h-4" />
                    : <ArrowUpCircle className="w-4 h-4" />}
                  {t === 'INCOME' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] text-lg font-bold focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                Category *
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      category === c
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {category === c && <Check className="w-3 h-3 inline mr-1" />}
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant + Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                  Merchant
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Swiggy, Amazon..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                Payment Method
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(paymentMethod === m.value ? '' : m.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      paymentMethod === m.value
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/40'
                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
