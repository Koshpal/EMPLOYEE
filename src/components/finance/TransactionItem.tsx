import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { Transaction } from '../../types/finance.types';
import { categoryIcon } from '../../data/categoryIcons';

/** Look of a transaction that is not filed under one of the user's categories. */
const NEUTRAL_COLOR = '#7f8c8d';

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
  /** The user's own category look (icon / colour) when the transaction is filed under one. */
  meta?: { icon?: string | null; color?: string | null } | null;
  /** Makes the row a button that opens the edit form. */
  onEdit?: (t: Transaction) => void;
  /** Bulk-select mode: shows a checkbox instead of acting as an edit button. */
  selectable?: { selected: boolean; onToggle: (t: Transaction) => void };
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

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showDate = true, meta, onEdit, selectable }) => {
  const Icon = meta?.icon ? categoryIcon(meta.icon) : HelpCircle;
  const color = meta?.color ?? NEUTRAL_COLOR;
  const isCredit = transaction.type === 'INCOME';
  const uncategorised = !transaction.category || transaction.category.trim().toLowerCase() === 'uncategorized';
  const label = transaction.description || transaction.receiverName || transaction.senderName || transaction.category;

  const interactive = selectable ? () => selectable.onToggle(transaction) : onEdit ? () => onEdit(transaction) : undefined;

  const baseCls = `flex w-full items-center gap-3 py-3 px-1 text-left hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors ${interactive ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]' : ''}`;
  const content = (
    <>
      {selectable && (
        <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${selectable.selected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)]'}`}>
          {selectable.selected ? '✓' : ''}
        </span>
      )}
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        {React.createElement(Icon, { className: 'w-4.5 h-4.5', style: { color } })}
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
            {uncategorised ? 'Uncategorised' : transaction.category}
            {transaction.subCategory && !uncategorised ? ` · ${transaction.subCategory}` : ''}
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
    </>
  );

  if (!interactive) return <div className={baseCls}>{content}</div>;
  return selectable ? (
    <button type="button" role="checkbox" aria-checked={selectable.selected} aria-label={`${selectable.selected ? 'Deselect' : 'Select'} ${label}`} onClick={interactive} className={baseCls}>
      {content}
    </button>
  ) : (
    <button type="button" aria-label={`Edit ${label}`} onClick={interactive} className={baseCls}>
      {content}
    </button>
  );
};

export { formatAmount };
