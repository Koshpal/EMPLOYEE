/**
 * Wire types for the personal-category, budget-insight and spending-insight APIs.
 * Mirrors BACKEND `categories` and `finance/spending` modules. Money is a plain JS number rounded to
 * paise by the server — the client never sums money to create a new "total": every total on screen is
 * a field the server returned.
 */

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  templateId: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  templateId: string | null;
  subCategoryCount: number;
  transactionCount?: number;
  subCategories: SubCategory[];
  /** Present on create: true when an archived category of that name was brought back. */
  restored?: boolean;
}

export interface CategoryList {
  data: Category[];
  meta: { total: number; page: number; limit: number };
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}
export type UpdateCategoryPayload = Partial<Pick<CreateCategoryPayload, 'name' | 'icon' | 'color'>> & {
  isActive?: boolean;
  sortOrder?: number;
};

export interface RestoreDefaultsResult {
  categoriesCreated: number;
  categoriesReactivated: number;
  subCategoriesCreated: number;
  subCategoriesReactivated: number;
}

// ── ranges ───────────────────────────────────────────────────────────────────
export type RangeKey =
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_3_MONTHS'
  | 'LAST_6_MONTHS'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface RangeSelection {
  range: RangeKey;
  from?: string;
  to?: string;
}

export interface RangeInfo {
  key: RangeKey;
  label: string;
  from: string;
  to: string;
  start: string;
  end: string;
  elapsedDays: number;
  previous: { start: string; end: string };
}

export type BudgetStatus = 'ON_TRACK' | 'NEAR_LIMIT' | 'EXCEEDED';
export type BudgetLifecycle = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'ARCHIVED';

export interface BudgetAssociation {
  budgetId: string;
  budgetName: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilisationPct: number;
  status: BudgetStatus;
  periodStart?: string;
  periodEnd?: string;
}

export interface SubCategoryInsight {
  subCategoryId: string;
  subCategoryName: string;
  icon: string | null;
  isActive: boolean;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  percentageOfCategory: number;
  previousPeriodSpent: number;
  percentageChange: number | null;
}

export interface CategoryInsight {
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  percentageOfTotal: number;
  previousPeriodSpent: number;
  percentageChange: number | null;
  associatedBudgetInformation: BudgetAssociation[];
  subCategories: SubCategoryInsight[];
  withoutSubCategory: { totalSpent: number; transactionCount: number };
}

export interface UncategorisedFigure {
  totalSpent: number;
  transactionCount: number;
  percentageOfTotal: number;
  previousPeriodSpent: number;
}

export interface CategoriesInsight {
  range: RangeInfo;
  type: CategoryType;
  total: number;
  previousTotal: number;
  data: CategoryInsight[];
  uncategorised: UncategorisedFigure;
}

export interface OverviewInsight {
  range: RangeInfo;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRatePct: number | null;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  refundsReceived: number;
  budget: {
    activeBudgets: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    utilisationPct: number;
    nearLimitCount: number;
    exceededCount: number;
    note: string;
  };
  highestSpendingCategory: { id: string; name: string; icon: string | null; color: string | null; totalSpent: number; percentageOfTotal: number } | null;
  uncategorised: UncategorisedFigure;
  previousPeriod: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    incomeChangePct: number | null;
    expenseChangePct: number | null;
  };
}

export interface TrendPoint {
  bucketStart: string;
  label: string;
  total: number;
  transactionCount: number;
  average: number;
}
export type Granularity = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface TrendsInsight {
  granularity: Granularity;
  type: CategoryType;
  range: RangeInfo;
  series: TrendPoint[];
  total: number;
  averagePerBucket: number;
  categories?: Array<{ categoryId: string | null; categoryLocalId?: string | null; name: string; color: string | null; points: Array<{ bucketStart: string; total: number }> }>;
  buckets?: Array<{ bucketStart: string; label: string }>;
}

export interface RecentTxn {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string | null;
  transactionDate: string;
  category: string;
  subCategory: string | null;
}

export interface CategoryDetailInsight {
  range: RangeInfo;
  category: { id: string; name: string; type: CategoryType; icon: string | null; color: string | null; isActive: boolean };
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  highestTransaction: { id: string; amount: number; date: string; description: string | null } | null;
  dailyAverage: number;
  percentageOfTotal: number;
  previousPeriodSpent: number;
  percentageChange: number | null;
  monthlyTrend: TrendPoint[];
  subCategories: SubCategoryInsight[];
  withoutSubCategory: { totalSpent: number; transactionCount: number };
  budgets: BudgetAssociation[];
  recentTransactions: RecentTxn[];
}

// ── budgets ──────────────────────────────────────────────────────────────────
export interface BudgetLineInsight {
  lineId: string;
  name: string;
  color: string | null;
  icon: string | null;
  scopedToSubCategories: boolean;
  allocated: number;
  spent: number;
  remaining: number;
  utilisationPct: number;
  transactionCount: number;
  subCategories: Array<{
    lineId: string;
    name: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilisationPct: number;
    transactionCount: number;
  }>;
}

export interface BudgetInsightCard {
  id: string;
  name: string;
  type: 'RECURRING' | 'ONE_TIME';
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  isActive: boolean;
  lifecycle: BudgetLifecycle;
  budgetAmount: number;
  currentSpending: number;
  remainingAmount: number;
  overBy: number;
  utilisationPct: number;
  transactionCount: number;
  dailyAverage: number;
  projectedSpend: number | null;
  safeDailySpend: number | null;
  status: BudgetStatus;
  periodStart: string;
  periodEnd: string;
  daysElapsed: number;
  daysRemaining: number | null;
  lines: BudgetLineInsight[];
}

export interface BudgetsInsight {
  data: BudgetInsightCard[];
  summary: {
    activeBudgets: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    nearLimit: number;
    exceeded: number;
  };
}

export interface BudgetDetailInsight extends BudgetInsightCard {
  dailyTrend: Array<{ date: string; spent: number; transactionCount: number }>;
  weeklyTrend: Array<{ weekStart: string; spent: number; transactionCount: number }>;
  history: Array<{
    periodStart: string;
    periodEnd: string;
    allocated: number;
    spent: number;
    transactionCount: number;
    utilisationPct: number;
    status: BudgetStatus;
    isCurrent: boolean;
  }>;
}

export interface BudgetSummaryBlock {
  periodStart: string;
  periodEnd: string;
  lifecycle: BudgetLifecycle;
  allocated: number;
  spent: number;
  remaining: number;
  overBy: number;
  utilisationPct: number;
  status: BudgetStatus;
  transactionCount: number;
  dailyAverage: number;
  projectedSpend: number | null;
  daysElapsed: number;
  daysRemaining: number | null;
}

// ── AI ───────────────────────────────────────────────────────────────────────
export interface Observation {
  id: string;
  kind: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
  categoryId?: string;
  subCategoryId?: string;
  budgetId?: string;
  evidence: Record<string, number | string | null>;
}
export interface ObservationsResponse {
  range: RangeInfo;
  provider: string;
  generatedAt: string;
  observations: Observation[];
  disclaimer: string;
}
