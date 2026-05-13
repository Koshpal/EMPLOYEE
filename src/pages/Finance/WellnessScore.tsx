import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, CreditCard, Activity, Shield, Repeat, CheckCircle } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { ScoreRing } from '../../components/finance/ScoreRing';
import { getLatestScore, getScoreHistory, calculateScore } from '../../services/finance.service';
import type { FinancialScore } from '../../types/finance.types';

interface ScoreComponent {
  label: string;
  key: keyof FinancialScore;
  max: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

const COMPONENTS: ScoreComponent[] = [
  { label: 'Savings Rate', key: 'savingsScore', max: 30, icon: TrendingUp, color: '#80b597', description: 'How consistently you save each month' },
  { label: 'EMI Burden', key: 'emiScore', max: 25, icon: CreditCard, color: '#334eac', description: 'Ratio of EMIs to your monthly income' },
  { label: 'Spending Stability', key: 'volatilityScore', max: 20, icon: Activity, color: '#f5a038', description: 'How stable your monthly spending is' },
  { label: 'Balance Health', key: 'balanceScore', max: 15, icon: Shield, color: '#17a2b8', description: 'Frequency of low balance events' },
  { label: 'Subscription Control', key: 'subscriptionScore', max: 10, icon: Repeat, color: '#9b59b6', description: 'Subscription spend as % of income' },
];

export default function WellnessScore() {
  const [score, setScore] = useState<FinancialScore | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    Promise.allSettled([getLatestScore(), getScoreHistory(6)]).then(([s, h]) => {
      if (s.status === 'fulfilled') setScore(s.value);
      if (h.status === 'fulfilled') setHistory(h.value);
    }).finally(() => setLoading(false));
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const newScore = await calculateScore();
      setScore(newScore);
      const hist = await getScoreHistory(6);
      setHistory(hist);
    } finally {
      setRecalculating(false);
    }
  };

  const historyData = history.map((h) => ({
    date: new Date(h.scoreDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Score: h.score,
  }));

  if (loading) {
    return (
      <Layout title="Wellness Score">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Financial Wellness Score">
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h3 text-[var(--color-text-primary)]">Wellness Score</h1>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              {score?.scoreDate ? `Last updated ${new Date(score.scoreDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No score yet'}
            </p>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>

        {/* Score Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 flex flex-col items-center gap-6"
        >
          <ScoreRing score={score?.score ?? 0} size={160} strokeWidth={14} />
          <div className="text-center max-w-xs">
            <p className="text-body-md text-[var(--color-text-secondary)]">
              Your financial wellness is measured across 5 key dimensions. Higher score = healthier financial behavior.
            </p>
          </div>
        </motion.div>

        {/* Component Breakdown */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
          <h3 className="text-h5 text-[var(--color-text-primary)] mb-5">Score Breakdown</h3>
          <div className="space-y-5">
            {COMPONENTS.map((comp, i) => {
              const Icon = comp.icon;
              const value = score ? (score[comp.key] as number) ?? 0 : 0;
              const pct = Math.round((value / comp.max) * 100);

              return (
                <motion.div
                  key={comp.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${comp.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: comp.color }} />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{comp.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: comp.color }}>
                      {value} / {comp.max}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: comp.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{comp.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Score History */}
        {historyData.length > 1 && (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
            <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Score History</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={historyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [Number(v ?? 0), 'Score']}
                />
                <Line type="monotone" dataKey="Score" stroke="#334eac" strokeWidth={2.5} dot={{ r: 4, fill: '#334eac' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recommendations */}
        {score?.recommendations && score.recommendations.length > 0 && (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-6">
            <h3 className="text-h5 text-[var(--color-text-primary)] mb-4">Recommendations</h3>
            <div className="space-y-3">
              {score.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 bg-[var(--color-primary-lightest)] rounded-xl"
                >
                  <CheckCircle className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
