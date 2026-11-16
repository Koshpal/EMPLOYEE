import { useMemo } from 'react';
import { useApi } from './useApi';
import { listCategories } from '../services/category.service';
import type { Category, CategoryType } from '../types/spending.types';

/**
 * The signed-in employee's personal categories (shared, cached, auto-refreshed after any category /
 * transaction / budget change — see hooks/useApi). Archived categories are excluded unless asked for.
 */
export function useCategories(opts: { type?: CategoryType; includeArchived?: boolean } = {}) {
  const key = `categories?type=${opts.type ?? 'all'}&active=${opts.includeArchived ? 'all' : 'true'}`;
  const api = useApi<Category[]>(key, () => listCategories({ type: opts.type, isActive: opts.includeArchived ? 'all' : undefined }));
  const byId = useMemo(() => new Map((api.data ?? []).map((c) => [c.id, c])), [api.data]);
  const subById = useMemo(() => {
    const m = new Map<string, { sub: Category['subCategories'][number]; category: Category }>();
    for (const c of api.data ?? []) for (const s of c.subCategories) m.set(s.id, { sub: s, category: c });
    return m;
  }, [api.data]);
  return { ...api, categories: api.data ?? [], byId, subById };
}
