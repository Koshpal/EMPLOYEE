import { useMemo } from 'react';
import { useApi } from './useApi';
import { listCategories } from '../services/category.service';
import type { Category, CategoryType } from '../types/spending.types';

/** Same rule as the server's nameKey(): case- and spacing-insensitive. */
export const nameKey = (s: string | null | undefined): string => (s ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

/** A transaction / budget line refers to its category by NAME; income and expense libraries are separate. */
export const categoryKey = (type: string, name: string | null | undefined): string => `${type}:${nameKey(name)}`;

/**
 * The signed-in employee's personal categories (shared, cached, auto-refreshed after any category /
 * transaction / budget change — see hooks/useApi). Archived categories are excluded unless asked for.
 */
export function useCategories(opts: { type?: CategoryType; includeArchived?: boolean } = {}) {
  const key = `categories?type=${opts.type ?? 'all'}&active=${opts.includeArchived ? 'all' : 'true'}`;
  const api = useApi<Category[]>(key, () => listCategories({ type: opts.type, isActive: opts.includeArchived ? 'all' : undefined }));
  const byId = useMemo(() => new Map((api.data ?? []).map((c) => [c.id, c])), [api.data]);
  const byName = useMemo(() => new Map((api.data ?? []).map((c) => [categoryKey(c.type, c.name), c])), [api.data]);
  /** The category a transaction is filed under (null when uncategorised or not in the library). */
  const forTransaction = (t: { type: string; category?: string | null }) => byName.get(categoryKey(t.type, t.category)) ?? null;
  const subById = useMemo(() => {
    const m = new Map<string, { sub: Category['subCategories'][number]; category: Category }>();
    for (const c of api.data ?? []) for (const s of c.subCategories) m.set(s.id, { sub: s, category: c });
    return m;
  }, [api.data]);
  return { ...api, categories: api.data ?? [], byId, byName, forTransaction, subById };
}
