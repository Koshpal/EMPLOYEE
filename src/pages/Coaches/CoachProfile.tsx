import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { SessionDetailsModal } from '../../components/modals/SessionDetailsModal';
import { coachService } from '../../services/coach.service';
import type { Coach, Consultation } from '../../types/booking.types';
import { IconStar, IconClock, IconBell, IconSettings2 } from '../../components/icons/figma';

function fmtDay(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  };
}
function fmtSlot(s?: Consultation) {
  if (!s?.slot?.startTime) return { weekday: '—', time: '' };
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return {
    weekday: new Date(s.slot.startTime).toLocaleDateString('en-US', { weekday: 'long' }),
    time: `${new Date(s.slot.startTime).toLocaleTimeString('en-US', opts)}-${
      s.slot.endTime ? new Date(s.slot.endTime).toLocaleTimeString('en-US', opts) : ''
    }`,
  };
}

const iconBtn =
  'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

const CoachProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsFor, setDetailsFor] = useState<Consultation | null>(null);

  useEffect(() => {
    (async () => {
      const [cs, ms] = await Promise.allSettled([
        coachService.getCoaches(),
        coachService.getMyConsultations(),
      ]);
      if (cs.status === 'fulfilled') setCoach(cs.value.find((c) => c.id === id) ?? null);
      if (ms.status === 'fulfilled') setSessions(ms.value.filter((s) => s.coach?.id === id));
      setLoading(false);
    })();
  }, [id]);

  const upcoming = useMemo(
    () => sessions.filter((s) => new Date(s.slot.startTime).getTime() >= Date.now() && s.status !== 'CANCELLED'),
    [sessions],
  );
  const past = useMemo(
    () => sessions.filter((s) => new Date(s.slot.startTime).getTime() < Date.now() || s.status === 'CANCELLED'),
    [sessions],
  );

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  if (loading) {
    return (
      <Layout title="Session Booking" headerActions={headerActions}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-primary)]" />
        </div>
      </Layout>
    );
  }

  const up = upcoming[0];
  const upSlot = fmtSlot(up);

  return (
    <Layout title="Session Booking" headerActions={headerActions}>
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate('/coaches')}
          className="self-start font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)] hover:text-[var(--color-primary)]"
        >
          Coach Profile
        </button>

        <div className="rounded-[12px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-8">
          <div className="flex flex-col gap-9 lg:flex-row lg:items-start">
            {/* Left */}
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div className="relative flex flex-col items-center pt-14">
                {coach?.profilePhoto ? (
                  <img
                    src={coach.profilePhoto}
                    alt={coach.fullName}
                    className="absolute top-0 h-[85px] w-[85px] rounded-full border-4 border-[var(--color-primary-light)] object-cover"
                  />
                ) : (
                  <div className="absolute top-0 flex h-[85px] w-[85px] items-center justify-center rounded-full border-4 border-[var(--color-primary-light)] bg-[var(--color-primary-lightest)] text-2xl font-bold text-[var(--color-primary)]">
                    {coach?.fullName?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="w-full max-w-[454px] rounded-[14px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-[18px] pb-[34px] pt-[58px]">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <p className="font-grotesque text-[24px] font-medium leading-[44px] text-[var(--color-neutral-900)]">
                        {coach?.fullName ?? 'Coach'}
                      </p>
                      <span className="flex items-center gap-1 rounded-[52px] bg-[var(--color-bg-tertiary)] py-0.5 pl-2 pr-2.5">
                        <IconStar size={24} className="text-[var(--color-warning)]" />
                        <span className="font-label text-[16px] leading-[26px] text-[var(--color-black-light)]">
                          {coach && coach.rating > 0 ? coach.rating.toFixed(1) : '—'}
                        </span>
                      </span>
                    </div>
                    <p className="text-[20px] leading-9 text-[var(--color-grey-darkest)]">
                      {coach?.expertise?.slice(0, 2).join(' · ') || 'Certified Financial Coach'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(coach?.expertise ?? []).slice(0, 3).map((e) => (
                        <span
                          key={e}
                          className="rounded-[20px] bg-[var(--color-secondary-lightest)] px-2.5 py-0.5 text-[16px] leading-7 text-[var(--color-secondary-mid)]"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[18px]">
                <Section title="About coach" body={coach?.bio || 'This coach has not added a bio yet.'} />
                <Section
                  title="Education"
                  body={coach?.languages?.length ? `Speaks ${coach.languages.join(', ')}` : 'Details coming soon.'}
                />
                <Section
                  title="Highlights"
                  body={
                    coach
                      ? `${coach.clientsHelped}+ clients helped with a ${coach.successRate}% success rate. ${coach.totalFeedback} reviews.`
                      : ''
                  }
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex w-full flex-col gap-7 lg:w-[452px]">
              <div className="flex flex-col gap-6">
                <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
                  Upcoming Session
                </h3>
                <div className="flex items-center justify-between rounded-[12px] border border-[rgba(35,35,35,0.1)] bg-[var(--color-bg-card)] p-4">
                  {up ? (
                    <>
                      <span className="flex items-center gap-1.5 rounded-[8px] border-[0.8px] border-[var(--color-border-primary)] bg-white/60 px-3 py-2.5 text-[16px] leading-7 text-[var(--color-black-dark)]">
                        <IconClock size={24} />
                        {upSlot.weekday}. {upSlot.time}
                      </span>
                      <button
                        onClick={() => setDetailsFor(up)}
                        className="px-6 text-[16px] leading-7 text-[var(--color-primary)] underline"
                      >
                        View Details
                      </button>
                    </>
                  ) : (
                    <p className="py-2 text-body-sm text-[var(--color-text-secondary)]">No upcoming session with this coach.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex h-10 items-center justify-between">
                  <h3 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">
                    Past Sessions
                  </h3>
                  <span className="flex h-8 items-center rounded-[20px] bg-[var(--color-info-bg)] px-4 font-label text-[12px] font-medium leading-[22px] text-[var(--color-primary)]">
                    {past.length} session{past.length === 1 ? '' : 's'}
                  </span>
                </div>
                {past.length === 0 && (
                  <p className="rounded-[12px] border border-[rgba(35,35,35,0.1)] p-4 text-body-sm text-[var(--color-text-secondary)]">
                    No past sessions yet.
                  </p>
                )}
                {past.map((s) => {
                  const d = fmtDay(s.slot.startTime);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-[12px] border border-[rgba(35,35,35,0.1)] bg-[var(--color-bg-card)] p-4"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center rounded-[12px] bg-[var(--color-white-mid)] px-5 py-2">
                          <span className="text-body-sm text-black">{d.month}</span>
                          <span className="font-label text-[24px] font-semibold leading-8 text-black">{d.day}</span>
                        </div>
                        <span className="h-[68px] w-px bg-[var(--color-border-primary)]" />
                      </div>
                      <div className="flex items-center gap-3">
                        {s.hasFeedback ? (
                          <span className="flex h-[38px] items-center gap-1 rounded-[19px] bg-[var(--color-bg-tertiary)] pl-2.5 pr-3">
                            <IconStar size={24} className="text-[var(--color-warning)]" />
                            <span className="text-[20px] leading-9 text-[var(--color-black-light)]">
                              {typeof s.feedbackRating === 'number' ? s.feedbackRating : '—'}
                            </span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDetailsFor(s)}
                            className="flex h-[38px] items-center rounded-[19px] bg-[var(--color-bg-tertiary)] px-3 text-[20px] leading-9 text-[var(--color-primary)]"
                          >
                            Rate now
                          </button>
                        )}
                        <button
                          onClick={() => setDetailsFor(s)}
                          className="px-6 text-[16px] leading-7 text-[var(--color-primary)] underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SessionDetailsModal
        isOpen={!!detailsFor}
        session={detailsFor}
        onClose={() => setDetailsFor(null)}
        onFeedbackSubmitted={() => setDetailsFor(null)}
      />
    </Layout>
  );
};

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-heading text-[18px] font-semibold leading-8 text-[var(--color-black-mid)]">{title}</h4>
      <p className="font-label text-[16px] leading-[26px] text-[var(--color-neutral-600)]">{body}</p>
    </div>
  );
}

export default CoachProfile;
