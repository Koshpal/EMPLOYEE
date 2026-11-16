import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { invalidate, useApi } from './useApi';

describe('useApi shared cache', () => {
  it('shares one request between two consumers of the same key', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a']);
    const one = renderHook(() => useApi('categories?t', fetcher));
    const two = renderHook(() => useApi('categories?t', fetcher));
    await waitFor(() => expect(one.result.current.data).toEqual(['a']));
    expect(two.result.current.data).toEqual(['a']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches mounted keys when a matching prefix is invalidated (e.g. after a mutation)', async () => {
    let n = 0;
    const fetcher = vi.fn(async () => ++n);
    const { result } = renderHook(() => useApi('budgets?x', fetcher));
    await waitFor(() => expect(result.current.data).toBe(1));
    act(() => invalidate('budgets'));
    await waitFor(() => expect(result.current.data).toBe(2));
    act(() => invalidate('unrelated'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps showing the last good data when a refresh fails, and exposes the error', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce('ok').mockRejectedValueOnce(new Error('down'));
    const { result } = renderHook(() => useApi('insights/k', fetcher));
    await waitFor(() => expect(result.current.data).toBe('ok'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.data).toBe('ok');
    expect(result.current.initialLoading).toBe(false);
  });

  it('does nothing for a null key', () => {
    const fetcher = vi.fn();
    const { result } = renderHook(() => useApi(null, fetcher));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
