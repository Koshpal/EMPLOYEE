import React, { useState, useEffect } from 'react';
import { X, Star, Send } from 'lucide-react';
import type { Consultation } from '../../types/booking.types';
import { Button } from '../ui/Button';
import { coachService } from '../../services/coach.service';

interface SessionDetailsModalProps {
  isOpen: boolean;
  session: Consultation | null;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

interface SessionNotes {
  coachNotes: {
    id: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  employeeFeedback: {
    id: string;
    rating: number;
    feedbackText: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  session,
  onClose,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notes, setNotes] = useState<SessionNotes | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      fetchSessionNotes();
    }
  }, [isOpen, session]);

  const fetchSessionNotes = async () => {
    if (!session) return;
    setLoadingNotes(true);
    try {
      const data = await coachService.getSessionDetails(session.id);
      setNotes(data);
      if (data.employeeFeedback) {
        setRating(data.employeeFeedback.rating);
        setFeedback(data.employeeFeedback.feedbackText);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  if (!isOpen || !session) return null;

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      setSubmitError('Please select a star rating to continue.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await coachService.submitFeedback(session.id, {
        rating,
        feedback,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setRating(0);
        setFeedback('');
        setSubmitted(false);
        onFeedbackSubmitted?.();
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--color-bg-card)] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-heading">
              Session Details
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Review your session and share feedback
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {loadingNotes ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Session Info */}
              <div className="bg-[var(--color-primary)]/5 p-6 rounded-2xl border border-[var(--color-primary)]/10">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Session Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider mb-1">Coach</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{session.coach?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider mb-1">Date & Time</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{formatDateTime(session.slot.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Coach Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Coach Notes</h3>
                  <span className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full font-semibold">
                    Shared
                  </span>
                </div>
                {notes?.coachNotes ? (
                  <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-2xl border border-[var(--color-border-primary)]">
                    <p className="text-[var(--color-text-secondary)] mb-2">{notes.coachNotes.notes}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Updated: {formatDate(notes.coachNotes.updatedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-2xl border border-[var(--color-border-primary)] text-center">
                    <p className="text-[var(--color-text-tertiary)] italic">Coach hasn't added notes yet</p>
                  </div>
                )}
              </div>

              {/* Employee Feedback Display */}
              {notes?.employeeFeedback && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Your Feedback</h3>
                    <span className="text-xs bg-[var(--color-success-bg)] text-[var(--color-success-dark)] px-3 py-1 rounded-full font-semibold">
                      Submitted
                    </span>
                  </div>
                  <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-2xl border border-[var(--color-border-primary)] space-y-3">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < notes.employeeFeedback!.rating
                              ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                              : 'text-[var(--color-text-tertiary)]'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-semibold text-[var(--color-text-primary)]">
                        {notes.employeeFeedback.rating}/5
                      </span>
                    </div>
                    {notes.employeeFeedback.feedbackText && (
                      <p className="text-[var(--color-text-secondary)]">{notes.employeeFeedback.feedbackText}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Submitted: {formatDate(notes.employeeFeedback.createdAt)}
                    </p>
                  </div>
                </div>
              )}

              {!submitted ? (
                <>
                  {/* Rating Section */}
                  <div className="space-y-3">
                    <label className="block text-lg font-bold text-[var(--color-text-primary)]">
                      Rate Your Experience
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => { setRating(star); setSubmitError(null); }}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= (hoveredRating || rating)
                                ? 'fill-[var(--color-primary)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-tertiary)]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 rounded-xl">{submitError}</p>
                  )}

                  {/* Feedback Section */}
                  <div className="space-y-3">
                    <label className="block text-lg font-bold text-[var(--color-text-primary)]">
                      Share Your Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us about your experience with this session..."
                      rows={4}
                      className="w-full p-4 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-[var(--color-success-bg)] text-[var(--color-success-dark)] rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Thank You!</h3>
                  <p className="text-[var(--color-text-secondary)]">Your feedback has been submitted successfully.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="p-6 border-t border-[var(--color-border-primary)] flex items-center gap-4">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              loading={submitting}
              onClick={handleSubmitFeedback}
              disabled={rating === 0}
            >
              <Send className="w-4 h-4" />
              {notes?.employeeFeedback ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

