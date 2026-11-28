import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, ListTree, Pencil, Plus, RotateCcw, Search } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { HeaderSettingsButton } from '../../components/common/HeaderSettingsButton';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { CategoryFormModal } from '../../components/categories/CategoryFormModal';
import { SubCategoryManager } from '../../components/categories/SubCategoryManager';
import { CategoryIcon } from '../../data/categoryIcons';
import { useCategories } from '../../hooks/useCategories';
import { archiveCategory, restoreDefaultCategories, updateCategory } from '../../services/category.service';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../utils/apiError';
import type { Category, CategoryType } from '../../types/spending.types';

/**
 * "My categories" — the employee's own category library. Everything here is private to the signed-in
 * employee; HR and coaches never see it. Archiving never deletes: past transactions keep their category.
 */
export default function Categories() {
  const toast = useToast();
  const navigate = useNavigate();
  const { categories, initialLoading, error, reload } = useCategories({ includeArchived: true });
  const [tab, setTab] = useState<CategoryType>('EXPENSE');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [subFor, setSubFor] = useState<string | null>(null);
  const [toArchive, setToArchive] = useState<Category | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const ofType = useMemo(() => categories.filter((c) => c.type === tab), [categories, tab]);
  const archivedCount = ofType.filter((c) => !c.isActive).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ofType
      .filter((c) => (showArchived ? true : c.isActive))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.subCategories.some((s) => s.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [ofType, query, showArchived]);
  const subTarget = categories.find((c) => c.id === subFor) ?? null;

  async function confirmArchive() {
    if (!toArchive) return;
    setArchiveBusy(true);
    setArchiveError('');
    try {
      await archiveCategory(toArchive.id);
      toast.success(`“${toArchive.name}” archived`);
      setToArchive(null);
    } catch (err) {
      setArchiveError(apiErrorMessage(err, 'We could not archive this category.'));
    } finally {
      setArchiveBusy(false);
    }
  }

  async function unarchive(c: Category) {
    setBusyId(c.id);
    try {
      await updateCategory(c.id, { isActive: true });
      toast.success(`“${c.name}” restored`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not restore the category.'));
    } finally {
      setBusyId(null);
    }
  }

  async function restoreDefaults() {
    setRestoring(true);
    try {
      const r = await restoreDefaultCategories();
      const n = r.categoriesCreated + r.categoriesReactivated + r.subCategoriesCreated + r.subCategoriesReactivated;
      toast.success(n ? 'Default categories restored' : 'You already have all the default categories');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not restore the defaults.'));
    } finally {
      setRestoring(false);
    }
  }

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Categories" />
      <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
        <Plus className="mr-1 h-4 w-4" /> New category
      </Button>
    </div>
  );

  return (
    <Layout title="Categories" headerActions={<HeaderSettingsButton />} headerBelow={headerBelow}>
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
        <p className="text-sm text-[var(--color-text-secondary)]">
          These categories are yours alone — only you can see them. Use them for transactions, budgets and insights.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Category type" className="inline-flex rounded-xl bg-[var(--color-bg-tertiary)] p-1">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}
              >
                {t === 'EXPENSE' ? 'Expense' : 'Income'}
                <span className="ml-1.5 text-xs font-normal text-[var(--color-text-tertiary)]">{categories.filter((c) => c.type === t && c.isActive).length}</span>
              </button>
            ))}
          </div>
          <div className="flex h-10 items-center gap-2 rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 sm:w-72">
            <Search className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search categories"
              placeholder="Search categories or subcategories"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </div>

        {initialLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading categories">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-xl bg-[var(--color-bg-tertiary)]" />)}
          </div>
        ) : error && categories.length === 0 ? (
          <div role="alert" className="rounded-xl border border-[var(--color-error-dark)]/30 bg-[var(--color-error-bg)] p-6 text-center">
            <p className="mb-3 text-sm font-medium text-[var(--color-error-dark)]">We couldn’t load your categories.</p>
            <Button variant="outline" onClick={reload}>Try again</Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl bg-[var(--color-bg-card)] px-6 py-14 text-center shadow-[var(--shadow-drop-low)]">
            <ListTree className="mx-auto mb-3 h-9 w-9 text-[var(--color-primary)]" aria-hidden="true" />
            <h3 className="font-heading text-[17px] font-semibold text-[var(--color-text-primary)]">
              {query ? 'No categories match your search' : ofType.length === 0 ? `No ${tab.toLowerCase()} categories yet` : 'Nothing to show'}
            </h3>
            <p className="mx-auto mb-5 mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">
              {query ? 'Try a different word, or clear the search.' : 'Create your own, or bring back the standard set.'}
            </p>
            <div className="flex justify-center gap-3">
              {query ? (
                <Button variant="outline" onClick={() => setQuery('')}>Clear search</Button>
              ) : (
                <>
                  <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" /> New category</Button>
                  <Button variant="outline" loading={restoring} onClick={restoreDefaults}>Restore defaults</Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label={`${tab === 'EXPENSE' ? 'Expense' : 'Income'} categories`}>
            {visible.map((c) => {
              const subs = c.subCategories.filter((s) => s.isActive);
              return (
                <li key={c.id} className={`rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-3.5 ${c.isActive ? '' : 'opacity-70'}`}>
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={c.icon} color={c.color} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => c.type === 'EXPENSE' && c.isActive && navigate(`/finance/categories/${c.id}`)}
                          className="truncate text-left font-grotesque text-[16px] font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                        >
                          {c.name}
                        </button>
                        {c.isDefault && <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-tertiary)]">Default</span>}
                        {!c.isActive && <span className="rounded-full bg-[var(--color-warning-bg,var(--color-bg-tertiary))] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">Archived</span>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
                        {subs.length === 0 ? 'No subcategories' : `${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'}: ${subs.slice(0, 3).map((s) => s.name).join(', ')}${subs.length > 3 ? '…' : ''}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {c.isActive ? (
                        <>
                          <button aria-label={`Manage subcategories of ${c.name}`} onClick={() => setSubFor(c.id)} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-primary)]"><ListTree className="h-4 w-4" /></button>
                          <button aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c); setFormOpen(true); }} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-primary)]"><Pencil className="h-4 w-4" /></button>
                          <button aria-label={`Archive ${c.name}`} onClick={() => { setArchiveError(''); setToArchive(c); }} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-error-dark)]"><Archive className="h-4 w-4" /></button>
                        </>
                      ) : (
                        <button aria-label={`Restore ${c.name}`} disabled={busyId === c.id} onClick={() => void unarchive(c)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]">
                          <ArchiveRestore className="h-4 w-4" /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!initialLoading && categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button onClick={() => setShowArchived((v) => !v)} className="font-semibold text-[var(--color-primary)] hover:underline" disabled={archivedCount === 0 && !showArchived}>
              {showArchived ? 'Hide archived' : archivedCount ? `Show ${archivedCount} archived` : 'No archived categories'}
            </button>
            <button onClick={restoreDefaults} disabled={restoring} className="flex items-center gap-1.5 font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> Restore default categories
            </button>
          </div>
        )}
      </div>

      <CategoryFormModal
        open={formOpen}
        category={editing}
        defaultType={tab}
        existing={categories}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, mode) => toast.success(mode === 'created' ? `“${saved.name}” created` : mode === 'restored' ? `“${saved.name}” restored` : 'Category updated')}
      />
      <SubCategoryManager open={!!subTarget} category={subTarget} onClose={() => setSubFor(null)} />
      <ConfirmDialog
        open={!!toArchive}
        title={`Archive “${toArchive?.name ?? ''}”?`}
        description={
          <>
            It will disappear from pickers and new budgets, but <strong>your past transactions keep it</strong> and reports stay accurate. You can restore it any time.
          </>
        }
        confirmLabel="Archive"
        destructive
        loading={archiveBusy}
        error={archiveError}
        onConfirm={() => void confirmArchive()}
        onCancel={() => setToArchive(null)}
      />
    </Layout>
  );
}
