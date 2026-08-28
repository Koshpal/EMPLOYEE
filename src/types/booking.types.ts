export interface Coach {
  id: string;
  email: string;
  fullName: string;
  expertise: string[];
  bio: string;
  rating: number;
  totalFeedback: number;
  successRate: number;
  clientsHelped: number;
  location: string;
  languages: string[];
  profilePhoto?: string;
}

export interface Slot {
  id: string;
  coachId: string;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  slotDate: string;  // YYYY-MM-DD in IST
  status: 'AVAILABLE' | 'BOOKED' | 'CANCELLED';
}

export interface Consultation {
  id: string;
  meetingLink: string;
  notes?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookedAt: string;
  hasFeedback?: boolean;
  slot: Slot;
  coach: Coach;
}

export interface ConsultationStats {
  total: number;
  past: number;
  upcoming: number;
  thisWeek: number;
  thisMonth: number;
  minutesBooked: number;
  confirmed: number;
  cancelled: number;
}
