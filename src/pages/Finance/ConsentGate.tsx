import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/common/Layout';
import { getConsent, updateConsent } from '../../services/finance.service';
import type { FinancialConsent } from '../../types/finance.types';

export default function ConsentGate() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState<FinancialConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ smsSync: false, analytics: false, hrVisible: false, coachVisible: false });

  useEffect(() => {
    getConsent().then((c) => {
      setConsent(c);
      setForm({ smsSync: c.smsSync, analytics: c.analytics, hrVisible: c.hrVisible, coachVisible: c.coachVisible });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateConsent(form);
      setConsent(updated);
      if (updated.hasConsented) navigate('/finance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Financial Consent">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]" />
        </div>
      </Layout>
    );
  }

  const features = [
    {
      key: 'smsSync' as const,
      title: 'SMS Transaction Sync',
      description: 'Allow the app to read and sync financial SMS messages from your device to auto-import transactions.',
      required: true,
      icon: Shield,
    },
    {
      key: 'analytics' as const,
      title: 'Financial Analytics',
      description: 'Enable smart categorization, spending analysis, and financial wellness scoring.',
      required: true,
      icon: Eye,
    },
    {
      key: 'hrVisible' as const,
      title: 'Share with HR (Optional)',
      description: 'Allow HR to see anonymized financial wellness indicators only. Your transaction details are never shared.',
      required: false,
      icon: EyeOff,
    },
    {
      key: 'coachVisible' as const,
      title: 'Share with Coach (Optional)',
      description: 'Allow your wellness coach to see aggregated financial stress indicators to provide better support.',
      required: false,
      icon: Eye,
    },
  ];

  return (
    <Layout title="Financial Privacy Settings">
      <div className="max-w-2xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-h2 text-[var(--color-text-primary)]">Privacy-First Financial Tracking</h1>
            <p className="text-body-md text-[var(--color-text-secondary)] mt-2 max-w-md mx-auto">
              Your financial data belongs to you. Choose what you share and with whom. You can change or revoke these at any time.
            </p>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)] rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[var(--color-success-dark)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[var(--color-success-dark)]">Your Privacy is Protected</p>
              <p className="text-xs text-[var(--color-success-dark)] mt-0.5">
                HR and coaches can <strong>never</strong> see your raw transactions, balances, or merchant details.
                Only anonymized wellness indicators are ever shared, and only with your explicit consent.
              </p>
            </div>
          </div>

          {/* Consent Options */}
          <div className="space-y-3 mb-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = form[feature.key];
              return (
                <motion.div
                  key={feature.key}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isEnabled
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-lightest)]'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-bg-card)]'
                  }`}
                  onClick={() => {
                    if (!feature.required) {
                      setForm((prev) => ({ ...prev, [feature.key]: !prev[feature.key] }));
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isEnabled ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {feature.title}
                          {feature.required && (
                            <span className="ml-2 text-xs text-[var(--color-primary)] font-medium">(Required for features)</span>
                          )}
                        </p>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isEnabled
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                            : 'border-[var(--color-border-secondary)]'
                        }`}>
                          {isEnabled && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setForm({ smsSync: true, analytics: true, hrVisible: false, coachVisible: false })}
              className="w-full py-3 px-6 rounded-xl bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-semibold hover:bg-[var(--color-bg-secondary)] transition-all text-sm"
            >
              Enable Recommended (SMS + Analytics only)
            </button>
            <button
              disabled={saving || (!form.smsSync && !form.analytics)}
              onClick={handleSave}
              className="w-full py-3.5 px-6 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Save & Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
            {consent?.hasConsented && (
              <button
                onClick={() => navigate('/finance')}
                className="w-full py-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>

          <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-4">
            You can update these settings anytime from your profile.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
