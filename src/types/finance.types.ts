export type TransactionDirection = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'WALLET' | 'CASH';

export type FinanceCategory =
  | 'Food' | 'Travel' | 'Shopping' | 'Bills' | 'Entertainment'
  | 'Healthcare' | 'Investments' | 'Salary' | 'EMI' | 'Subscription'
  | 'Recharge' | 'Utilities' | 'Fuel' | 'Groceries' | 'Transfers'
  | 'Education' | 'Wellness' | 'Uncategorized';

/**
 * Canonical transaction shape — matches the server's `serializeTransaction`
 * output, used by both `GET /transactions` and the SSE stream. Prisma `Decimal`
 * columns arrive as `number`; every date as an ISO string.
 */
export interface Transaction {
  id: string;
  userId: string;
  companyId: string;
  accountId?: string | null;
  amount: number;
  type: TransactionDirection;
  category: string;
  subCategory?: string | null;
  origin: 'MANUAL' | 'SMS' | 'BANK' | 'IMPORTED';
  mode?: PaymentMethod | null;
  description?: string | null;
  notes?: string | null;
  senderName?: string | null;
  receiverName?: string | null;
  bank?: string | null;
  maskedAccountNo?: string | null;
  transactionDate: string;
  isSalary: boolean;
  isEMI: boolean;
  isRecurring: boolean;
  isBookmarked: boolean;
  upiId?: string | null;
  referenceId?: string | null;
  availableBalance?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  account?: {
    type: string;
    provider: string | null;
    maskedAccountNo: string | null;
  } | null;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type TransactionStreamEventType =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'transaction.resync';

export interface TransactionStreamEvent {
  type: TransactionStreamEventType;
  transactionId: string | null;
  occurredAt: string;
  /** full row for created/updated, `{ id }` for deleted, `null` for resync */
  data: Transaction | { id: string } | null;
}

export interface TransactionChangesResponse {
  changes: TransactionStreamEvent[];
  hasMore: boolean;
  nextSince: string;
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

// Matches the backend `toDto()` in employee/goals/goals.service.ts.
export interface FinancialGoal {
  id: string;
  title: string;
  iconResId: string;       // we store the picked emoji here
  colorHex?: string | null;
  imageUri?: string | null;
  targetAmount: number;
  savedAmount: number;
  monthlySavings: number;
  durationMonths?: number | null;
  isAchieved: boolean;
  tagId?: string | null;
  creationDate: string;    // ISO
  goalDate: string;        // ISO
}

export interface CreateGoalPayload {
  title: string;
  iconResId: string;
  targetAmount: number;
  savedAmount?: number;
  goalDate: string;        // ISO 8601
}

export interface UpdateGoalPayload {
  title?: string;
  iconResId?: string;
  targetAmount?: number;
  savedAmount?: number;
  goalDate?: string;
}

// ─── Budgets ─────────────────────────────────────────────────────────────────
// Matches BACKEND `budgets` module (CreateBudgetDto + toBudgetResponse).
export type BudgetKind = 'RECURRING' | 'ONE_TIME';
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** Budget response — categories & sub-categories flattened; subs carry a
 *  non-null `parentCategoryId`. */
export interface BudgetCategoryRow {
  id: string;
  name: string;
  iconResId: string | null;
  colorHex: string;
  parentCategoryId: string | null;
  allottedAmount: number;
}

export interface Budget {
  id: string;
  title: string;
  amount: number;
  period: BudgetPeriod | null;
  startDate: string;   // ISO
  endDate: string | null;
  budgetType: BudgetKind;
  categories: BudgetCategoryRow[];
}

/** What we send when creating/updating a budget. */
export interface BudgetSubCategoryInput {
  name: string;
  allottedAmount: number;
}
export interface BudgetCategoryInput {
  name: string;
  allottedAmount: number;
  colorHex?: string;
  iconResId?: string;
  subCategories?: BudgetSubCategoryInput[];
}
export interface CreateBudgetPayload {
  title: string;
  amount: number;
  budgetType: BudgetKind;
  period?: BudgetPeriod;
  startDate: string;   // ISO 8601
  endDate?: string;
  categories?: BudgetCategoryInput[];
}
export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export interface BudgetProgressSub {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  overBudget: boolean;
}
export interface BudgetProgressCategory {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageSpent: number;
  overBudget: boolean;
  color: string | null;
  icon: string | null;
  subCategories: BudgetProgressSub[];
}
export interface BudgetProgress {
  budgetId: string;
  name: string;
  type: BudgetKind;
  frequency: BudgetPeriod | null;
  periodStart: string;
  periodEnd: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageSpent: number;
  overBudget: boolean;
  categories: BudgetProgressCategory[];
}
