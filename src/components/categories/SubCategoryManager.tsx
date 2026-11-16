import React, { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, Pencil, Plus, X } from 'lucide-react';
import { Modal, fieldCls } from '../common/Modal';
import { Button } from '../ui/Button';
import { archiveSubCategory, createSubCategory, reorderSubCategories, updateSubCategory } from '../../services/category.service';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/apiError';
import type { Category } from '../../types/spending.types';

interface Props {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}

/** Add / rename / archive / reorder the sub-categories of one category. */
export const SubCategoryManager: React.FC<Props> = ({ open, category, onClose }) => {
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setNewName('');
    setError('');
    setEditingId(null);
    setShowArchived(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, category?.id]);

  if (!category) return null;
  const all = [...category.subCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const visible = all.filter((s) => showArchived || s.isActive);
  const archivedCount = all.filter((s) => !s.isActive).length;
  const active = all.filter((s) => s.isActive);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return setError('Enter a subcategory name');
    if (all.some((s) => s.isActive && s.name.trim().toLowerCase() === name.toLowerCase())) return setError(`“${name}” already exists in ${category!.name}`);
    setAdding(true);
    setError('');
    try {
      const created = await createSubCategory(category!.id, { name });
      toast.success(created.restored ? `Restored “${created.name}”` : `Added “${created.name}”`);
      setNewName('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add the subcategory.'));
    } finally {
      setAdding(false);
    }
  }

  async function rename(id: string) {
    const name = editName.trim();
    if (!name) return setError('A subcategory needs a name');
    setPending(id);
    setError('');
    try {
      await updateSubCategory(category!.id, id, { name });
      setEditingId(null);
      toast.success('Subcategory renamed');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not rename the subcategory.'));
    } finally {
      setPending(null);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    setPending(id);
    setError('');
    try {
      if (isActive) await archiveSubCategory(category!.id, id);
      else await updateSubCategory(category!.id, id, { isActive: true });
      toast.success(isActive ? 'Subcategory archived — past transactions keep it' : 'Subcategory restored');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the subcategory.'));
    } finally {
      setPending(null);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const ids = active.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setPending(id);
    try {
      await reorderSubCategories(category!.id, ids);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the new order.'));
    } finally {
      setPending(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Subcategories · ${category.name}`} size="md">
      <form onSubmit={add} className="flex gap-2" aria-label="Add subcategory">
        <label htmlFor="sub-new" className="sr-only">New subcategory name</label>
        <input id="sub-new" data-autofocus value={newName} maxLength={60} onChange={(e) => setNewName(e.target.value)} placeholder="New subcategory, e.g. Vet visits" className={fieldCls} />
        <Button type="submit" loading={adding} className="shrink-0">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-dark)]">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-[var(--color-border-primary)] rounded-xl border border-[var(--color-border-primary)]" aria-label="Subcategories">
        {visible.length === 0 && <li className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">No subcategories yet. Add the first one above.</li>}
        {visible.map((s) => {
          const idx = active.findIndex((a) => a.id === s.id);
          return (
            <li key={s.id} className={`flex items-center gap-2 px-3 py-2.5 ${s.isActive ? '' : 'opacity-60'}`}>
              {editingId === s.id ? (
                <>
                  <input
                    aria-label={`Rename ${s.name}`}
                    autoFocus
                    value={editName}
                    maxLength={60}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void rename(s.id);
                      }
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                    className={`${fieldCls} py-1.5`}
                  />
                  <button type="button" aria-label="Save name" disabled={pending === s.id} onClick={() => void rename(s.id)} className="rounded-lg p-1.5 text-[var(--color-success-dark)] hover:bg-[var(--color-bg-tertiary)]">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Cancel rename" onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-primary)]">
                    {s.name}
                    {!s.isActive && <span className="ml-2 rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-tertiary)]">Archived</span>}
                  </span>
                  {s.isActive && (
                    <>
                      <button type="button" aria-label={`Move ${s.name} up`} disabled={idx <= 0 || pending !== null} onClick={() => void move(s.id, -1)} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label={`Move ${s.name} down`} disabled={idx === active.length - 1 || pending !== null} onClick={() => void move(s.id, 1)} className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Rename ${s.name}`}
                        onClick={() => {
                          setEditingId(s.id);
                          setEditName(s.name);
                        }}
                        className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label={s.isActive ? `Archive ${s.name}` : `Restore ${s.name}`}
                    disabled={pending === s.id}
                    onClick={() => void toggle(s.id, s.isActive)}
                    className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-primary)]"
                  >
                    {s.isActive ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived((v) => !v)} className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline">
          {showArchived ? 'Hide archived' : `Show ${archivedCount} archived`}
        </button>
      )}
    </Modal>
  );
};
