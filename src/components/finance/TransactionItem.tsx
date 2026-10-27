import React from 'react';
import {
  UtensilsCrossed, Car, ShoppingBag, Zap, Film, Heart, TrendingUp,
  Banknote, CreditCard, Smartphone, Lightbulb, Fuel,
  ShoppingCart, ArrowLeftRight, BookOpen, Activity, HelpCircle, Repeat,
} from 'lucide-react';
import type { Transaction, FinanceCategory } from '../../types/finance.types';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: UtensilsCrossed,
  Travel: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
  Entertainment: Film,
  Healthcare: Heart,
  Investments: TrendingUp,
  Salary: Banknote,
  EMI: CreditCard,
  Subscription: Repeat,
  Recharge: Smartphone,
  Utilities: Lightbulb,
  Fuel: Fuel,
  Groceries: ShoppingCart,
  Transfers: ArrowLeftRight,
  Education: BookOpen,
  Wellness: Activity,
  Uncategorized: HelpCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f5a038',
  Travel: '#334eac',
  Shopping: '#9b59b6',
  Bills: '#e74c3c',
  Entertainment: '#1abc9c',
  Healthcare: '#e91e63',
  Investments: '#2ecc71',
  Salary: '#80b597',
  EMI: '#e74c3c',
  Subscription: '#3498db',
  Recharge: '#17a2b8',
  Utilities: '#f39c12',
  Fuel: '#e67e22',
  Groceries: '#27ae60',
  Transfers: '#95a5a6',
  Education: '#8e44ad',
  Wellness: '#16a085',
  Uncategorized: '#7f8c8d',
};

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
}

function formatAmount(amount: number): string {
  // Render the exact magnitude (no K/L abbreviation, paise kept) — the +/- sign is added by the caller from `type`.
  const n = Math.abs(Number.isFinite(amount) ? amount : 0);
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return `₹${n.toLocaleString('en-IN', whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showDate = true }) => {
  const Icon = CATEGORY_ICONS[transaction.category] ?? HelpCircle;
  const color = CATEGORY_COLORS[transaction.category] ?? '#7f8c8d';
  const isCredit = transaction.type === 'INCOME';

  return (
    <div className="flex items-center gap-3 py-3 px-1 hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {transaction.senderName || transaction.receiverName || transaction.description || transaction.category}
          </p>
          <span className={`shrink-0 text-sm font-bold tabular-nums ${isCredit ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-text-primary)]'}`}>
            <span className="sr-only">{isCredit ? 'Credit ' : 'Debit '}</span>
            {isCredit ? '+' : '-'}{formatAmount(Number(transaction.amount))}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {transaction.category}
          </span>
          {transaction.isSalary && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] font-medium">
              Salary
            </span>
          )}
          {transaction.isEMI && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-error)]/15 text-[var(--color-error-dark)] font-medium">
              EMI
            </span>
          )}
          {showDate && (
            <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">
              {formatDate(transaction.transactionDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export { formatAmount, CATEGORY_COLORS, CATEGORY_ICONS };
export type { FinanceCategory };
