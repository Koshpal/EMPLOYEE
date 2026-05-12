import React from 'react';
import { Star, MapPin, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import type { Coach } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CoachCardProps {
  coach: Coach;
  onBook: (coach: Coach) => void;
  onViewProfile: (coach: Coach) => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onBook, onViewProfile }) => {
  return (
    <div className="bg-[var(--color-bg-card)] p-5 rounded-2xl border border-[var(--color-border-primary)] shadow-sm hover:shadow-lg transition-all group animate-fade-in flex flex-col h-full">
      <div className="flex gap-4 mb-4">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-28 rounded-2xl overflow-hidden shadow-md">
            <img
              src={coach.profilePhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
              alt={coach.fullName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[var(--color-bg-card)] rounded-xl px-1.5 py-0.5 shadow-md flex items-center gap-1 border border-[var(--color-border-primary)]">
            <Star className="w-3 h-3 fill-[var(--color-warning)] text-[var(--color-warning)]" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">{coach.rating}</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-heading truncate mb-1">
            {coach.fullName}
          </h3>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="font-medium truncate">{(coach.expertise || []).slice(0, 2).join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>{coach.clientsHelped}+ clients helped</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>{coach.location || 'Remote'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expertise Badges */}
      <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
        {(coach.expertise || []).map((exp, idx) => (
          <Badge key={idx} variant="info" className="text-[10px] py-0.5 px-2">
            {exp}
          </Badge>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-[var(--color-border-primary)] mt-auto">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => onViewProfile(coach)}
        >
          View Profile
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1 text-xs gap-1"
          onClick={() => onBook(coach)}
        >
          Book Session
          <ArrowUpRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
