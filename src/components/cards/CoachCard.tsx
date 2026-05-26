import React from 'react';
import { Star, MapPin, TrendingUp, Users, ArrowUpRight, MessageSquare } from 'lucide-react';
import type { Coach } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CoachCardProps {
  coach: Coach;
  onBook: (coach: Coach) => void;
  onViewProfile: (coach: Coach) => void;
}

/** Renders 5 stars — filled / half / empty — based on a decimal rating. */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => {
      const filled = rating >= i + 1;
      const half   = !filled && rating >= i + 0.5;
      return (
        <span key={i} className="relative inline-block w-3.5 h-3.5">
          {/* Empty base */}
          <Star className="w-3.5 h-3.5 text-(--color-border-primary) absolute inset-0" />
          {/* Filled / half overlay */}
          {(filled || half) && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? '100%' : '50%' }}
            >
              <Star className="w-3.5 h-3.5 fill-(--color-warning) text-(--color-warning)" />
            </span>
          )}
        </span>
      );
    })}
  </div>
);

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onBook, onViewProfile }) => (
  <div className="bg-(--color-bg-card) p-5 rounded-2xl border border-(--color-border-primary) shadow-sm hover:shadow-lg transition-all group animate-fade-in flex flex-col h-full">
    <div className="flex gap-4 mb-4">
      {/* Profile image */}
      <div className="relative shrink-0">
        <div className="w-24 h-28 rounded-2xl overflow-hidden shadow-md">
          <img
            src={coach.profilePhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
            alt={coach.fullName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        {/* Rating badge on image */}
        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-(--color-bg-card) rounded-xl px-1.5 py-0.5 shadow-md flex items-center gap-1 border border-(--color-border-primary)">
          <Star className="w-3 h-3 fill-(--color-warning) text-(--color-warning)" />
          <span className="text-xs font-bold text-(--color-text-primary)">
            {coach.rating > 0 ? coach.rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-lg font-bold text-(--color-text-primary) font-heading truncate mb-1">
          {coach.fullName}
        </h3>

        {/* Star row + review count */}
        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={coach.rating} />
          <span className="flex items-center gap-0.5 text-[11px] text-(--color-text-secondary)">
            <MessageSquare className="w-3 h-3" />
            {coach.totalFeedback > 0
              ? `${coach.totalFeedback} review${coach.totalFeedback !== 1 ? 's' : ''}`
              : 'No reviews yet'}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
            <TrendingUp className="w-3.5 h-3.5 text-(--color-primary)" />
            <span className="font-medium truncate">{(coach.expertise || []).slice(0, 2).join(', ')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
            <Users className="w-3.5 h-3.5 text-(--color-primary)" />
            <span>{coach.clientsHelped}+ clients helped</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
            <MapPin className="w-3.5 h-3.5 text-(--color-primary)" />
            <span>{coach.location || 'Remote'}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Expertise badges */}
    <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
      {(coach.expertise || []).map((exp, idx) => (
        <Badge key={idx} variant="info" className="text-[10px] py-0.5 px-2">
          {exp}
        </Badge>
      ))}
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 pt-4 border-t border-(--color-border-primary) mt-auto">
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
