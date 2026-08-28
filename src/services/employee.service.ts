import { axiosInstance } from './api';
import type { AuthResponse, UserProfile } from '../types/employee.types';

export type ActivationStepKey =
  | 'profile' | 'checkin' | 'consent' | 'goal' | 'session' | 'app';

export interface ActivationStatus {
  createdAt: string | null;
  dismissedAt: string | null;
  completedCount: number;
  total: number;
  isComplete: boolean;
  steps: { key: ActivationStepKey; done: boolean }[];
}

export const employeeService = {
  getActivation: async (): Promise<ActivationStatus> => {
    const response = await axiosInstance.get('/employee/activation');
    return response.data;
  },

  dismissActivation: async (): Promise<{ dismissedAt: string }> => {
    const response = await axiosInstance.patch('/employee/activation/dismiss');
    return response.data;
  },

  login: async (credentials: any): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      localStorage.removeItem('user');
    }
  },

  forgotPassword: async (email: string) => {
    const response = await axiosInstance.post('/auth/forgot-password', {
      email,
      portal: 'EMPLOYEE',
    });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await axiosInstance.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (tempToken: string, newPassword: string) => {
    const response = await axiosInstance.post(`/auth/reset-password/${tempToken}`, { newPassword });
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get('/employee/profile');
    return response.data;
  },

  updateProfile: async (data: FormData) => {
    // Clear the instance's default JSON content-type so axios derives
    // `multipart/form-data` + boundary from the FormData body.
    const response = await axiosInstance.put('/employee/profile', data, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.patch('/auth/me/password', { currentPassword, newPassword });
    return response.data;
  },
};
