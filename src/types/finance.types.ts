export type TransactionDirection = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET' | 'CASH';

export type FinanceCategory =
  | 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Entertainment'
  | 'Healthcare' | 'Investments' | 'Salary' | 'EMI' | 'Subscription'
  | 'Recharge' | 'Utilities' | 'Fuel' | 'Groceries' | 'Transfers'
  | 'Education' | 'Wellness' | 'Uncategorized';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionDirection;
  category: FinanceCategory;
  subCategory?: string;
  source: 'MANUAL' | 'MOBILE' | 'BANK';
  description?: string;
  merchant?: string;
  bank?: string;
  maskedAccountNo?: string;
  transactionDate: string;
  isSalary: boolean;
  isEMI: boolean;
  isRecurring: boolean;
  paymentMethod?: PaymentMethod;
  upiId?: string;
  referenceId?: string;
  availableBalance?: number;
  createdAt: string;
  deletedAt?: string;
}

export interface WellnessOverview {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  savingsRate: number;
  subscriptionSpend: number;
  emiSpend: number;
  emiRatio: number;
  expenseChange: number;
  burnRatePercent: number;
  wellnessScore: number;
  activeSubscriptions: number;
  transactionCount: number;
}

export interface FinancialScore {
  id?: string;
  score: number;
  savingsScore: number;
  emiScore: number;
  volatilityScore: number;
  balanceScore: number;
  subscriptionScore: number;
  recommendations: string[];
  scoreDate?: string;
}

export type InsightType =
  | 'SPENDING_ALERT' | 'SAVING_OPPORTUNITY' | 'BUDGET_EXCEEDED'
  | 'SALARY_RECEIVED' | 'SUBSCRIPTION_DETECTED' | 'FINANCIAL_SCORE_CHANGE'
  | 'EMI_REMINDER' | 'UNUSUAL_ACTIVITY' | 'MONTHLY_SUMMARY' | 'RECURRING_DETECTED';

export type InsightSeverity = 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  severity: InsightSeverity;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DetectedSubscription {
  id: string;
  merchantName: string;
  normalizedName: string;
  amount: number;
  frequency: string;
  lastDetectedAt: string;
  nextExpectedAt?: string;
  isActive: boolean;
  category: string;
  transactionCount: number;
}

export interface FinancialConsent {
  smsSync: boolean;
  analytics: boolean;
  hrVisible: boolean;
  coachVisible: boolean;
  consentedAt?: string;
  revokedAt?: string;
  hasConsented: boolean;
}

export interface CategoryBreakdown {
  name: FinanceCategory | string;
  amount: number;
  percentage: number;
}

export interface AnalyticsOverview {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
  topCategories: CategoryBreakdown[];
  weeklyBreakdown: { week: string; income: number; expense: number }[];
}

export interface MonthlyTrend {
  period: string;
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
}

export interface SmsSyncResult {
  processed: number;
  skipped: number;
  failed: number;
  transactions: number;
}

export interface SyncStatus {
  total: number;
  processed: number;
  failed: number;
  pending: number;
}

export interface FinancialGoal {
  _id: string;
  goalName: string;
  icon: string;
  goalAmount: number;
  saving: number;
  goalDate: string; // ISO date string
}

export interface CreateGoalPayload {
  goalName: string;
  icon: string;
  goalAmount: number;
  saving?: number;
  goalDate: string; // "YYYY-MM-DD"
}

export interface UpdateGoalPayload {
  goalName?: string;
  icon?: string;
  goalAmount?: number;
  saving?: number;
  goalDate?: string;
}
