import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { useCategories } from '../../hooks/useCategories';
import { categorizeTransactions } from '../../services/finance.service';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/apiError';
import type { Transaction } from '../../types/finance.types';

interface Props {
  transactions: Transaction[];
  onDone: () => void;
  onCancel: () => void;
}

const MAX = 200; // the API's per-call limit

/** Sticky bar to file several selected transactions under one category (all-or-nothing on the server). */
export const BulkCategorizeBar: React.FC<Props> = ({ transactions, onDone, onCancel }) => {
  const toast = useToast();
  const types = useMemo(() => new Set(transactions.map((t) => t.type)), [transactions]);
  const mixed = types.size > 1;
  const type = transactions[0]?.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const { categories } = useCategories({ type });
  // Held (and sent) by NAME: the user's category names are unique.
  const [categoryName, setCategoryName] = useState('');
  const [subName, setSubName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const category = categories.find((c) => c.name === categoryName);
  const tooMany = transactions.length > MAX;

  async function apply() {
    if (!categoryName || mixed || tooMany) return;
    setBusy(true);
    setError('');
    try {
      const r = await categorizeTransactions({
        transactionIds: transactions.map((t) => t.id),
        category: categoryName,
        subCategory: subName || null,
      });
      toast.success(`${r.updated} transaction${r.updated === 1 ? '' : 's'} categorised`);
      onDone();
    } catch (err) {
      // All-or-nothing: nothing was changed.
      setError(apiErrorMessage(err, 'None of the transactions were changed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="region" aria-label="Bulk categorise" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{transactions.length} selected</p>
        {mixed ? (
          <p role="alert" className="text-xs text-[var(--color-error-dark)] sm:flex-1">Select only income or only expenses to categorise them together.</p>
        ) : tooMany ? (
          <p role="alert" className="text-xs text-[var(--color-error-dark)] sm:flex-1">Select at most {MAX} at a time.</p>
        ) : (
          <>
            <select aria-label="Category" value={categoryName} onChange={(e) => { setCategoryName(e.target.value); setSubName(''); }} className="h-10 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 text-sm sm:flex-1">
              <option value="">Choose a category…</option>
              {categories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select aria-label="Subcategory" value={subName} disabled={!category || category.subCategories.length === 0} onChange={(e) => setSubName(e.target.value)} className="h-10 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3 text-sm disabled:opacity-50 sm:flex-1">
              <option value="">No subcategory</option>
              {(category?.subCategories ?? []).filter((s) => s.isActive).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={() => void apply()} loading={busy} disabled={!categoryName || mixed || tooMany}>Apply</Button>
        </div>
      </div>
      {error && <p role="alert" className="mx-auto mt-2 max-w-3xl text-xs text-[var(--color-error-dark)]">{error}</p>}
    </div>
  );
};
