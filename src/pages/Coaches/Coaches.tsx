import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/common/Layout';
import { CoachCard } from '../../components/cards/CoachCard';
import { BookingModal } from '../../components/modals/BookingModal';
import { coachService, type CoachAvailabilitySummary } from '../../services/coach.service';
import { coachingOpsService } from '../../services/coachingOps.service';
import type { Coach } from '../../types/booking.types';
import { IconRefresh, IconBrain, IconSettings2 } from '../../components/icons/figma';

const Coaches: React.FC = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [availability, setAvailability] = useState<Record<string, CoachAvailabilitySummary> | null>(null);
  const [loading, setLoading] = useState(true);
  // The employee's assigned programme coach (null when not on the programme): shown first and labelled.
  const [myCoachId, setMyCoachId] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const load = async () => {
    setLoading(true);
    setAvailability(null);
    try {
      const data = await coachService.getCoaches();
      setCoaches(data);
      const wantId = new URLSearchParams(window.location.search).get('coach');
      const match = wantId && data.find((c) => c.id === wantId);
      if (match) {
        setSelectedCoach(match);
        setIsBookingOpen(true);
      }
      // Non-blocking: cards render immediately, the availability strip fills in.
      coachService
        .getAvailabilitySummary(7)
        .then(setAvailability)
        .catch(() => setAvailability({}));
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { coachingOpsService.overview().then((o) => setMyCoachId(o.coach?.id ?? null)).catch(() => undefined); }, []);

  const handleBook = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsBookingOpen(true);
  };

  // Figma "Session Booking" header — no "Book session" CTA, just the icon buttons.
  const iconBtn =
    'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';
  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Settings" onClick={() => navigate('/profile')}><IconSettings2 size={20} /></button>
    </>
  );

  return (
    <Layout title="Session Booking" headerActions={headerActions}>
      <BookingModal
        isOpen={isBookingOpen}
        coach={selectedCoach}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => { /* keep the modal open: its confirmation step closes via "Done" */ }}
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
            {loading ? 'Financial Coaches' : `${coaches.length} Financial Coaches available`}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={load}
              className="flex h-8 items-center gap-1 rounded-full pl-2 pr-3 text-[12px] leading-[22px] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-lightest)]"
            >
              <IconRefresh size={16} />
              Refresh recommendations
            </button>
            <a
              href="mailto:koshpal@koshpal.com?subject=Tips%20for%20picking%20a%20coach"
              className="flex h-8 items-center gap-1 rounded-full border border-[var(--color-secondary-mid)] pl-2 pr-3 text-[12px] leading-[22px] text-[var(--color-secondary-800)]"
            >
              <IconBrain size={16} />
              Tips for picking a coach
            </a>
          </div>
        </div>

        {!loading && coaches.length > 0 && (
          <p className="rounded-xl bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            {myCoachId
              ? 'You continue your sessions with your coach. To change coach, contact your Koshpal admin.'
              : 'The first coach you book becomes your coach, and you continue your sessions with them. An admin confirms the match afterwards.'}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[236px] animate-pulse rounded-[16px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]" />
            ))}
          </div>
        ) : coaches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...coaches].sort((a, b) => Number(b.id === myCoachId) - Number(a.id === myCoachId)).map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                isYourCoach={coach.id === myCoachId}
                onBook={handleBook}
                availability={availability ? availability[coach.id] ?? { nextSlot: null, days: [] } : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-card)] py-20 text-center">
            <h3 className="font-heading text-[18px] font-semibold text-[var(--color-text-primary)]">No coaches available</h3>
            <p className="mt-2 text-body-sm text-[var(--color-text-secondary)]">Check back soon — new coaches are added regularly.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Coaches;
