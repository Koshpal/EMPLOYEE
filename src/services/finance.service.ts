import { axiosInstance } from './api';
import type {
  WellnessOverview,
  FinancialScore,
  FinancialInsight,
  DetectedSubscription,
  FinancialConsent,
  AnalyticsOverview,
  MonthlyTrend,
  Transaction,
  SyncStatus,
  FinancialGoal,
  CreateGoalPayload,
  UpdateGoalPayload,
} from '../types/finance.types';

const BASE = '/finance';

// --- Wellness ---
export const getWellnessOverview = async (): Promise<WellnessOverview> => {
  const res = await axiosInstance.get(`${BASE}/wellness/overview`);
  return res.data;
};

export const getLatestScore = async (): Promise<FinancialScore> => {
  const res = await axiosInstance.get(`${BASE}/wellness/score`);
  return res.data;
};

export const getScoreHistory = async (months = 6): Promise<FinancialScore[]> => {
  const res = await axiosInstance.get(`${BASE}/wellness/score/history?months=${months}`);
  return res.data;
};

export const calculateScore = async (): Promise<FinancialScore> => {
  const res = await axiosInstance.post(`${BASE}/wellness/score/calculate`);
  return res.data;
};

// --- Insights ---
export const getSmartInsights = async (limit = 20): Promise<FinancialInsight[]> => {
  const res = await axiosInstance.get(`/insights/smart?limit=${limit}`);
  return res.data;
};

export const generateInsights = async (): Promise<void> => {
  await axiosInstance.post('/insights/smart/generate');
};

export const markInsightRead = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/insights/smart/${id}/read`);
};

export const markAllInsightsRead = async (): Promise<void> => {
  await axiosInstance.patch('/insights/smart/read-all');
};

export const getUnreadInsightCount = async (): Promise<number> => {
  const res = await axiosInstance.get('/insights/smart/unread-count');
  return res.data.count;
};

// --- Analytics ---
export const getAnalyticsOverview = async (year?: number, month?: number): Promise<AnalyticsOverview> => {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const res = await axiosInstance.get(`/insights/analytics?${params}`);
  return res.data;
};

export const getSpendingTrends = async (months = 6): Promise<{ trends: MonthlyTrend[] }> => {
  const res = await axiosInstance.get(`/insights/trends?months=${months}`);
  return res.data;
};

export const getCategoryBreakdown = async (year?: number, month?: number) => {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const res = await axiosInstance.get(`/insights/category-breakdown?${params}`);
  return res.data;
};

export const getMonthlySummaries = async (year?: number) => {
  const params = year ? `?year=${year}` : '';
  const res = await axiosInstance.get(`/insights/monthly${params}`);
  return res.data;
};

// --- Subscriptions ---
export const getSubscriptions = async (): Promise<DetectedSubscription[]> => {
  const res = await axiosInstance.get('/insights/subscriptions');
  return res.data;
};

// --- Transactions ---
export interface CreateTransactionPayload {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  source: 'MANUAL' | 'MOBILE' | 'BANK';
  transactionDate: string;
  accountId?: string;
  subCategory?: string;
  description?: string;
  merchant?: string;
  bank?: string;
  paymentMethod?: string;
}

export const createTransaction = async (dto: CreateTransactionPayload): Promise<void> => {
  await axiosInstance.post('/transactions', dto);
};

export const getTransactions = async (params?: {
  type?: string;
  category?: string;
  limit?: number;
  skip?: number;
}): Promise<Transaction[]> => {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.category) query.set('category', params.category);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.skip) query.set('skip', String(params.skip));
  const res = await axiosInstance.get(`/transactions?${query}`);
  return res.data;
};

// --- Consent ---
export const getConsent = async (): Promise<FinancialConsent> => {
  const res = await axiosInstance.get(`${BASE}/consent`);
  return res.data;
};

export const updateConsent = async (dto: Partial<FinancialConsent>): Promise<FinancialConsent> => {
  const res = await axiosInstance.put(`${BASE}/consent`, dto);
  return res.data;
};

export const revokeConsent = async (): Promise<void> => {
  await axiosInstance.delete(`${BASE}/consent/revoke`);
};

// --- Financial Goals ---
export const getGoals = async (): Promise<FinancialGoal[]> => {
  const res = await axiosInstance.get('/employee/goals');
  return res.data.financialGoals ?? [];
};

export const createGoal = async (payload: CreateGoalPayload): Promise<FinancialGoal> => {
  const res = await axiosInstance.post('/employee/goals', payload);
  return res.data;
};

export const updateGoal = async (goalId: string, payload: UpdateGoalPayload): Promise<FinancialGoal> => {
  const res = await axiosInstance.put(`/employee/goals/${goalId}`, payload);
  return res.data;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  await axiosInstance.delete(`/employee/goals/${goalId}`);
};

// --- SMS Sync ---
export const getSyncStatus = async (): Promise<SyncStatus> => {
  const res = await axiosInstance.get(`${BASE}/sms/status`);
  return res.data;
};

export const deleteAllSyncedData = async (): Promise<void> => {
  await axiosInstance.delete(`${BASE}/sms/data`);
};
