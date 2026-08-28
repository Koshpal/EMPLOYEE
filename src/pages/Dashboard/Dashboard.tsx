import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { StatCard } from '../../components/cards/StatCard';
import { YourSessionCard } from '../../components/cards/YourSessionCard';
import { GetStartedCard } from '../../components/onboarding/GetStartedCard';
import { SessionDetailsModal } from '../../components/modals/SessionDetailsModal';
import { coachService } from '../../services/coach.service';
import type { Consultation, ConsultationStats } from '../../types/booking.types';
import { Calendar, CheckCircle, Clock, Rocket, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActivation } from '../../hooks/useActivation';

const BANNER_DISMISS_KEY = 'employee_dash_banner_dismissed_at';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status: activation, isComplete: activationComplete, done } = useActivation();
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [latestSession, setLatestSession] = useState<Consultation | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [feedbackFor, setFeedbackFor] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => !!localStorage.getItem(BANNER_DISMISS_KEY),
  );

  useEffect(() => {
    const run = async () => {
      try {
        const [statsData, latestData, list] = await Promise.all([
          coachService.getMyConsultationStats(),
          coachService.getLatestConsultation(),
          coachService.getMyConsultations().catch(() => [] as Consultation[]),
        ]);
        setStats(statsData);
        setLatestSession(latestData);
        setConsultations(list);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Prompt for feedback once on the most recent finished session that has none.
  useEffect(() => {
    const now = Date.now();
    const pending = consultations
      .filter(
        (c) =>
          c.slot?.startTime &&
          new Date(c.slot.startTime).getTime() < now &&
          c.status !== 'CANCELLED' &&
          !c.hasFeedback,
      )
      .sort(
        (a, b) => new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime(),
      )[0];
    if (!pending) return;
    const seen = localStorage.getItem(`feedback_prompted_${pending.id}`);
    if (seen) return;
    localStorage.setItem(`feedback_prompted_${pending.id}`, '1');
    setFeedbackFor(pending);
  }, [consultations]);

  const banner = useMemo(() => {
    if (!stats) return null;
    if (stats.total === 0) {
      return {
        title: 'Unlock your potential with personalized coaching',
        body: 'Book a free 1-on-1 with a financial coach — pick a time that suits you.',
        cta: 'Find a coach',
        to: '/coaches',
      };
    }
    if (activation && !done('consent')) {
      return {
        title: 'See where your money goes',
        body: 'Turn on financial tracking to unlock your wellness score, spending breakdown and insights.',
        cta: 'Set it up',
        to: '/finance/consent',
      };
    }
    if (activation && !done('goal')) {
      return {
        title: 'Give your savings a target',
        body: 'Set a goal and track your progress toward it every month.',
        cta: 'Add a goal',
        to: '/finance/goals?new=1',
      };
    }
    return {
      title: 'Keep the momentum going',
      body: 'Review your latest insights and book your next coaching session.',
      cta: 'View finance',
      to: '/finance',
    };
  }, [stats, activation, done]);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      </Layout>
    );
  }

  const milestone = !activationComplete && activation
    ? {
        title: 'Getting started',
        value: `${activation.completedCount}/${activation.total}`,
        description: 'Setup steps done',
      }
    : {
        title: 'This month',
        value: stats?.thisMonth ?? 0,
        description: 'Sessions this month',
      };

  return (
    <Layout title="Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
              Welcome{stats && stats.total > 0 ? ' back' : ''}, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Your coaching sessions and financial wellness, all in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--color-primary)/10 text-(--color-primary) font-semibold border border-(--color-primary)/20 hover:bg-(--color-primary)/20 transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            <span>View Profile</span>
          </button>
        </div>

        {/* First-run activation checklist */}
        <GetStartedCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Sessions" value={stats?.total || 0} icon={Calendar} description="Sessions booked" />
          <StatCard title="Hours Spent" value={Math.round((stats?.minutesBooked || 0) / 60)} icon={Clock} description="Total coaching hours" />
          <StatCard title="Completed" value={stats?.confirmed || 0} icon={CheckCircle} description="Sessions attended" />
          <StatCard title={milestone.title} value={milestone.value} icon={Rocket} description={milestone.description} />
        </div>

        {/* Latest Session Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              Your Next Session
            </h2>
            <button
              onClick={() => navigate('/sessions')}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              View all sessions
            </button>
          </div>

          {latestSession ? (
            <YourSessionCard session={latestSession} />
          ) : (
            <div className="bg-[var(--color-bg-card)] p-12 rounded-2xl border border-dashed border-[var(--color-border-primary)] text-center">
              <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-heading">No upcoming sessions</h3>
              <p className="text-[var(--color-text-secondary)] mt-1 mb-6">Connect with an expert coach to start your journey.</p>
              <button
                onClick={() => navigate('/coaches')}
                className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Browse Coaches
              </button>
            </div>
          )}
        </div>

        {/* Context banner */}
        {banner && !bannerDismissed && (
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <button
              aria-label="Dismiss"
              onClick={() => {
                localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
                setBannerDismissed(true);
              }}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold mb-2 font-heading">{banner.title}</h2>
                <p className="text-white/80">{banner.body}</p>
              </div>
              <button
                onClick={() => navigate(banner.to)}
                className="bg-white text-[var(--color-primary)] px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all whitespace-nowrap"
              >
                {banner.cta}
              </button>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          </div>
        )}
      </div>

      <SessionDetailsModal
        isOpen={!!feedbackFor}
        session={feedbackFor}
        onClose={() => setFeedbackFor(null)}
        onFeedbackSubmitted={() => setFeedbackFor(null)}
      />
    </Layout>
  );
};

export default Dashboard;
