import React from 'react';
import { ExternalLink, User as UserIcon, Calendar, MessageSquare } from 'lucide-react';
import type { Consultation } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ConsultationCardProps {
  consultation: Consultation;
  onViewDetails?: (id: string) => void;
}

export const ConsultationCard: React.FC<ConsultationCardProps> = ({ consultation, onViewDetails }) => {
  if (!consultation || !consultation.slot) return null;
  const isUpcoming = new Date(consultation.slot.startTime) > new Date();

  const formatDateTime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-primary)] shadow-sm hover:shadow-md transition-all animate-fade-in group">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
            {consultation.coach?.profilePhoto ? (
              <img src={consultation.coach.profilePhoto} alt={consultation.coach.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)]">
                <UserIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-heading">
              {consultation.coach?.fullName || 'Expert Coach'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {consultation.coach?.expertise?.slice(0, 2).join(', ')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDateTime(consultation.slot.startTime)}</span>
              </div>
              <Badge variant={
                consultation.status === 'CONFIRMED' ? 'success' : 
                consultation.status === 'CANCELLED' ? 'error' : 'secondary'
              }>
                {consultation.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col justify-end gap-2">
          {isUpcoming && consultation.status === 'CONFIRMED' && (
            <Button 
              variant="primary" 
              size="sm" 
              className="gap-2"
              onClick={() => consultation.meetingLink && window.open(consultation.meetingLink, '_blank')}
            >
              Join
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => onViewDetails?.(consultation.id)}
          >
            Details
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      {consultation.notes && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
          <p className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">Your Notes</p>
          <p className="text-sm text-[var(--color-text-secondary)] italic">"{consultation.notes}"</p>
        </div>
      )}
    </div>
  );
};
