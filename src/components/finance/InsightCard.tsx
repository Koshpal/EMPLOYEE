import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp, Info, CheckCircle, Bell, CreditCard, Repeat } from 'lucide-react';
import type { FinancialInsight, InsightType, InsightSeverity } from '../../types/finance.types';
import { markInsightRead } from '../../services/finance.service';

const INSIGHT_ICONS: Record<InsightType, React.ElementType> = {
  SPENDING_ALERT: TrendingUp,
  SAVING_OPPORTUNITY: TrendingDown,
  BUDGET_EXCEEDED: AlertTriangle,
  SALARY_RECEIVED: CheckCircle,
  SUBSCRIPTION_DETECTED: Repeat,
  FINANCIAL_SCORE_CHANGE: TrendingUp,
  EMI_REMINDER: CreditCard,
  UNUSUAL_ACTIVITY: Bell,
  MONTHLY_SUMMARY: Info,
  RECURRING_DETECTED: Repeat,
};

const SEVERITY_STYLES: Record<InsightSeverity, { bg: string; border: string; icon: string; badge: string }> = {
  SUCCESS: {
    bg: 'bg-[var(--color-success-bg)]',
    border: 'border-[var(--color-success)]',
    icon: 'text-[var(--color-success-dark)]',
    badge: 'bg-[var(--color-success-bg)] text-[var(--color-success-dark)]',
  },
  INFO: {
    bg: 'bg-[var(--color-info-bg)]',
    border: 'border-[var(--color-primary-light)]',
    icon: 'text-[var(--color-primary)]',
    badge: 'bg-[var(--color-primary-lightest)] text-[var(--color-primary)]',
  },
  WARNING: {
    bg: 'bg-[var(--color-warning-bg)]',
    border: 'border-[var(--color-warning)]',
    icon: 'text-[var(--color-warning-dark)]',
    badge: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)]',
  },
  ALERT: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-[var(--color-error-light)]',
    icon: 'text-[var(--color-error-dark)]',
    badge: 'bg-red-100 text-[var(--color-error-dark)]',
  },
};

interface InsightCardProps {
  insight: FinancialInsight;
  onRead?: () => void;
  compact?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onRead, compact = false }) => {
  const Icon = INSIGHT_ICONS[insight.type] ?? Info;
  const styles = SEVERITY_STYLES[insight.severity];

  const handleRead = async () => {
    if (!insight.isRead) {
      await markInsightRead(insight.id);
      onRead?.();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-2xl border ${styles.border} ${styles.bg} cursor-pointer transition-all duration-200 hover:shadow-md ${
        !insight.isRead ? 'ring-1 ring-[var(--color-primary)]/20' : 'opacity-80'
      } ${compact ? '' : ''}`}
      onClick={handleRead}
    >
      {!insight.isRead && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
      )}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-4 h-4 ${styles.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {insight.severity}
            </span>
          </div>
          <p className="text-sm font-bold text-[var(--color-text-primary)] mb-0.5">{insight.title}</p>
          {!compact && (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{insight.message}</p>
          )}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">{timeAgo(insight.createdAt)}</p>
        </div>
      </div>
    </motion.div>
  );
};
