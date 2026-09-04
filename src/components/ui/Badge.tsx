import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Fully rounded pill instead of the default 4px "Tag label" radius. */
  pill?: boolean;
  /** Outlined style (e.g. Budgets "On Track"). */
  outline?: boolean;
  className?: string;
}

/**
 * Figma "Tag label" — Outfit 12/22, radius 4, tinted background, no border by
 * default. `pill` / `outline` cover the coach-chip and status-pill variants.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  pill = false,
  outline = false,
  className,
}) => {
  const fills = {
    primary: 'bg-[var(--color-primary-lightest)] text-[var(--color-primary)]',
    secondary: 'bg-[var(--color-secondary-lightest)] text-[var(--color-secondary-mid)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-darkest)]',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error-dark)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-primary)]',
    neutral: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  };
  const outlines = {
    primary: 'border border-[var(--color-primary)] text-[var(--color-primary)]',
    secondary: 'border border-[var(--color-secondary-mid)] text-[var(--color-secondary-mid)]',
    success: 'border border-[var(--color-success)] text-[var(--color-success-dark)]',
    warning: 'border border-[var(--color-warning)] text-[var(--color-warning-darkest)]',
    error: 'border border-[var(--color-error)] text-[var(--color-error-dark)]',
    info: 'border border-[var(--color-primary)] text-[var(--color-primary)]',
    neutral: 'border border-[var(--color-border-primary)] text-[var(--color-text-secondary)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 text-xs font-normal leading-[22px] whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded-[4px]',
        outline ? outlines[variant] : fills[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
