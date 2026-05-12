import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/common/Layout';
import { coachService } from '../../services/coach.service';
import type { Consultation } from '../../types/booking.types';
import { ChevronLeft, ChevronRight, ExternalLink, Video } from 'lucide-react';
import { formatDateLocal } from '../../utils/date';

const Calendar: React.FC = () => {
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  useEffect(() => {
    fetchSessions();
  }, [currentWeekStart]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const end = new Date(currentWeekStart);
      end.setDate(currentWeekStart.getDate() + 7);
      const data = await coachService.getMyConsultations(
        undefined, 
        formatDateLocal(currentWeekStart),
        formatDateLocal(end)
      );
      setSessions(data);
    } catch (error) {
      console.error('Error fetching calendar sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  const getSessionsForTime = (day: Date, hour: number) => {
    return sessions.filter(s => {
      const start = new Date(s.slot.startTime);
      return start.toDateString() === day.toDateString() && start.getHours() === hour;
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  return (
    <Layout title="My Calendar">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Calendar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-bg-card)] p-4 rounded-2xl border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-[var(--color-bg-tertiary)] rounded-xl">
              <button 
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() - 7);
                  setCurrentWeekStart(d);
                }}
                className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  const day = today.getDay();
                  const start = new Date(today);
                  start.setDate(today.getDate() - day);
                  start.setHours(0, 0, 0, 0);
                  setCurrentWeekStart(start);
                }}
                className="px-4 py-2 text-sm font-bold hover:bg-[var(--color-bg-card)] rounded-lg transition-all"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() + 7);
                  setCurrentWeekStart(d);
                }}
                className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">
              {currentWeekStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary-lightest)] text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary-light)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              Upcoming Session
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-primary)] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Grid Header */}
              <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]/50">
                <div className="p-4 border-r border-[var(--color-border-primary)]" />
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={`p-4 text-center border-r border-[var(--color-border-primary)] last:border-r-0 ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                        {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className={`text-2xl font-bold font-heading ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="relative">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-[var(--color-border-primary)] group last:border-b-0 min-h-[100px]">
                    <div className="p-4 text-xs font-bold text-[var(--color-text-tertiary)] text-right border-r border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)]/10">
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                    </div>
                    {weekDays.map((day, i) => {
                      const daySessions = getSessionsForTime(day, hour);
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={i} className={`p-2 border-r border-[var(--color-border-primary)] last:border-r-0 relative group-hover:bg-[var(--color-bg-tertiary)]/20 transition-colors ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                          {daySessions.map(session => (
                            <div 
                              key={session.id}
                              className={`p-3 rounded-2xl border text-xs shadow-md animate-scale-in cursor-pointer hover:scale-105 transition-transform
                                ${session.status === 'CONFIRMED' 
                                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)]'}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold truncate pr-2">{session.coach.fullName}</span>
                                <Video className="w-3 h-3 flex-shrink-0" />
                              </div>
                              <p className="opacity-80 truncate">{session.coach.expertise[0]}</p>
                              {session.status === 'CONFIRMED' && session.meetingLink && (
                                <button 
                                  onClick={() => window.open(session.meetingLink, '_blank')}
                                  className="mt-2 w-full py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                  Join <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
