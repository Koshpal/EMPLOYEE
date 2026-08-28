import React from 'react';
import { motion } from 'framer-motion';
import { X, Smartphone, Zap } from 'lucide-react';

// TODO: replace with the real store URLs once published.
const APP_STORE_URL = 'https://apps.apple.com/app/koshpal';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.koshpal';
const SHORT_LINK = 'koshpal.com/app';

interface Props {
  onClose: () => void;
}

export const GetTheAppModal: React.FC<Props> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-8 shadow-2xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Smartphone className="h-6 w-6" />
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <h2 className="mt-4 font-heading text-xl font-bold text-[var(--color-text-primary)]">
        Get automatic expense tracking
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        The Koshpal mobile app reads your transaction SMS (no bank login) and syncs everything here
        automatically — your spending breakdown, wellness score and insights fill in on their own.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--color-primary)]/5 p-3 text-xs text-[var(--color-text-secondary)]">
        <Zap className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
        Your data stays private — parsed on your device, never a bank credential.
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Get it on Google Play
        </a>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-xl border border-[var(--color-border-primary)] px-6 py-3 text-sm font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
        >
          Download on the App Store
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--color-text-tertiary)]">
        Or open <span className="font-semibold text-[var(--color-text-secondary)]">{SHORT_LINK}</span> on your phone
      </p>
    </motion.div>
  </div>
);
