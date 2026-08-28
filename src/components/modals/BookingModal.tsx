import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check, Video, Loader2 } from 'lucide-react';
import type { Coach, Slot } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { coachService } from '../../services/coach.service';
import { formatDateLocal, isPastLocal } from '../../utils/date';

interface BookingModalProps {
  isOpen: boolean;
  coach: Coach | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, coach, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string>>(new Set());

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedSlot(null);
      setNotes('');
      if (coach) {
        fetchMonthAvailability();
      }
    }
  }, [isOpen, coach]);

  // Fetch month availability when month or coach changes
  useEffect(() => {
    if (isOpen && coach) {
      fetchMonthAvailability();
    }
  }, [currentMonth, coach]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (selectedDate && coach) {
      fetchSlotsForDate();
    }
  }, [selectedDate, coach]);

  const fetchMonthAvailability = async () => {
    if (!coach) return;
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = formatDateLocal(new Date(year, month, 1));
      const endDate = formatDateLocal(new Date(year, month + 1, 0));
      
      const availability = await coachService.getSlotAvailabilityRange(startDate, endDate, coach.id);
      const dates = new Set<string>(
        Object.entries(availability || {})
          .filter(([_, data]: any) => data && data.hasSlots)
          .map(([date]) => date)
      );
      setDatesWithSlots(dates);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchSlotsForDate = async () => {
    if (!coach || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = formatDateLocal(selectedDate);
      const response = await coachService.getCoachSlots(coach.id, dateStr);

      const slotsArray = Array.isArray(response) ? response : (response as any)?.slots || [];

      if (Array.isArray(slotsArray)) {
        setAvailableSlots(slotsArray.filter((s: any) =>
          s.status === 'AVAILABLE' ||
          s.status === 'available' ||
          s.isAvailable === true ||
          !s.status // If no status provided, assume available if returned
        ));
      } else {
        console.error('DEBUG: Could not find slots array in response:', response);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !coach) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      await coachService.bookConsultation(
        coach.id,
        selectedSlot.startTime,
        selectedSlot.endTime,
        notes
      );
      setCurrentStep(3);
      if (selectedDate) {
        fetchSlotsForDate();
      }
      onSuccess();
    } catch (error: any) {
      console.error('Booking failed:', error);
      if (selectedDate) {
        await fetchSlotsForDate();
      }
      setBookingError(error?.response?.data?.message || 'Failed to book session. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const slotDurationMin = (slot: Slot) =>
    Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000);

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-10" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);
      const hasSlots = datesWithSlots.has(dateStr);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isPast = isPastLocal(date);

      days.push(
        <button
          key={day}
          disabled={!hasSlots || isPast}
          onClick={() => setSelectedDate(date)}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm transition-all
            ${isSelected ? 'bg-[var(--color-primary)] text-white font-bold' : 
              hasSlots && !isPast ? 'hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] font-semibold' : 
              'text-[var(--color-text-tertiary)] opacity-30 cursor-not-allowed'}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  if (!isOpen || !coach) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--color-bg-card)] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">
              {currentStep === 3 ? 'Booking Confirmed' : 'Schedule Session'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {currentStep === 1 ? 'Select a date and time for your session' : 
               currentStep === 2 ? 'Review your booking details' : 
               'Your session has been successfully scheduled'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-text-primary)]">Select Date</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold w-32 text-center">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded-lg">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--color-text-tertiary)] mb-2">
                  {[
                    { abbr: 'S', full: 'Sunday' },
                    { abbr: 'M', full: 'Monday' },
                    { abbr: 'T', full: 'Tuesday' },
                    { abbr: 'W', full: 'Wednesday' },
                    { abbr: 'T', full: 'Thursday' },
                    { abbr: 'F', full: 'Friday' },
                    { abbr: 'S', full: 'Saturday' },
                  ].map(({ abbr, full }) => (
                    <div key={full} aria-label={full} title={full}>{abbr}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>

              {/* Slots Column */}
              <div className="space-y-4">
                <h3 className="font-bold text-[var(--color-text-primary)]">Select Time (IST)</h3>
                <div className="space-y-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span>Fetching slots...</span>
                    </div>
                  ) : selectedDate ? (
                    availableSlots.length > 0 ? (
                      availableSlots.map((slot, index) => {
                        const isSelected = selectedSlot && selectedSlot.startTime === slot.startTime;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer
                              ${isSelected ?
                                'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' :
                                'bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[var(--color-text-secondary)]'}`} />
                              <span className="font-bold">
                                {formatTime(slot.startTime)} &ndash; {formatTime(slot.endTime)}
                              </span>
                              <span className={`text-xs font-semibold ${isSelected ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}`}>
                                {slotDurationMin(slot)} min
                              </span>
                            </div>
                            {isSelected && <Check className="w-5 h-5" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)] p-6 bg-[var(--color-bg-tertiary)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
                        <Clock className="w-10 h-10 mb-2 opacity-20" />
                        <p>No available slots for this date.</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)] p-6 bg-[var(--color-bg-tertiary)] rounded-2xl border border-dashed border-[var(--color-border-primary)]">
                      <CalendarIcon className="w-10 h-10 mb-2 opacity-20" />
                      <p>Please select a date from the calendar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-[var(--color-primary)]/5 p-6 rounded-3xl border border-[var(--color-primary)]/10">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-heading mb-4">Session Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Date</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{selectedDate?.toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider">Time</p>
                      <p className="font-bold text-[var(--color-text-primary)]">
                        {selectedSlot && `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}`} (IST)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">Add Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Tell your coach about what you'd like to discuss..."
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-[var(--color-warning-bg)] rounded-2xl border border-[var(--color-warning-light)] text-[var(--color-warning-dark)] text-sm">
                <Video className="w-5 h-5 flex-shrink-0" />
                <p>A meeting link will be automatically generated and shared with you.</p>
              </div>

              {bookingError && (
                <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 px-4 py-3 rounded-2xl">{bookingError}</p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="py-8 text-center space-y-6">
              <div className="w-24 h-24 bg-[var(--color-success-bg)] text-[var(--color-success-dark)] rounded-full flex items-center justify-center mx-auto mb-6 scale-110 animate-bounce">
                <Check className="w-12 h-12" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">You're all set!</h2>
              <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
                Your session with <span className="font-bold text-[var(--color-text-primary)]">{coach.fullName}</span> has been scheduled. Check your dashboard for the meeting link.
              </p>
              <div className="pt-6">
                <Button variant="primary" size="lg" className="px-12" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep < 3 && (
          <div className="p-6 border-t border-[var(--color-border-primary)] flex items-center gap-4">
            {currentStep === 1 ? (
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            ) : (
              <Button variant="secondary" className="flex-1" onClick={() => { setCurrentStep(1); setBookingError(null); }}>Back</Button>
            )}

            {currentStep === 1 ? (
              <Button 
                variant="primary" 
                className="flex-[2]" 
                disabled={!selectedSlot} 
                onClick={() => setCurrentStep(2)}
              >
                Next Step
              </Button>
            ) : (
              <Button 
                variant="primary" 
                className="flex-[2]" 
                loading={bookingLoading} 
                onClick={handleBook}
              >
                Confirm Booking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
