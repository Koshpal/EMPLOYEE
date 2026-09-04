import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types/booking.types';
import type { CoachAvailabilitySummary } from '../../services/coach.service';
import { IconStar, IconClock, IconArrowRight } from '../icons/figma';

interface CoachCardProps {
  coach: Coach;
  onBook: (coach: Coach) => void;
  /** Real availability for this coach; omitted while the summary is still loading. */
  availability?: CoachAvailabilitySummary;
}

/** "2026-09-08" -> "Mon" (parsed as a local date, no TZ shift). */
function weekdayShort(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
}

function slotTimeRange(slot: { startTime: string; endTime: string }): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  };
  const s = new Date(slot.startTime).toLocaleTimeString('en-IN', opts);
  const e = new Date(slot.endTime).toLocaleTimeString('en-IN', opts);
  return `${s}-${e}`;
}

/**
 * Figma "Coach Booking" card — 360px, radius 16, Neutral/100 border.
 * Avatar + name/subtitle + rating pill, expertise chips, an availability strip,
 * then outline "View Profile" and primary "Book Session".
 */
export const CoachCard: React.FC<CoachCardProps> = ({ coach, onBook, availability }) => {
  const navigate = useNavigate();
  const subtitle =
    coach.successRate > 0
      ? `${coach.successRate}% success · ${coach.clientsHelped}+ helped`
      : coach.expertise.slice(0, 2).join(' · ') || 'Certified Financial Coach';

  const nextSlot = availability?.nextSlot ?? null;
  const dayLabels = Array.from(
    new Set((availability?.days ?? []).map(weekdayShort).filter(Boolean)),
  ).slice(0, 3);

  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-[16px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-5 pb-[30px] pt-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          {coach.profilePhoto ? (
            <img
              src={coach.profilePhoto}
              alt={coach.fullName}
              className="h-[65px] w-[65px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-[65px] w-[65px] shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-lightest)] text-lg font-bold text-[var(--color-primary)]">
              {coach.fullName.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-heading text-[18px] font-semibold leading-8 text-black">
                  {coach.fullName}
                </p>
                <p className="truncate text-body-sm text-[var(--color-grey-darkest)]">{subtitle}</p>
              </div>
              <span className="flex h-[25px] shrink-0 items-center gap-0.5 rounded-[12px] bg-[var(--color-bg-tertiary)] pl-1.5 pr-2">
                <IconStar size={16} className="text-[var(--color-warning)]" />
                <span className="text-body-xs text-[var(--color-black-light)]">
                  {coach.rating > 0 ? coach.rating.toFixed(1) : '—'}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {coach.expertise.slice(0, 3).map((e) => (
                <span
                  key={e}
                  className="rounded-[20px] bg-[var(--color-secondary-lightest)] px-2.5 py-0.5 text-[12px] leading-[18px] text-[var(--color-secondary-mid)]"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[8px] border-[0.8px] border-[var(--color-border-primary)] bg-white/60 px-3 py-2">
          <span className="flex items-center gap-1 text-[12px] leading-[22px] text-[var(--color-primary)]">
            <IconClock size={20} />
            {nextSlot ? 'Next 7 days' : 'Availability'}
          </span>
          {nextSlot ? (
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              {dayLabels.length > 0 && (
                <>
                  <span className="text-body-sm text-[var(--color-grey-darkest)]">{dayLabels.join(', ')}</span>
                  <span className="text-[11px] text-[var(--color-grey-mid)]">|</span>
                </>
              )}
              <span className="text-[12px] leading-[22px] text-[var(--color-grey-darkest)]">{slotTimeRange(nextSlot)}</span>
            </span>
          ) : (
            <span className="text-[12px] leading-[22px] text-[var(--color-grey-darkest)]">
              {availability ? 'No open slots this week' : 'Checking…'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => navigate(`/coaches/${coach.id}`)}
          className="flex h-[41px] flex-1 items-center justify-center rounded-[8px] border border-[var(--color-primary)] text-[16px] leading-7 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-lightest)]"
        >
          View Profile
        </button>
        <button
          onClick={() => onBook(coach)}
          className="flex h-[41px] flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] text-[16px] leading-7 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
        >
          Book Session
          <IconArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
