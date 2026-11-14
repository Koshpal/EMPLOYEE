import { axiosInstance as api } from './api';

export interface ConsentText {
  id: string; version: number; title: string; body: string; isPlaceholder: boolean;
  disclosures: { key: string; text: string }[];
}
export interface ConsentState {
  active: boolean;
  currentText: ConsentText | null;
  activeConsent: { grantedAt: string; textVersion: number } | null;
  history: { id: string; status: 'GRANTED' | 'WITHDRAWN'; grantedAt: string; withdrawnAt: string | null; textVersion: number }[];
}

export const coachingConsentService = {
  get: () => api.get<ConsentState>('/employee/coaching/consent').then((r) => r.data),
  grant: (textVersionId: string, acceptedDisclosures: string[]) =>
    api.post('/employee/coaching/consent/grant', { scope: 'COACHING_PROGRAM', textVersionId, acceptedDisclosures }).then((r) => r.data),
  withdraw: (reason?: string) =>
    api.post('/employee/coaching/consent/withdraw', { scope: 'COACHING_PROGRAM', reason }).then((r) => r.data),
};
