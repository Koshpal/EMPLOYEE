import { axiosInstance } from './api';
import { invalidateAfter } from '../hooks/useApi';
import type {
  WellnessOverview,
  FinancialScore,
  FinancialInsight,
  DetectedSubscription,
  FinancialConsent,
  AnalyticsOverview,
  MonthlyTrend,
  PaginatedTransactions,
  TransactionChangesResponse,
  SyncStatus,
  FinancialGoal,
  CreateGoalPayload,
  UpdateGoalPayload,
  Budget,
  BudgetProgress,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  Transaction,
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
// Most transactions originate on the mobile app (offline-first SMS import) and arrive over SSE
// (see services/transactionStream.ts). The web can also record a manual transaction and re-categorise
// any transaction — see createTransaction / updateTransaction / categorizeTransactions below.

export interface TransactionFilters {
  type?: string;
  /** Category / sub-category NAMES. */
  category?: string;
  subCategory?: string;
  budgetId?: string;
  uncategorized?: boolean;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getTransactions = async (params?: TransactionFilters): Promise<PaginatedTransactions> => {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null || v === '' || k === 'page' || k === 'limit') continue;
    query.set(k, String(v));
  }
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 50));
  const res = await axiosInstance.get(`/transactions?${query}`);
  return res.data as PaginatedTransactions;
};

/** Fields the transaction form can send. Category / sub-category / budget are all optional. */
export interface TransactionWritePayload {
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  transactionDate?: string;
  description?: string | null;
  notes?: string | null;
  receiverName?: string | null;
  senderName?: string | null;
  mode?: string | null;
  /** Category / sub-category NAMES (null / omitted = uncategorised). */
  category?: string | null;
  subCategory?: string | null;
  budgetId?: string | null;
  budgetCategoryId?: string | null;
  budgetSubCategoryId?: string | null;
}

export const createTransaction = async (
  payload: TransactionWritePayload & { amount: number; type: 'INCOME' | 'EXPENSE'; transactionDate: string },
): Promise<Transaction> => {
  // A retry key makes a retry after a lost response idempotent on the server, which generates the id itself.
  const clientRequestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await axiosInstance.post('/transactions', { clientRequestId, origin: 'MANUAL', ...payload });
  invalidateAfter('transaction');
  return res.data as Transaction;
};

export type TransactionUpdateResult = Transaction & { warnings: string[] };

export const updateTransaction = async (id: string, payload: TransactionWritePayload): Promise<TransactionUpdateResult> => {
  const res = await axiosInstance.patch(`/transactions/${id}`, payload);
  invalidateAfter('transaction');
  return res.data as TransactionUpdateResult;
};

export const categorizeTransactions = async (payload: {
  transactionIds: string[];
  category: string;
  subCategory?: string | null;
  budgetId?: string | null;
}): Promise<{ updated: number; warnings: string[] }> => {
  const res = await axiosInstance.post('/transactions/categorize', payload);
  invalidateAfter('transaction');
  return res.data;
};

/**
 * Missed-event recovery. Called after every SSE (re)connect and on tab focus so
 * a dropped stream can never cause a silently missed change.
 */
export const getTransactionChanges = async (
  since: string,
  limit = 200,
): Promise<TransactionChangesResponse> => {
  const query = new URLSearchParams({ since, limit: String(limit) });
  const res = await axiosInstance.get(`/transactions/changes?${query}`);
  return res.data as TransactionChangesResponse;
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

// --- Budgets ---
export interface BudgetListFilters {
  isActive?: boolean;
  period?: BudgetPeriodFilter;
  category?: string;
  status?: 'ON_TRACK' | 'NEAR_LIMIT' | 'EXCEEDED';
  activeOn?: string;
  includeProgress?: boolean;
}
type BudgetPeriodFilter = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const getBudgets = async (filters: BudgetListFilters = {}): Promise<Budget[]> => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') q.set(k, String(v));
  const res = await axiosInstance.get(`/budgets?${q}`);
  return Array.isArray(res.data) ? res.data : res.data.data ?? [];
};

/** Transactions that count towards a budget (current period by default). */
export const getBudgetTransactions = async (
  id: string,
  params: { page?: number; limit?: number; from?: string; to?: string } = {},
): Promise<PaginatedTransactions & { periodStart: string; periodEnd: string }> => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const res = await axiosInstance.get(`/budgets/${id}/transactions?${q}`);
  return res.data;
};

export const getBudget = async (id: string): Promise<Budget> => {
  const res = await axiosInstance.get(`/budgets/${id}`);
  return res.data;
};

export const getBudgetProgress = async (id: string): Promise<BudgetProgress> => {
  const res = await axiosInstance.get(`/budgets/${id}/progress`);
  return res.data;
};

export const createBudget = async (payload: CreateBudgetPayload): Promise<Budget> => {
  const res = await axiosInstance.post('/budgets', payload);
  invalidateAfter('budget');
  return res.data;
};

export const updateBudget = async (id: string, payload: UpdateBudgetPayload & { isActive?: boolean }): Promise<Budget> => {
  const res = await axiosInstance.patch(`/budgets/${id}`, payload);
  invalidateAfter('budget');
  return res.data;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/budgets/${id}`);
  invalidateAfter('budget');
};

// --- SMS Sync ---
export const getSyncStatus = async (): Promise<SyncStatus> => {
  const res = await axiosInstance.get(`${BASE}/sms/status`);
  return res.data;
};

export const deleteAllSyncedData = async (): Promise<void> => {
  await axiosInstance.delete(`${BASE}/sms/data`);
};
