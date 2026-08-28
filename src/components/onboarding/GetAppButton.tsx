import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { GetTheAppModal } from './GetTheAppModal';

/**
 * Small "Get the app" CTA for Finance empty states — transactions only sync
 * from the mobile app, so every "no data yet" screen should point there.
 */
export const GetAppButton: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 ${className ?? ''}`}
      >
        <Smartphone className="h-4 w-4" />
        Get the app
      </button>
      <AnimatePresence>{open && <GetTheAppModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
};
