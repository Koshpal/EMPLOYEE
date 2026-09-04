import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncResult<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  /** Re-run the async function (keeps the last `data` visible while refetching). */
  reload: () => void;
}

/**
 * Runs one async function and tracks its own `{ data, loading, error }`.
 *
 * Each call site owns an independent loading state, so a page that fans out to
 * several endpoints can render every widget the moment *its* data lands instead
 * of blocking on the slowest request. Stale responses are ignored when deps
 * change or the component unmounts.
 *
 * @param fn    the async function to run (read fresh from a ref each run)
 * @param deps  re-run whenever these change (same contract as useEffect deps)
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncResult<T> {
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: unknown }>({
    data: undefined,
    loading: true,
    error: undefined,
  });

  // "Latest callback" ref so `run` can stay stable while always calling the
  // freshest `fn` — the same pattern used by useTransactionStream.
  const fnRef = useRef(fn);
  // eslint-disable-next-line react-hooks/refs
  fnRef.current = fn;
  const reqId = useRef(0);

  const run = useCallback(() => {
    const id = ++reqId.current;
    setState((s) => ({ data: s.data, loading: true, error: undefined }));
    fnRef.current().then(
      (data) => {
        if (id === reqId.current) setState({ data, loading: false, error: undefined });
      },
      (error) => {
        if (id === reqId.current) setState((s) => ({ data: s.data, loading: false, error }));
      },
    );
  }, []);

  useEffect(() => {
    // Kicking off the fetch (and its loading flag) is the whole point of this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run();
    // Invalidate any in-flight request on unmount / deps change. We deliberately
    // want the *live* counter value here, not a snapshot.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      reqId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data: state.data, loading: state.loading, error: state.error, reload: run };
}
