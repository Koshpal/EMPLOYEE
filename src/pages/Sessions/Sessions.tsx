import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { SessionRow } from '../../components/cards/SessionRow';
import { SessionDetailsModal } from '../../components/modals/SessionDetailsModal';
import { coachService } from '../../services/coach.service';
import type { Consultation } from '../../types/booking.types';
import { IconBell, IconSettings2, IconAngleDown, IconPlus } from '../../components/icons/figma';

type Tab = 'upcoming' | 'past' | 'cancelled';

const iconBtn =
  'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
function withinDays(iso: string, days: number) {
  const diff = new Date(iso).getTime() - Date.now();
  return diff >= 0 && diff <= days * 864e5;
}

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [selected, setSelected] = useState<Consultation | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await coachService.getMyConsultations();
      setSessions(
        data.sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()),
      );
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchSessions(); }, []);

  const buckets = useMemo(() => {
    const now = Date.now();
    const upcoming = sessions.filter((s) => new Date(s.slot.startTime).getTime() >= now && s.status !== 'CANCELLED');
    const past = sessions.filter((s) => new Date(s.slot.startTime).getTime() < now && s.status !== 'CANCELLED');
    const cancelled = sessions.filter((s) => s.status === 'CANCELLED');
    return { upcoming, past: [...past].reverse(), cancelled };
  }, [sessions]);

  const list = buckets[tab];

  // group the upcoming tab by Today / This Week / Later
  const groups: { label: string; items: Consultation[] }[] = useMemo(() => {
    if (tab !== 'upcoming') return [{ label: '', items: list }];
    const today = list.filter((s) => isToday(s.slot.startTime));
    const week = list.filter((s) => !isToday(s.slot.startTime) && withinDays(s.slot.startTime, 7));
    const later = list.filter((s) => !isToday(s.slot.startTime) && !withinDays(s.slot.startTime, 7));
    return [
      { label: 'Today', items: today },
      { label: 'Next Week', items: week },
      { label: 'Later', items: later },
    ].filter((g) => g.items.length);
  }, [tab, list]);

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const headerBelow = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center rounded-[6px] bg-[var(--color-white-mid)] px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-[130px] rounded-[6px] px-6 py-2.5 text-[16px] leading-5 transition-colors ${
              tab === t.id
                ? 'bg-[var(--color-bg-card)] text-black shadow-[var(--shadow-drop-low)]'
                : 'text-[var(--color-grey-darkest)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="flex w-[108px] items-center justify-center gap-1 rounded-[8px] border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-2.5 py-3.5 text-[14px] font-medium leading-5 text-black">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          <IconAngleDown size={16} />
        </button>
        <button
          onClick={() => navigate('/coaches')}
          className="flex h-12 items-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] pl-3 pr-6 text-[16px] leading-7 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
        >
          <IconPlus size={24} />
          New Session
        </button>
      </div>
    </div>
  );

  return (
    <Layout title="Sessions" headerActions={headerActions} headerBelow={headerBelow}>
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[106px] animate-pulse rounded-[12px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-card)] py-20 text-center">
          <h3 className="font-heading text-[18px] font-semibold text-[var(--color-text-primary)]">
            {tab === 'upcoming' ? 'No upcoming sessions' : tab === 'past' ? 'No past sessions' : 'No cancelled sessions'}
          </h3>
          <p className="mt-2 text-body-sm text-[var(--color-text-secondary)]">
            {tab === 'upcoming' ? 'Book a session with a coach to get started.' : 'Nothing to show here yet.'}
          </p>
          {tab === 'upcoming' && (
            <button
              onClick={() => navigate('/coaches')}
              className="mt-6 rounded-[8px] bg-[var(--color-primary)] px-6 py-2.5 text-[16px] text-white hover:bg-[var(--color-primary-darkest)]"
            >
              Book a session
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <div key={g.label || 'all'} className="flex flex-col gap-4">
              {g.label && (
                <h2 className="font-heading text-[24px] font-semibold leading-9 text-[var(--color-black-mid)]">
                  {g.label}
                </h2>
              )}
              {g.items.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  showJoin={tab === 'upcoming' && isToday(s.slot.startTime)}
                  onReschedule={() => navigate('/sessions')}
                  onCancel={tab === 'upcoming' ? () => setSelected(s) : undefined}
                  onDetails={() => setSelected(s)}
                  onJoin={() => (s.meetingLink ? window.open(s.meetingLink, '_blank') : setSelected(s))}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <SessionDetailsModal
        isOpen={!!selected}
        session={selected}
        onClose={() => setSelected(null)}
        onFeedbackSubmitted={fetchSessions}
      />
    </Layout>
  );
};

export default Sessions;
