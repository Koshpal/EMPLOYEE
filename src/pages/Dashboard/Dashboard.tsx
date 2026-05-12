import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { StatCard } from '../../components/cards/StatCard';
import { YourSessionCard } from '../../components/cards/YourSessionCard';
import { coachService } from '../../services/coach.service';
import type { Consultation, ConsultationStats } from '../../types/booking.types';
import { Calendar, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [latestSession, setLatestSession] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, latestData] = await Promise.all([
          coachService.getMyConsultationStats(),
          coachService.getLatestConsultation()
        ]);
        setStats(statsData);
        setLatestSession(latestData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
              Welcome back, {user?.name?.split(' ')[0] || 'Employee'}! 👋
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Here's an overview of your professional growth and coaching sessions.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-success-bg)] text-[var(--color-success-dark)] font-semibold border border-[var(--color-success-light)]">
            <CheckCircle className="w-4 h-4" />
            <span>Profile 100% Complete</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sessions"
            value={stats?.total || 0}
            icon={Calendar}
            description="Overall sessions booked"
          />
          <StatCard
            title="Hours Spent"
            value={Math.round((stats?.minutesBooked || 0) / 60)}
            icon={Clock}
            description="Total coaching hours"
          />
          <StatCard
            title="Completed"
            value={stats?.confirmed || 0}
            icon={CheckCircle}
            description="Sessions attended"
          />
          <StatCard
            title="Next Milestone"
            value="80%"
            icon={TrendingUp}
            description="Growth target reached"
            trend={{ value: 5, isUp: true }}
          />
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
              <p className="text-[var(--color-text-secondary)] mt-1 mb-6">Connect with an expert coach to start your professional journey.</p>
              <button 
                onClick={() => navigate('/coaches')}
                className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                Browse Coaches
              </button>
            </div>
          )}
        </div>

        {/* Tips / Info Banner */}
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold mb-2 font-heading">Unlock Your Potential with Personalized Coaching</h2>
              <p className="text-white/80">
                Our expert coaches are here to help you navigate your career, build leadership skills, and achieve your professional goals.
              </p>
            </div>
            <button 
              onClick={() => navigate('/coaches')}
              className="bg-white text-[var(--color-primary)] px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all whitespace-nowrap"
            >
              Find a Coach Now
            </button>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
