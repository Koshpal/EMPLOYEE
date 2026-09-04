import {
  IconCheck, IconTrendUpCircle, IconUserEye, IconClock,
} from '../icons/figma';

/** Indian-grouped integer string (Figma shows full numbers, not ₹40K). */
export const inr = (n: number) => Math.round(n || 0).toLocaleString('en-IN');

export type GoalRow = {
  name: string;
  target: string;
  saved: string;
  deadline: string;
  progress: number;
};

/** Per-tile Figma styling for the Overview "Summary" cards. */
export const SUMMARY_STYLES = {
  spendings: {
    Icon: IconCheck,
    bg: 'var(--color-success-bg)',
    circle: 'var(--color-success-500)',
    labelColor: 'var(--color-success-900)',
  },
  budget: {
    Icon: IconTrendUpCircle,
    bg: 'var(--color-info-bg)',
    circle: 'var(--color-primary-300)',
    labelColor: 'var(--color-primary-800)',
  },
  sessions: {
    Icon: IconUserEye,
    bg: 'var(--color-warning-bg)',
    circle: 'var(--color-warning-500)',
    labelColor: 'var(--color-warning-900)',
  },
  savings: {
    Icon: IconClock,
    bg: 'var(--color-secondary-lightest)',
    circle: 'var(--color-secondary-mid)',
    labelColor: 'var(--color-secondary-800)',
  },
} as const;
