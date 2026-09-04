import React from 'react';
import type { Consultation } from '../../types/booking.types';
import { IconClock, IconCalendarCheck, IconArrowUpRight } from '../icons/figma';

interface SessionRowProps {
  session: Consultation;
  showJoin?: boolean;
  onReschedule?: (s: Consultation) => void;
  onCancel?: (s: Consultation) => void;
  onDetails?: (s: Consultation) => void;
  onJoin?: (s: Consultation) => void;
}

function parts(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}
function timeRange(start: string, end?: string) {
  const o: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const s = new Date(start).toLocaleTimeString('en-US', o);
  return end ? `${s}-${new Date(end).toLocaleTimeString('en-US', o)}` : s;
}

/** Figma session-list row (Components 5/6/7) — date chip, coach, inline
 *  time + Reschedule/Cancel, then View Details (+ Join for today's session). */
export const SessionRow: React.FC<SessionRowProps> = ({
  session, showJoin, onReschedule, onCancel, onDetails, onJoin,
}) => {
  const p = parts(session.slot.startTime);
  const cancelled = session.status === 'CANCELLED';
  const role = session.coach?.expertise?.[0] ?? 'Financial Coach';

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-[12px] border border-[rgba(35,35,35,0.1)] bg-[var(--color-bg-card)] p-4 lg:flex-row">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center rounded-[12px] bg-[var(--color-white-mid)] px-5 py-2">
            <span className="text-body-sm text-black">{p.month}</span>
            <span className="font-label text-[24px] font-semibold leading-8 text-black">{p.day}</span>
          </div>
          <span className="hidden h-[68px] w-px bg-[var(--color-border-primary)] sm:block" />
        </div>
        <div className="flex flex-col items-center gap-6 py-0.5 sm:flex-row">
          <div className="flex flex-col items-start">
            <p className="text-[20px] leading-9 text-[var(--color-black-dark)]">{session.coach?.fullName}</p>
            <p className="text-[16px] leading-7 text-[var(--color-grey-darkest)]">{role}</p>
          </div>
          <div className="flex h-[56px] items-center gap-3 rounded-[8px] border-[0.8px] border-[var(--color-border-primary)] bg-white/60 px-3 py-2.5">
            <IconClock size={24} className="text-[var(--color-black-dark)]" />
            <span className="whitespace-nowrap text-[16px] leading-7 text-[var(--color-black-dark)]">
              {p.weekday}. {timeRange(session.slot.startTime, session.slot.endTime)}
            </span>
            <span className="text-[19px] font-extralight text-[var(--color-grey-mid)]">|</span>
            <button
              onClick={() => (cancelled ? undefined : onCancel && !showJoin ? onCancel(session) : onReschedule?.(session))}
              className="flex items-center gap-1.5 text-[16px] leading-7 text-[var(--color-black-dark)]"
            >
              <IconCalendarCheck size={20} />
              {cancelled ? 'Cancelled' : onCancel && !showJoin ? 'Cancel' : 'Reschedule'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showJoin && (
          <button
            onClick={() => onJoin?.(session)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] pl-6 pr-3 text-[16px] leading-7 text-white transition-colors hover:bg-[var(--color-primary-darkest)]"
          >
            Join&nbsp;Session
            <IconArrowUpRight size={24} />
          </button>
        )}
        <button
          onClick={() => onDetails?.(session)}
          className="flex h-12 items-center justify-center px-6 text-[16px] leading-7 text-[var(--color-primary)] underline"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
