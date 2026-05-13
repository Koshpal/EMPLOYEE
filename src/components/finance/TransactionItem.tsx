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
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[160px]">
            {transaction.merchant || transaction.description || transaction.category}
          </p>
          <span className={`text-sm font-bold tabular-nums ${isCredit ? 'text-[var(--color-success-dark)]' : 'text-[var(--color-text-primary)]'}`}>
            {isCredit ? '+' : '-'}{formatAmount(transaction.amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {transaction.category}
          </span>
          {transaction.isSalary && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-dark)] font-medium">
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
