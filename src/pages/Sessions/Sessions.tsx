import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { ConsultationCard } from '../../components/cards/ConsultationCard';
import { SessionDetailsModal } from '../../components/modals/SessionDetailsModal';
import { coachService } from '../../services/coach.service';
import type { Consultation } from '../../types/booking.types';
import { Calendar, Clock, Search } from 'lucide-react';

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedSession, setSelectedSession] = useState<Consultation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await coachService.getMyConsultations();
      // Sort sessions by date
      const sorted = data.sort((a, b) =>
        new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime()
      );
      setSessions(sorted);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingSessions = sessions.filter(s => new Date(s.slot.startTime) >= now && s.status !== 'CANCELLED');
  const pastSessions = sessions.filter(s => new Date(s.slot.startTime) < now || s.status === 'CANCELLED');

  const filterBySearch = (list: typeof sessions) => {
    if (!searchTerm.trim()) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(s =>
      s.coach?.fullName?.toLowerCase().includes(lower) ||
      s.slot?.startTime?.toLowerCase().includes(lower) ||
      s.status?.toLowerCase().includes(lower)
    );
  };

  const displayedSessions = filterBySearch(activeTab === 'upcoming' ? upcomingSessions : pastSessions);

  const handleViewDetails = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowDetailsModal(true);
    }
  };

  return (
    <Layout title="My Sessions">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header section with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[var(--color-bg-card)] p-8 rounded-3xl border border-[var(--color-border-primary)] shadow-sm">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading mb-2">Your Coaching Journey 🚀</h1>
            <p className="text-[var(--color-text-secondary)]">Manage your upcoming sessions and review notes from past conversations with your expert coaches.</p>
          </div>
          <div className="bg-[var(--color-primary)] p-8 rounded-3xl text-white shadow-lg flex flex-col justify-center">
            <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-1">Total Sessions</p>
            <p className="text-4xl font-bold font-heading">{sessions.length}</p>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-[var(--color-border-primary)] pb-4">
          <div className="flex p-1 bg-[var(--color-bg-tertiary)] rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Upcoming ({upcomingSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'past'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Past & Cancelled ({pastSessions.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by coach name or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-[var(--color-bg-tertiary)] animate-pulse" />
            ))}
          </div>
        ) : displayedSessions.length > 0 ? (
          <div className="space-y-4">
            {displayedSessions.map(session => (
              <ConsultationCard
                key={session.id}
                consultation={session}
                onViewDetails={handleViewDetails}
                onBookAgain={(coachId) => navigate(`/coaches?coach=${coachId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-[var(--color-border-primary)]">
            <div className="w-20 h-20 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text-tertiary)]">
              {activeTab === 'upcoming' ? <Calendar className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">
              {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions found'}
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              {activeTab === 'upcoming' 
                ? 'Your scheduled sessions will appear here. Ready to grow?' 
                : 'Your session history will appear here once you complete your first session.'}
            </p>
            {activeTab === 'upcoming' && (
              <button 
                onClick={() => navigate('/coaches')}
                className="mt-6 bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90"
              >
                Book Your First Session
              </button>
            )}
          </div>
        )}
      </div>

      <SessionDetailsModal
        isOpen={showDetailsModal}
        session={selectedSession}
        onClose={() => setShowDetailsModal(false)}
        onFeedbackSubmitted={fetchSessions}
      />
    </Layout>
  );
};

export default Sessions;
