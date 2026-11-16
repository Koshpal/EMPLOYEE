import { describe, expect, it } from 'vitest';
import { rangeParams, selectionFromSearch } from './range';
import { formatChange, formatINR } from './money';

describe('range helpers', () => {
  it('defaults to this month for missing or unknown ranges', () => {
    expect(selectionFromSearch(new URLSearchParams(''))).toEqual({ range: 'THIS_MONTH' });
    expect(selectionFromSearch(new URLSearchParams('range=EVIL'))).toEqual({ range: 'THIS_MONTH' });
  });
  it('accepts a valid custom range', () => {
    expect(selectionFromSearch(new URLSearchParams('range=CUSTOM&from=2026-10-01&to=2026-10-31'))).toEqual({ range: 'CUSTOM', from: '2026-10-01', to: '2026-10-31' });
  });
  it('rejects a reversed, malformed or incomplete custom range', () => {
    for (const q of ['range=CUSTOM&from=2026-10-31&to=2026-10-01', 'range=CUSTOM&from=nope&to=2026-10-01', 'range=CUSTOM&from=2026-10-01']) {
      expect(selectionFromSearch(new URLSearchParams(q))).toEqual({ range: 'THIS_MONTH' });
    }
  });
  it('only sends dates for CUSTOM and only when both exist', () => {
    expect(rangeParams({ range: 'LAST_MONTH', from: '2026-01-01', to: '2026-01-02' })).toEqual({ range: 'LAST_MONTH' });
    expect(rangeParams({ range: 'CUSTOM', from: '2026-01-01' })).toEqual({ range: 'THIS_MONTH' });
    expect(rangeParams({ range: 'CUSTOM', from: '2026-01-01', to: '2026-01-31' })).toEqual({ range: 'CUSTOM', from: '2026-01-01', to: '2026-01-31' });
  });
});

describe('money formatting', () => {
  it('groups in the Indian style and signs negatives', () => {
    expect(formatINR(123456)).toBe('₹1,23,456');
    expect(formatINR(-50)).toBe('−₹50');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(10.5, { paise: true })).toBe('₹10.50');
  });
  it('shows a dash instead of a percentage when there is nothing to compare', () => {
    expect(formatChange(null)).toBe('—');
    expect(formatChange(12.4)).toBe('+12%');
    expect(formatChange(-8)).toBe('−8%');
    expect(formatChange(0)).toBe('0%');
  });
});
