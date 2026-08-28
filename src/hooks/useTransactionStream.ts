import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTransactions,
  getTransactionChanges,
} from '../services/finance.service';
import { TransactionStream, type StreamStatus } from '../services/transactionStream';
import type { Transaction, TransactionStreamEvent } from '../types/finance.types';

interface Filters {
  type?: string;
  category?: string;
}

const byDateDesc = (a: Transaction, b: Transaction) =>
  new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();

/**
 * Owns the web transaction list: initial REST page, then live SSE updates with
 * REST catch-up on every reconnect / tab focus. Never refetches the whole list
 * for a single event; never shows a duplicate.
 */
export function useTransactionStream(filters: Filters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<StreamStatus>('connecting');

  const filtersRef = useRef<Filters>(filters);
  filtersRef.current = filters;
  const lastTsRef = useRef<string>(new Date(0).toISOString());
  const catchingUpRef = useRef(false);

  const matches = useCallback((t: Transaction): boolean => {
    const f = filtersRef.current;
    if (f.type && t.type !== f.type) return false;
    if (f.category && (t.category ?? '').toLowerCase() !== f.category.toLowerCase())
      return false;
    return true;
  }, []);

  const upsert = useCallback(
    (tx: Transaction) => {
      setTransactions((prev) => {
        const idx = prev.findIndex((p) => p.id === tx.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = tx;
          return next.sort(byDateDesc);
        }
        if (!matches(tx)) return prev;
        return [tx, ...prev].sort(byDateDesc);
      });
    },
    [matches],
  );

  const removeById = useCallback((id: string) => {
    setTransactions((prev) =>
      prev.some((p) => p.id === id) ? prev.filter((p) => p.id !== id) : prev,
    );
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactions({ page: 1, ...filtersRef.current });
      setTransactions(res.transactions);
      setHasMore(res.hasMore);
      setPage(1);
      lastTsRef.current = new Date().toISOString();
    } finally {
      setLoading(false);
    }
  }, []);

  const applyEvent = useCallback(
    (evt: TransactionStreamEvent) => {
      if (evt.occurredAt > lastTsRef.current) lastTsRef.current = evt.occurredAt;
      switch (evt.type) {
        case 'transaction.created':
        case 'transaction.updated':
          if (evt.data && 'amount' in evt.data) upsert(evt.data as Transaction);
          break;
        case 'transaction.deleted':
          if (evt.data && 'id' in evt.data) removeById(evt.data.id);
          break;
        case 'transaction.resync':
          void reload();
          break;
      }
    },
    [upsert, removeById, reload],
  );

  const catchUp = useCallback(async () => {
    if (catchingUpRef.current) return;
    catchingUpRef.current = true;
    try {
      for (let i = 0; i < 5; i += 1) {
        const res = await getTransactionChanges(lastTsRef.current);
        res.changes.forEach(applyEvent);
        lastTsRef.current = res.nextSince;
        if (!res.hasMore) break;
      }
    } catch {
      /* transient — next reconnect / focus retries */
    } finally {
      catchingUpRef.current = false;
    }
  }, [applyEvent]);

  // Initial load + reload whenever the active filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    getTransactions({ page: 1, ...filtersRef.current })
      .then((res) => {
        if (cancelled) return;
        setTransactions(res.transactions);
        setHasMore(res.hasMore);
        lastTsRef.current = new Date().toISOString();
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.category]);

  // One long-lived stream for the page's lifetime.
  useEffect(() => {
    const stream = new TransactionStream({
      onEvent: applyEvent,
      onStatusChange: (s) => {
        setStatus(s);
        if (s === 'live') void catchUp();
      },
    });
    stream.start();

    const onFocus = () => {
      if (document.visibilityState === 'visible') void catchUp();
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      stream.stop();
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [applyEvent, catchUp]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getTransactions({ page: next, ...filtersRef.current });
      setTransactions((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.transactions.filter((t) => !seen.has(t.id))];
      });
      setHasMore(res.hasMore);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore]);

  return { transactions, loading, loadingMore, hasMore, loadMore, status };
}
