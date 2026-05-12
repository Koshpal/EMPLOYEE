import React from 'react';
import { Clock, ExternalLink, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Consultation } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface YourSessionCardProps {
  session: Consultation;
}

export const YourSessionCard: React.FC<YourSessionCardProps> = ({ session }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/sessions', { state: { consultationId: session.id } });
  };

  const handleJoinSession = () => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    }
  };

  const formatDateTime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  if (!session || !session.slot) return null;

  return (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-primary)] shadow-sm hover:shadow-md transition-all animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary-lightest)] flex items-center justify-center text-[var(--color-primary)]">
            {session.coach?.profilePhoto ? (
              <img src={session.coach.profilePhoto} alt={session.coach.fullName || 'Coach'} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-heading">
              Session with {session.coach?.fullName || 'Expert Coach'}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                <Clock className="w-4 h-4" />
                <span>{formatDateTime(session.slot.startTime)}</span>
              </div>
              <Badge variant={session.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                {session.status || 'PENDING'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={handleViewDetails}>
            View Details
          </Button>
          <Button variant="primary" size="md" onClick={handleJoinSession} disabled={!session.meetingLink}>
            Join Session
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
