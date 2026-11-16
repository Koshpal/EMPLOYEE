import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Wider layout for forms with many fields */
  size?: 'sm' | 'md' | 'lg';
  /** Block Escape / backdrop dismissal while saving */
  busy?: boolean;
  footer?: React.ReactNode;
}

const WIDTH = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/**
 * Accessible modal dialog: role=dialog + aria-modal, labelled by its title, Escape and backdrop close
 * (unless `busy`), focus moves into the dialog and returns to the opener, Tab is kept inside.
 */
export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, size = 'md', busy, footer }) => {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [],
      );
    (node?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[1] ?? focusables()[0])?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[92vh] w-full ${WIDTH[size]} flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-5 py-4">
          <h2 id={titleId} className="font-heading text-[18px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-[var(--color-border-primary)] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const fieldCls =
  'w-full rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-60';
export const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]';
