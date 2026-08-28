import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle, ClipboardList, ShieldCheck, Target, CalendarPlus,
  Smartphone, Check, ChevronRight, X, PartyPopper,
} from 'lucide-react';
import type { ActivationStepKey } from '../../services/employee.service';
import { useActivation } from '../../hooks/useActivation';
import { GetTheAppModal } from './GetTheAppModal';

type StepDef = {
  key: ActivationStepKey;
  label: string;
  benefit: string;
  cta: string;
  icon: React.ElementType;
};

const STEPS: StepDef[] = [
  { key: 'profile', label: 'Complete your profile', benefit: 'Add a photo and phone number so your coach knows who they\'re meeting.', cta: 'Edit profile', icon: UserCircle },
  { key: 'checkin', label: 'Take the 2-minute money check-in', benefit: 'A few quick questions so Koshpal can tailor tips and goals to you.', cta: 'Start', icon: ClipboardList },
  { key: 'consent', label: 'Turn on financial tracking', benefit: 'Unlock your wellness score, spending breakdown and insights.', cta: 'Set up', icon: ShieldCheck },
  { key: 'goal', label: 'Set your first savings goal', benefit: 'Give your money a target and watch the progress add up.', cta: 'Add a goal', icon: Target },
  { key: 'session', label: 'Book a coaching session', benefit: 'A free 1-on-1 with a financial coach — pick a time that suits you.', cta: 'Find a coach', icon: CalendarPlus },
  { key: 'app', label: 'Get the mobile app', benefit: 'Automatic expense tracking from your transaction SMS — no manual entry.', cta: 'Get the app', icon: Smartphone },
];

export const GetStartedCard: React.FC = () => {
  const navigate = useNavigate();
  const { status, loading, dismissed, isComplete, done, dismiss } = useActivation();
  const [showApp, setShowApp] = useState(false);

  if (loading || !status || dismissed) return null;

  const handle = (key: ActivationStepKey) => {
    switch (key) {
      case 'profile': return navigate('/profile');
      case 'checkin': return navigate('/onboarding');
      case 'consent': return navigate('/finance/consent');
      case 'goal': return navigate('/finance/goals?new=1');
      case 'session': return navigate('/coaches');
      case 'app': return setShowApp(true);
    }
  };

  const pct = Math.round((status.completedCount / status.total) * 100);

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-[var(--color-success)] bg-[var(--color-success-bg)] px-5 py-4"
      >
        <PartyPopper className="h-5 w-5 shrink-0 text-[var(--color-success-dark)]" />
        <p className="flex-1 text-sm font-semibold text-[var(--color-success-dark)]">
          You&rsquo;re all set up. Nice work!
        </p>
        <button
          onClick={dismiss}
          className="text-xs font-bold text-[var(--color-success-dark)] underline underline-offset-2 hover:opacity-80"
        >
          Dismiss
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-sm"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-primary)] p-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
              Get started with Koshpal
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
              {status.completedCount} of {status.total} done — finish these to get the most out of your account.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Hide checklist"
            className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* progress bar */}
        <div className="h-1.5 w-full bg-[var(--color-bg-tertiary)]">
          <motion.div
            className="h-full bg-[var(--color-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <ul className="divide-y divide-[var(--color-border-primary)]">
          <AnimatePresence initial={false}>
            {STEPS.map((step, i) => {
              const complete = done(step.key);
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      complete
                        ? 'bg-[var(--color-success)] text-white'
                        : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold ${
                        complete
                          ? 'text-[var(--color-text-tertiary)] line-through'
                          : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                      {step.label}
                    </p>
                    {!complete && (
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{step.benefit}</p>
                    )}
                  </div>
                  {!complete && (
                    <button
                      onClick={() => handle(step.key)}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                    >
                      {step.cta}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </motion.section>

      <AnimatePresence>{showApp && <GetTheAppModal onClose={() => setShowApp(false)} />}</AnimatePresence>
    </>
  );
};
