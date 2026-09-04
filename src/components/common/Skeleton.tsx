import React from 'react';

/** A single shimmering placeholder block. Size it with `className`. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-[8px] bg-[var(--color-bg-tertiary)] ${className}`}
    aria-hidden="true"
  />
);

/** Centered spinner for a whole route while its lazy chunk loads. */
export const PageLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg-secondary)]">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-primary)]" />
    {label && <p className="text-body-sm text-[var(--color-text-secondary)]">{label}</p>}
  </div>
);

/** Small inline spinner for a widget body that has no meaningful skeleton shape. */
export const InlineLoader: React.FC<{ className?: string }> = ({ className = 'h-40' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-primary)]" />
  </div>
);
