import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal, fieldCls, labelCls } from '../common/Modal';
import { Button } from '../ui/Button';
import { COLOR_CHOICES, CategoryIcon, DEFAULT_CATEGORY_COLOR, ICON_CHOICES, categoryIcon } from '../../data/categoryIcons';
import { createCategory, updateCategory } from '../../services/category.service';
import { apiErrorMessage } from '../../utils/apiError';
import type { Category, CategoryType } from '../../types/spending.types';

interface Props {
  open: boolean;
  /** Edit this category; omit to create a new one. */
  category?: Category | null;
  defaultType?: CategoryType;
  /** Hide the Expense/Income switch and keep `defaultType` (e.g. when opened from the budget form). */
  lockType?: boolean;
  /** The user's current categories — used to stop duplicates before the request is sent. */
  existing: Category[];
  onClose: () => void;
  onSaved: (saved: Category, mode: 'created' | 'updated' | 'restored') => void;
}

const normalise = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export const CategoryFormModal: React.FC<Props> = ({ open, category, defaultType = 'EXPENSE', lockType, existing, onClose, onSaved }) => {
  const editing = !!category;
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [icon, setIcon] = useState<string>('tag');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset the form each time it opens, seeded from the category being edited.
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(category?.name ?? '');
    setType(category?.type ?? defaultType);
    setIcon(category?.icon ?? 'tag');
    setColor(category?.color ?? DEFAULT_CATEGORY_COLOR);
    setServerError('');
    setTouched(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, category, defaultType]);

  const clash = useMemo(() => {
    const key = normalise(name);
    if (!key) return null;
    return existing.find((c) => c.id !== category?.id && c.type === type && normalise(c.name) === key) ?? null;
  }, [name, type, existing, category]);

  const validation =
    !name.trim() ? 'Give the category a name' : name.trim().length > 60 ? 'Keep the name under 60 characters' : clash ? (clash.isActive ? `You already have ${type === 'EXPENSE' ? 'an expense' : 'an income'} category called “${clash.name}”` : '') : '';
  const restoresArchived = !!clash && !clash.isActive && !editing;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validation) return;
    setBusy(true);
    setServerError('');
    try {
      if (editing && category) {
        const saved = await updateCategory(category.id, { name: name.trim(), icon, color });
        onSaved(saved, 'updated');
      } else {
        const saved = await createCategory({ name: name.trim(), type, icon, color });
        onSaved(saved, saved.restored ? 'restored' : 'created');
      }
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, 'We could not save this category. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={busy} title={editing ? 'Edit category' : 'New category'} size="md">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-secondary)] p-3">
          <CategoryIcon icon={icon} color={color} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{name.trim() || 'Category name'}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{type === 'EXPENSE' ? 'Expense category' : 'Income category'}</p>
          </div>
        </div>

        <div>
          <label htmlFor="cat-name" className={labelCls}>Name</label>
          <input
            id="cat-name"
            data-autofocus
            value={name}
            maxLength={70}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pet expenses"
            aria-invalid={touched && !!validation}
            aria-describedby="cat-name-help"
            className={fieldCls}
          />
          <p id="cat-name-help" role={touched && validation ? 'alert' : undefined} className={`mt-1.5 text-xs ${touched && validation ? 'text-[var(--color-error-dark)]' : 'text-[var(--color-text-tertiary)]'}`}>
            {touched && validation
              ? validation
              : restoresArchived
                ? `“${clash?.name}” is archived — saving will bring it back.`
                : 'Names are unique within expenses and within income.'}
          </p>
        </div>

        {!lockType && <fieldset>
          <legend className={labelCls}>Type</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Category type">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
                } ${editing ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input type="radio" name="cat-type" value={t} checked={type === t} disabled={editing} onChange={() => setType(t)} className="sr-only" />
                {t === 'EXPENSE' ? 'Expense' : 'Income'}
              </label>
            ))}
          </div>
          {editing && <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">The type can’t change once a category exists — it would re-classify your history.</p>}
        </fieldset>}

        <fieldset>
          <legend className={labelCls}>Icon</legend>
          <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Icon">
            {ICON_CHOICES.map((key) => {
              const Icon = categoryIcon(key);
              const on = icon === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={key.replace(/-/g, ' ')}
                  onClick={() => setIcon(key)}
                  className={`flex h-9 items-center justify-center rounded-lg border transition-colors ${
                    on ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]/50'
                  }`}
                  style={on ? { color } : undefined}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelCls}>Colour</legend>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color.toLowerCase() === c.toLowerCase()}
                aria-label={`Colour ${c}`}
                onClick={() => setColor(c)}
                className="flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--color-bg-card)] transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                style={{ backgroundColor: c, boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 0 2px ${c}` : undefined }}
              >
                {color.toLowerCase() === c.toLowerCase() && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            ))}
          </div>
        </fieldset>

        {serverError && (
          <p role="alert" className="rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-dark)]">
            {serverError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={busy}>
            {editing ? 'Save changes' : restoresArchived ? 'Restore category' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
