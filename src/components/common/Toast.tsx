import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const STYLES: Record<ToastType, { border: string; fg: string; Icon: typeof Info }> = {
  success: { border: 'var(--color-success)', fg: 'var(--color-success-dark)', Icon: CheckCircle },
  error: { border: 'var(--color-error)', fg: 'var(--color-error-dark)', Icon: AlertCircle },
  info: { border: 'var(--color-primary)', fg: 'var(--color-primary)', Icon: Info },
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const s = STYLES[type];
  const Icon = s.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="max-w-[calc(100vw-2rem)] sm:max-w-sm"
    >
      <div
        role="status"
        className="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-[var(--color-bg-card)]"
        style={{ borderColor: s.border }}
      >
        <span className="mt-0.5 shrink-0" style={{ color: s.fg }}>
          <Icon className="w-5 h-5" />
        </span>
        <p className="flex-1 text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
          {message}
        </p>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="p-1 -m-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
