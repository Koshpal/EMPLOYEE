import { axiosInstance } from './api';

export interface Reminder {
  id: string;
  text: string;
  dueDate: string | null;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  text: string;
  dueDate?: string;
}

export interface UpdateReminderPayload {
  text?: string;
  isDone?: boolean;
  dueDate?: string;
}

const BASE = '/employee/reminders';

export const getReminders = async (): Promise<Reminder[]> => {
  const res = await axiosInstance.get(BASE);
  return Array.isArray(res.data) ? res.data : [];
};

export const createReminder = async (
  payload: CreateReminderPayload,
): Promise<Reminder> => {
  const res = await axiosInstance.post(BASE, payload);
  return res.data;
};

export const updateReminder = async (
  id: string,
  payload: UpdateReminderPayload,
): Promise<Reminder> => {
  const res = await axiosInstance.patch(`${BASE}/${id}`, payload);
  return res.data;
};

export const deleteReminder = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${id}`);
};
