import { useCallback, useEffect, useState } from 'react';
import {
  employeeService,
  type ActivationStatus,
  type ActivationStepKey,
} from '../services/employee.service';

interface UseActivation {
  status: ActivationStatus | null;
  loading: boolean;
  /** true once the user has dismissed the checklist */
  dismissed: boolean;
  isComplete: boolean;
  done: (key: ActivationStepKey) => boolean;
  dismiss: () => Promise<void>;
  refetch: () => void;
}

/* --- tiny shared store so Header + Dashboard + the card share one request --- */
let cache: ActivationStatus | null = null;
let loaded = false;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

function fetchStatus(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (loaded && !force) return Promise.resolve();
  inFlight = employeeService
    .getActivation()
    .then((s) => {
      cache = s;
      loaded = true;
    })
    .catch(() => {
      cache = null;
      loaded = true;
    })
    .finally(() => {
      inFlight = null;
      notify();
    });
  return inFlight;
}

/**
 * First-run activation checklist state. Shared across the app; refetched when
 * the tab regains focus so ticking a box on another screen updates the UI.
 */
export function useActivation(): UseActivation {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  useEffect(() => {
    subscribers.add(rerender);
    void fetchStatus();
    const onFocus = () => {
      if (document.visibilityState === 'visible') void fetchStatus(true);
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      subscribers.delete(rerender);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [rerender]);

  const dismiss = useCallback(async () => {
    if (cache) {
      cache = { ...cache, dismissedAt: new Date().toISOString() };
      notify();
    }
    try {
      await employeeService.dismissActivation();
    } catch {
      void fetchStatus(true);
    }
  }, []);

  const done = useCallback(
    (key: ActivationStepKey) => !!cache?.steps.find((s) => s.key === key)?.done,
    [],
  );

  return {
    status: cache,
    loading: !loaded,
    dismissed: !!cache?.dismissedAt,
    isComplete: !!cache?.isComplete,
    done,
    dismiss,
    refetch: () => void fetchStatus(true),
  };
}
