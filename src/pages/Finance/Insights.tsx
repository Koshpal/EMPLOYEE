import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { InsightCard } from '../../components/finance/InsightCard';
import { getSmartInsights, markAllInsightsRead, generateInsights } from '../../services/finance.service';
import type { FinancialInsight, InsightSeverity } from '../../types/finance.types';

const SEVERITY_FILTERS: (InsightSeverity | 'All')[] = ['All', 'ALERT', 'WARNING', 'INFO', 'SUCCESS'];

export default function Insights() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<InsightSeverity | 'All'>('All');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const data = await getSmartInsights(50);
    setInsights(data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await markAllInsightsRead();
    setInsights((prev) => prev.map((i) => ({ ...i, isRead: true })));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateInsights();
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const filtered = insights.filter((i) => severityFilter === 'All' || i.severity === severityFilter);
  const unreadCount = insights.filter((i) => !i.isRead).length;

  return (
    <Layout title="Smart Insights">
      <div className="max-w-2xl mx-auto space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h3 text-[var(--color-text-primary)]">Smart Insights</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-[var(--color-primary)] font-medium mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-semibold transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Severity filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                severityFilter === f
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Insights list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--color-bg-card)] rounded-2xl animate-pulse border border-[var(--color-border-primary)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl"
          >
            <Bell className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="font-bold text-[var(--color-text-primary)]">No insights yet</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Sync transactions and generate insights to see personalized financial analysis.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ins) => (
              <InsightCard
                key={ins.id}
                insight={ins}
                onRead={() => setInsights((prev) => prev.map((i) => i.id === ins.id ? { ...i, isRead: true } : i))}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
