import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/common/Layout';
import { CoachCard } from '../../components/cards/CoachCard';
import { BookingModal } from '../../components/modals/BookingModal';
import { coachService } from '../../services/coach.service';
import type { Coach } from '../../types/booking.types';
import { Search, SlidersHorizontal } from 'lucide-react';

const Coaches: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('All');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const data = await coachService.getCoaches();
        setCoaches(data);
      } catch (error) {
        console.error('Error fetching coaches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const allExpertise = ['All', ...new Set(coaches.flatMap(c => (c.expertise || [])))];

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coach.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExpertise = selectedExpertise === 'All' || coach.expertise.includes(selectedExpertise);
    return matchesSearch && matchesExpertise;
  });

  const handleBook = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsBookingModalOpen(true);
  };

  const handleViewProfile = (coach: Coach) => {
    console.log('View profile:', coach.fullName);
  };

  return (
    <Layout title="Expert Coaches">
      <div className="space-y-8 max-w-7xl mx-auto">
        <BookingModal 
          isOpen={isBookingModalOpen} 
          coach={selectedCoach} 
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            // Optional: Refresh data if needed
          }}
        />
        {/* Header Section */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
              Find Your Perfect Coach 🎯
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Browse our curated list of industry experts ready to help you level up your career.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold border border-[var(--color-primary)]/20">
            <span className="text-xl">💼</span>
            <span>{coaches.length} Experts Available</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--color-bg-card)] p-4 rounded-2xl border border-[var(--color-border-primary)] shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[var(--color-text-secondary)] mr-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filter:
            </div>
            {allExpertise.map((exp) => (
              <button
                key={exp}
                onClick={() => setSelectedExpertise(exp)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedExpertise === exp
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] animate-pulse" />
            ))}
          </div>
        ) : filteredCoaches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoaches.map((coach) => (
              <CoachCard 
                key={coach.id} 
                coach={coach} 
                onBook={handleBook} 
                onViewProfile={handleViewProfile} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-[var(--color-border-primary)]">
            <div className="w-20 h-20 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[var(--color-text-tertiary)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">No coaches found</h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedExpertise('All'); }}
              className="mt-6 text-[var(--color-primary)] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Coaches;
