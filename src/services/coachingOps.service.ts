import { axiosInstance as api } from './api';

export interface SharedResult { id: string; tool: string; inputs: unknown; outputs: unknown; status: 'SHARED' | 'CONFIRMED'; version: number; configRef: string | null; updatedAt: string; confirmedAt: string | null }
export interface WorksheetField { key: string; label: string; type: 'text' | 'number' | 'longtext'; required?: boolean }
export interface HomeworkItem {
  id: string; status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED'; dueDate: string | null; instructions: string | null;
  answers: Record<string, string | number>; submittedAt: string | null; reviewNote: string | null;
  template: { title: string; description: string | null; fields: WorksheetField[] };
}
export interface CoachingOverview {
  enrolled: boolean; consentActive: boolean;
  coach: { id: string; name: string; photo: string | null; since: string } | null;
  program: { name: string; status: string; totalSessions: number; sessionsCompleted: number; nextSessionNumber: number | null } | null;
  lastSession: { sessionNumber: number; completedAt: string | null } | null;
  nextBooking: { id: string; slotStart: string; slotEnd: string; meetingLink: string | null } | null;
  needsToBook: boolean;
  todo: { openActionItems: number; overdueActionItems: number; homework: number; resultsToConfirm: number };
}
export interface ActionItemRow {
  id: string; kind: 'ACTION' | 'HOMEWORK'; title: string; description: string | null; ownerType: 'EMPLOYEE' | 'COACH';
  status: 'OPEN' | 'COMPLETED' | 'NOT_COMPLETED' | 'CANCELLED'; dueDate: string | null; completedAt: string | null;
  sessionNumber: number; overdue: boolean; canUpdate: boolean;
}
const E = '/employee/coaching';
export const coachingOpsService = {
  overview: () => api.get<CoachingOverview>(`${E}/overview`).then((r) => r.data),
  actionItems: () => api.get<ActionItemRow[]>(`${E}/action-items`).then((r) => r.data),
  setActionItemDone: (id: string, done: boolean) => api.put(`${E}/action-items/${id}`, { done }).then((r) => r.data),
  workspace: (since?: string) => api.get<{ serverTime: string; items: SharedResult[] }>(`${E}/workspace`, { params: { since } }).then((r) => r.data),
  confirm: (id: string, version: number) => api.post(`${E}/workspace/${id}/confirm`, { version }).then((r) => r.data),
  homework: () => api.get<HomeworkItem[]>(`${E}/homework`).then((r) => r.data),
  saveDraft: (id: string, answers: Record<string, unknown>) => api.put(`${E}/homework/${id}/draft`, { answers }).then((r) => r.data),
  submit: (id: string, answers: Record<string, unknown>) => api.post(`${E}/homework/${id}/submit`, { answers }).then((r) => r.data),
  preferences: () => api.get<{ homeworkReminders: boolean; sessionReminders: boolean }>(`${E}/preferences`).then((r) => r.data),
  setPreferences: (p: { homeworkReminders?: boolean; sessionReminders?: boolean }) => api.put(`${E}/preferences`, p).then((r) => r.data),
};
type ApiErrorLike = { response?: { status?: number; data?: { message?: string | string[] } } };
export const apiMessage = (e: unknown) => {
  const err = e as ApiErrorLike | null | undefined;
  if (!err?.response) return 'Cannot reach the server. Please check your connection.';
  const m = err.response.data?.message;
  return (Array.isArray(m) ? m.join(', ') : m) ?? 'Something went wrong';
};
