import { axiosInstance } from './api';
import type { Coach, Slot, Consultation, ConsultationStats } from '../types/booking.types';

export interface CoachAvailabilitySummary {
  nextSlot: { startTime: string; endTime: string } | null;
  days: string[]; // YYYY-MM-DD in IST
}

export const coachService = {
  getCoaches: async (): Promise<Coach[]> => {
    const response = await axiosInstance.get('/employee/coaches');
    return response.data;
  },

  getCoachSlots: async (coachId: string, date: string): Promise<Slot[]> => {
    const response = await axiosInstance.get(`/employee/coaches/${coachId}/slots`, {
      params: { date },
    });
    return response.data;
  },

  getAllCoachSlots: async (date: string) => {
    const response = await axiosInstance.get('/employee/coaches/slots', {
      params: { date },
    });
    return response.data;
  },

  getSlotAvailabilityRange: async (startDate: string, endDate: string, coachId?: string) => {
    const response = await axiosInstance.get('/employee/coaches/slots/range', {
      params: { startDate, endDate, coachId },
    });
    return response.data;
  },

  /**
   * Per-coach availability summary for the coach-list cards: next open slot +
   * the distinct days (IST, YYYY-MM-DD) with any open slot in the window.
   */
  getAvailabilitySummary: async (
    days = 7,
  ): Promise<Record<string, CoachAvailabilitySummary>> => {
    const response = await axiosInstance.get('/employee/coaches/availability-summary', {
      params: { days },
    });
    return response.data ?? {};
  },

  bookConsultation: async (coachId: string, slotStart: string, slotEnd: string, notes?: string) => {
    const response = await axiosInstance.post('/employee/consultations/book', {
      coachId,
      slotStart,
      slotEnd,
      notes
    });
    return response.data;
  },

  submitFeedback: async (consultationId: string, data: { rating: number; feedback: string }) => {
    const response = await axiosInstance.post(`/employee/consultations/${consultationId}/feedback`, data);
    return response.data;
  },

  getSessionDetails: async (consultationId: string) => {
    const response = await axiosInstance.get(`/employee/consultations/${consultationId}/details`);
    return response.data;
  },

  getMyConsultations: async (filter?: string, startDate?: string, endDate?: string): Promise<Consultation[]> => {
    const response = await axiosInstance.get('/employee/consultations', {
      params: { filter, startDate, endDate },
    });
    return response.data;
  },

  getMyConsultationStats: async (): Promise<ConsultationStats> => {
    const response = await axiosInstance.get('/employee/consultations/stats');
    return response.data;
  },

  getLatestConsultation: async (): Promise<Consultation | null> => {
    const response = await axiosInstance.get('/employee/consultations/latest');
    return response.data;
  },

  cancelConsultation: async (id: string) => {
    const response = await axiosInstance.post(`/employee/consultations/${id}/cancel`);
    return response.data;
  },
};
