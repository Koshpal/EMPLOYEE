import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * A tiny shared request cache — the one place API data for categories, budgets and insights lives.
 *
 *  - Requests are keyed. Two components asking for the same key share ONE in-flight request and one
 *    result, so dropdowns on a page never trigger duplicate calls.
 *  - Cached data is shown immediately and re-fetched in the background when older than `staleMs`
 *    (stale-while-revalidate), so pickers never show an old category list for long.
 *  - `invalidate(prefix)` marks every matching key stale and re-fetches the ones currently on screen.
 *    Mutations call it (see `invalidateAfter`) so a new transaction / category / budget refreshes every
 *    dependent widget — no manual wiring per page.
 */

interface Snap<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

const LOADING: Snap<never> = { data: undefined, error: undefined, loading: true };
const IDLE: Snap<never> = { data: undefined, error: undefined, loading: false };

const snaps = new Map<string, Snap<unknown>>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<void>>();
const fetchedAt = new Map<string, number>();
const fetchers = new Map<string, () => Promise<unknown>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function setSnap(key: string, snap: Snap<unknown>) {
  snaps.set(key, snap);
  emit(key);
}

function run(key: string, fetcher: () => Promise<unknown>, force = false): Promise<void> {
  const existing = inflight.get(key);
  if (existing && !force) return existing;
  const prev = snaps.get(key);
  setSnap(key, { data: prev?.data, error: undefined, loading: true });
  const p = fetcher()
    .then(
      (data) => {
        fetchedAt.set(key, Date.now());
        setSnap(key, { data, error: undefined, loading: false });
      },
      (error: unknown) => {
        setSnap(key, { data: prev?.data, error, loading: false });
      },
    )
    .finally(() => {
      if (inflight.get(key) === p) inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

/** Mark keys starting with any prefix stale; re-fetch those that are currently mounted. */
export function invalidate(prefixes: string | string[]): void {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const key of [...snaps.keys()]) {
    if (!list.some((p) => key.startsWith(p))) continue;
    fetchedAt.delete(key);
    const fetcher = fetchers.get(key);
    if (fetcher && (listeners.get(key)?.size ?? 0) > 0) void run(key, fetcher, true);
  }
}

/** Which cached families each kind of write affects. */
const AFFECTS = {
  transaction: ['budgets', 'insights', 'tx', 'categories'],
  category: ['categories', 'budgets', 'insights', 'tx'],
  budget: ['budgets', 'insights', 'tx'],
} as const;
export const invalidateAfter = (what: keyof typeof AFFECTS) => invalidate([...AFFECTS[what]]);

/** Test helper / sign-out hook: forget everything (a new user must never see the previous user's data). */
export function clearApiCache(): void {
  snaps.clear();
  inflight.clear();
  fetchedAt.clear();
  fetchers.clear();
  for (const key of listeners.keys()) emit(key);
}

export interface ApiState<T> {
  data: T | undefined;
  /** true on first load and while a background refresh is running */
  loading: boolean;
  /** true only when there is nothing to show yet */
  initialLoading: boolean;
  error: unknown;
  reload: () => void;
}

/**
 * @param key      cache key; `null` disables the request (e.g. waiting for an id)
 * @param fetcher  async loader — the latest closure is used for background refreshes
 */
export function useApi<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts: { staleMs?: number } = {},
): ApiState<T> {
  const staleMs = opts.staleMs ?? 20_000;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!key) return () => undefined;
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(cb);
      return () => {
        set!.delete(cb);
      };
    },
    [key],
  );
  const getSnapshot = useCallback(
    () => (key ? ((snaps.get(key) as Snap<T> | undefined) ?? (LOADING as Snap<T>)) : (IDLE as Snap<T>)),
    [key],
  );
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!key) return;
    const wrapped = () => fetcherRef.current();
    fetchers.set(key, wrapped);
    const age = Date.now() - (fetchedAt.get(key) ?? 0);
    if (!snaps.has(key) || age > staleMs) void run(key, wrapped);
  }, [key, staleMs]);

  const reload = useCallback(() => {
    if (key) void run(key, () => fetcherRef.current(), true);
  }, [key]);

  return { data: snap.data, loading: snap.loading, initialLoading: snap.loading && snap.data === undefined, error: snap.error, reload };
}
