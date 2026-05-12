import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: 'bg-[var(--color-primary-lightest)] text-[var(--color-primary)] border-[var(--color-primary-light)]',
    secondary: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)] border-[var(--color-success-light)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)] border-[var(--color-warning-light)]',
    error: 'bg-[rgba(245,90,81,0.1)] text-[var(--color-error)] border-[var(--color-error-light)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-primary-light)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
