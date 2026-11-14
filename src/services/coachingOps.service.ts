import { axiosInstance as api } from './api';

export interface SharedResult { id: string; tool: string; inputs: any; outputs: any; status: 'SHARED' | 'CONFIRMED'; version: number; configRef: string | null; updatedAt: string; confirmedAt: string | null }
export interface WorksheetField { key: string; label: string; type: 'text' | 'number' | 'longtext'; required?: boolean }
export interface HomeworkItem {
  id: string; status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED'; dueDate: string | null; instructions: string | null;
  answers: Record<string, string | number>; submittedAt: string | null; reviewNote: string | null;
  template: { title: string; description: string | null; fields: WorksheetField[] };
}
const E = '/employee/coaching';
export const coachingOpsService = {
  workspace: (since?: string) => api.get<{ serverTime: string; items: SharedResult[] }>(`${E}/workspace`, { params: { since } }).then((r) => r.data),
  confirm: (id: string, version: number) => api.post(`${E}/workspace/${id}/confirm`, { version }).then((r) => r.data),
  homework: () => api.get<HomeworkItem[]>(`${E}/homework`).then((r) => r.data),
  saveDraft: (id: string, answers: Record<string, unknown>) => api.put(`${E}/homework/${id}/draft`, { answers }).then((r) => r.data),
  submit: (id: string, answers: Record<string, unknown>) => api.post(`${E}/homework/${id}/submit`, { answers }).then((r) => r.data),
  preferences: () => api.get<{ homeworkReminders: boolean; sessionReminders: boolean }>(`${E}/preferences`).then((r) => r.data),
  setPreferences: (p: { homeworkReminders?: boolean; sessionReminders?: boolean }) => api.put(`${E}/preferences`, p).then((r) => r.data),
};
export const apiMessage = (e: any) => {
  if (!e?.response) return 'Cannot reach the server. Please check your connection.';
  const m = e.response.data?.message;
  return (Array.isArray(m) ? m.join(', ') : m) ?? 'Something went wrong';
};
