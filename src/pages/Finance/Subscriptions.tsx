import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { GetAppButton } from '../../components/onboarding/GetAppButton';
import { getSubscriptions } from '../../services/finance.service';
import type { DetectedSubscription } from '../../types/finance.types';

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const SUB_COLORS: Record<string, string> = {
  netflix: '#e50914', spotify: '#1db954', hotstar: '#0f2541',
  amazon: '#ff9900', youtube: '#ff0000', apple: '#000000',
  zee5: '#9b59b6', jiocinema: '#0071ce', sonyliv: '#003087',
  'google one': '#4285f4', notion: '#000000', canva: '#00c4cc',
};

function getSubColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(SUB_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#334eac';
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptions().then(setSubscriptions).finally(() => setLoading(false));
  }, []);

  const totalMonthly = subscriptions.filter((s) => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  const totalAnnual = totalMonthly * 12;

  if (loading) {
    return (
      <Layout title="Subscriptions">
        <div className="max-w-2xl mx-auto space-y-4 pb-8">
          <div className="h-8 bg-[var(--color-bg-card)] rounded-xl animate-pulse w-48" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[var(--color-bg-card)] rounded-2xl animate-pulse border border-[var(--color-border-primary)]" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscriptions">
      <div className="max-w-2xl mx-auto space-y-5 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-h3 text-[var(--color-text-primary)]">Subscriptions</h1>
          <p className="text-body-md text-[var(--color-text-secondary)] mt-1">Auto-detected recurring payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                <Repeat className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">Monthly</span>
            </div>
            <p className="text-h3 font-bold text-[var(--color-text-primary)] tabular-nums">{formatINR(totalMonthly)}</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{subscriptions.filter((s) => s.isActive).length} active subscriptions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-bg)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[var(--color-warning-dark)]" />
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">Annual</span>
            </div>
            <p className="text-h3 font-bold text-[var(--color-text-primary)] tabular-nums">{formatINR(totalAnnual)}</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Projected yearly cost</p>
          </motion.div>
        </div>

        {/* Subscription List */}
        {subscriptions.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl">
            <div className="w-14 h-14 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-6 h-6 text-[var(--color-text-tertiary)]" />
            </div>
            <p className="font-bold text-[var(--color-text-primary)]">No subscriptions detected yet</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1 mb-5 max-w-xs mx-auto">
              Koshpal spots recurring payments automatically once your transactions sync from the mobile app.
            </p>
            <GetAppButton />
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub, i) => {
              const color = getSubColor(sub.merchantName);
              const initials = getInitials(sub.merchantName);
              const isUpcoming = sub.nextExpectedAt && new Date(sub.nextExpectedAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
                >
                  {/* Logo */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{sub.merchantName}</p>
                      {isUpcoming && (
                        <span className="text-xs bg-[var(--color-warning-bg)] text-[var(--color-warning-dark)] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Due soon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {sub.frequency}
                      </span>
                      {sub.nextExpectedAt && (
                        <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next: {formatDate(sub.nextExpectedAt)}
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {sub.transactionCount} payments detected
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-base font-bold text-[var(--color-text-primary)] tabular-nums">{formatINR(sub.amount)}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">/ month</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
