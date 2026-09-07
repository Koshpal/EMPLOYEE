/* ===========================================================================
   Dev-only mock API layer
   ---------------------------------------------------------------------------
   The employee portal is entirely backend-driven. When no backend is reachable
   (local `:3000` down, prod requires an httpOnly auth cookie) every data screen
   renders as an empty skeleton, which makes it impossible to check the UI
   against the Figma designs.

   This module installs a custom axios adapter that answers the app's REST calls
   with fixtures shaped to mirror the Figma "Financial Dashboard — Employee"
   file. It is imported from `main.tsx` and only activates when:
     • `import.meta.env.DEV` is true, AND
     • localStorage `koshpal_mock` !== 'off'
   Toggle it off at runtime with `localStorage.koshpal_mock = 'off'` + reload.
=========================================================================== */
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '../services/api';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const iso = (d: Date) => d.toISOString();
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const at = (h: number, m = 0, dayOffset = 0) => {
  const d = daysFromNow(dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
};

const COACH = {
  id: 'coach-1',
  email: 'parth.jain@koshpal.com',
  fullName: 'Parth Jain',
  expertise: ['Investment Planning', 'Retirement'],
  bio: 'CFA charterholder with 12 years helping salaried professionals build durable savings habits, plan retirement corpus and pick the right index funds.',
  rating: 4.6,
  totalFeedback: 214,
  successRate: 92,
  clientsHelped: 480,
  location: 'Mumbai, IN',
  languages: ['English', 'Hindi'],
  profilePhoto: 'https://i.pravatar.cc/160?img=12',
};

const coaches = Array.from({ length: 6 }).map((_, i) => ({
  ...COACH,
  id: `coach-${i + 1}`,
  rating: 4.6,
}));

const SLOT = (coachId: string, dayOffset: number, h: number) => ({
  id: `slot-${coachId}-${dayOffset}-${h}`,
  coachId,
  startTime: iso(at(h, 0, dayOffset)),
  endTime: iso(at(h + 1, 0, dayOffset)),
  slotDate: iso(at(h, 0, dayOffset)).slice(0, 10),
  status: 'AVAILABLE' as const,
});

const slotsFor = (coachId: string) =>
  [1, 1, 1, 3, 3, 5].map((d, idx) => SLOT(coachId, d, 10 + (idx % 3)));

const upcomingConsultation = {
  id: 'cons-1',
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  notes: 'Portfolio review + SIP top-up plan',
  status: 'CONFIRMED' as const,
  bookedAt: iso(daysFromNow(-2)),
  hasFeedback: false,
  feedbackRating: null,
  slot: {
    id: 'slot-upcoming',
    coachId: 'coach-1',
    startTime: iso(at(10, 0, 3)),
    endTime: iso(at(13, 0, 3)),
    slotDate: iso(at(10, 0, 3)).slice(0, 10),
    status: 'BOOKED' as const,
  },
  coach: COACH,
};

const pastConsultation = (n: number, status: 'COMPLETED' | 'CANCELLED') => ({
  id: `cons-past-${n}`,
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  notes: '',
  status,
  bookedAt: iso(daysFromNow(-10 * n)),
  hasFeedback: status === 'COMPLETED' && n % 2 === 0,
  feedbackRating: status === 'COMPLETED' && n % 2 === 0 ? 5 : null,
  slot: {
    id: `slot-past-${n}`,
    coachId: 'coach-1',
    startTime: iso(at(11, 0, -7 * n)),
    endTime: iso(at(12, 0, -7 * n)),
    slotDate: iso(at(11, 0, -7 * n)).slice(0, 10),
    status: 'BOOKED' as const,
  },
  // Keep past sessions on coach-1 so the Coach Profile page has history to show.
  coach: COACH,
});

const upcomingExtra = [
  { dayOffset: 0, h: 15, coach: 'coach-2', name: 'Michael Lee', role: 'Retirement' },
  { dayOffset: 8, h: 9, coach: 'coach-3', name: 'Anita Sharma', role: 'Tax Planning' },
  { dayOffset: 11, h: 14, coach: 'coach-4', name: 'David Chen', role: 'Investment Planning' },
].map((s, i) => ({
  id: `cons-up-${i + 2}`,
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  notes: '',
  status: 'CONFIRMED' as const,
  bookedAt: iso(daysFromNow(-1)),
  hasFeedback: false,
  feedbackRating: null,
  slot: {
    id: `slot-up-${i + 2}`,
    coachId: s.coach,
    startTime: iso(at(s.h, 0, s.dayOffset)),
    endTime: iso(at(s.h + 3, 0, s.dayOffset)),
    slotDate: iso(at(s.h, 0, s.dayOffset)).slice(0, 10),
    status: 'BOOKED' as const,
  },
  coach: { ...COACH, id: s.coach, fullName: s.name, expertise: [s.role, 'Retirement'] },
}));

const consultations = [
  upcomingConsultation,
  ...upcomingExtra,
  pastConsultation(1, 'COMPLETED'),
  pastConsultation(2, 'COMPLETED'),
  pastConsultation(3, 'CANCELLED'),
];

/* Goal rows mirror the Figma "Financial Goals" table (Support 70 %, Marketing
   project 20 %, Corlax iOS app 40 %, Website builder 40 %, Development 70 %). */
const goalSpec: [string, string, number][] = [
  ['Support', '🎯', 70],
  ['Marketing project', '📈', 20],
  ['Corlax iOS app development', '📱', 40],
  ['Website builder development', '💻', 40],
  ['Development', '🚀', 70],
  ['Emergency fund', '💰', 100],
  ['New car', '🚗', 100],
  ['Goa vacation', '🏖️', 0],
];
const goals = goalSpec.map(([title, icon, pct], i) => {
  const targetAmount = [200000, 150000, 300000, 250000, 180000, 100000, 800000, 120000][i];
  return {
    id: `goal-${i + 1}`,
    title,
    iconResId: icon,
    colorHex: null,
    imageUri: null,
    targetAmount,
    savedAmount: Math.round((targetAmount * pct) / 100),
    monthlySavings: Math.round(targetAmount / 12),
    durationMonths: 12,
    isAchieved: pct >= 100,
    tagId: null,
    creationDate: iso(daysFromNow(-120)),
    goalDate: iso(daysFromNow(180 + i * 20)),
  };
});

/* Budgets — Figma "Budgeting": four "Parth's Monthly Budget" cards, ₹2,000. */
const budgetCategories = [
  { id: 'bc-1', name: 'Eating out', iconResId: 'restaurant', colorHex: '#2A52BE', parentCategoryId: null, allottedAmount: 2000 },
  { id: 'bc-2', name: 'Bills', iconResId: 'receipt', colorHex: '#C2185B', parentCategoryId: null, allottedAmount: 2000 },
  { id: 'bc-3', name: 'Entertainment', iconResId: 'confirmation', colorHex: '#00796B', parentCategoryId: null, allottedAmount: 1500 },
  { id: 'bc-4', name: 'Groceries', iconResId: 'shopping_cart', colorHex: '#D32F2F', parentCategoryId: null, allottedAmount: 1500 },
  { id: 'bc-5', name: 'Travel', iconResId: 'flight', colorHex: '#E65100', parentCategoryId: null, allottedAmount: 1000 },
  { id: 'bc-6', name: 'Shopping', iconResId: 'storefront', colorHex: '#00695C', parentCategoryId: null, allottedAmount: 1000 },
  { id: 'bc-7', name: 'Family', iconResId: 'favorite_border', colorHex: '#C2185B', parentCategoryId: null, allottedAmount: 500 },
  { id: 'bc-8', name: 'General', iconResId: 'grid_view', colorHex: '#455A64', parentCategoryId: null, allottedAmount: 500 },
  { id: 'bsc-1', name: 'Internet', iconResId: 'wifi', colorHex: '#C2185B', parentCategoryId: 'bc-2', allottedAmount: 800 },
  { id: 'bsc-2', name: 'Rent', iconResId: 'home', colorHex: '#C2185B', parentCategoryId: 'bc-2', allottedAmount: 700 },
  { id: 'bsc-3', name: 'Electricity', iconResId: 'bolt', colorHex: '#C2185B', parentCategoryId: 'bc-2', allottedAmount: 300 },
  { id: 'bsc-4', name: 'Others', iconResId: 'grid_view', colorHex: '#C2185B', parentCategoryId: 'bc-2', allottedAmount: 200 },
];

const budgets = Array.from({ length: 4 }).map((_, i) => ({
  id: `budget-${i + 1}`,
  title: "Parth's Monthly Budget",
  amount: 2000,
  period: 'MONTHLY' as const,
  startDate: iso(daysFromNow(-13)),
  endDate: iso(daysFromNow(17)),
  budgetType: 'RECURRING' as const,
  categories: budgetCategories,
}));

const budgetProgress = (id: string) => ({
  budgetId: id,
  name: "Parth's Monthly Budget",
  type: 'RECURRING' as const,
  frequency: 'MONTHLY' as const,
  periodStart: iso(daysFromNow(-13)),
  periodEnd: iso(daysFromNow(17)),
  totalBudget: 2000,
  totalSpent: 1000,
  remaining: 1000,
  percentageSpent: 50,
  overBudget: false,
  categories: budgetCategories
    .filter((c) => !c.parentCategoryId)
    .map((c, idx) => {
      const spent = Math.round(c.allottedAmount * [0.3, 0.3, 0.55, 0.2, 0.7, 0.1, 0.4, 0.5][idx]);
      return {
        id: c.id,
        category: c.name,
        allocated: c.allottedAmount,
        spent,
        remaining: c.allottedAmount - spent,
        percentageSpent: Math.round((spent / c.allottedAmount) * 100),
        overBudget: spent > c.allottedAmount,
        color: c.colorHex,
        icon: c.iconResId,
        subCategories: budgetCategories
          .filter((s) => s.parentCategoryId === c.id)
          .map((s) => {
            const ss = Math.round(s.allottedAmount * 0.5);
            return {
              id: s.id,
              name: s.name,
              allocated: s.allottedAmount,
              spent: ss,
              remaining: s.allottedAmount - ss,
              percentageSpent: 50,
              overBudget: false,
            };
          }),
      };
    }),
});

/* Analytics / trends */
/* Kept below each category's summed allocation (₹8k / ₹8k / ₹6k / ₹4k / ₹4k /
   ₹6k across the 4 budgets) so most categories read "within limit". */
const topCategories = [
  { name: 'Eating out', amount: 3600, percentage: 29 },
  { name: 'Bills', amount: 5000, percentage: 24 },
  { name: 'Groceries', amount: 4200, percentage: 18 },
  { name: 'Travel', amount: 2000, percentage: 13 },
  { name: 'Shopping', amount: 4600, percentage: 11 },
  { name: 'Entertainment', amount: 900, percentage: 5 },
];

const analyticsOverview = {
  income: 100000,
  expenses: 40000,
  savings: 20000,
  savingsRate: 20,
  transactionCount: 128,
  topCategories,
  weeklyBreakdown: ['W1', 'W2', 'W3', 'W4'].map((week, i) => ({
    week,
    income: 25000,
    expense: [9000, 12000, 8000, 11000][i],
  })),
};

const trendPeriods = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const trends = trendPeriods.map((period, i) => ({
  period,
  year: 2026,
  month: 9,
  totalIncome: [40, 62, 78, 55, 60, 82, 70][i] * 1000,
  totalExpense: [30, 48, 92, 44, 66, 108, 70][i] * 700,
  savings: 8000,
  savingsRate: 20,
}));

const wellnessOverview = {
  monthlyIncome: 100000,
  monthlyExpenses: 40000,
  savings: 20000,
  savingsRate: 20,
  subscriptionSpend: 4999,
  emiSpend: 12000,
  emiRatio: 12,
  expenseChange: 15,
  burnRatePercent: 62,
  wellnessScore: 72,
  activeSubscriptions: 6,
  transactionCount: 128,
};

const financialScore = {
  id: 'score-1',
  score: 72,
  savingsScore: 78,
  emiScore: 66,
  volatilityScore: 70,
  balanceScore: 74,
  subscriptionScore: 68,
  recommendations: [
    'Increase your monthly SIP by ₹2,000 to hit your retirement corpus target.',
    'Two subscriptions haven’t been used in 60 days — consider cancelling them.',
    'Keep your EMI-to-income ratio below 30 % for a healthier score.',
  ],
  scoreDate: iso(new Date()),
};

const insights = [
  { id: 'ins-1', type: 'SPENDING_ALERT', title: 'Eating out is up 22 %', message: 'You spent ₹12,400 on eating out this month, ₹2,200 more than last month.', severity: 'WARNING', isRead: false, createdAt: iso(daysFromNow(-1)) },
  { id: 'ins-2', type: 'SAVING_OPPORTUNITY', title: 'You could save ₹3,000/mo', message: 'Moving idle balance into a liquid fund would earn ~6 % more than your savings account.', severity: 'INFO', isRead: false, createdAt: iso(daysFromNow(-2)) },
  { id: 'ins-3', type: 'SALARY_RECEIVED', title: 'Salary credited', message: '₹1,00,000 credited from Koshpal Technologies on the 1st.', severity: 'SUCCESS', isRead: true, createdAt: iso(daysFromNow(-5)) },
  { id: 'ins-4', type: 'SUBSCRIPTION_DETECTED', title: 'New subscription detected', message: 'A recurring ₹649 charge from “Netflix” was detected.', severity: 'INFO', isRead: true, createdAt: iso(daysFromNow(-6)) },
  { id: 'ins-5', type: 'EMI_REMINDER', title: 'Car loan EMI due in 3 days', message: '₹9,800 will be auto-debited on the 15th.', severity: 'ALERT', isRead: false, createdAt: iso(daysFromNow(-3)) },
];

const subscriptions = [
  { id: 'sub-1', merchantName: 'Netflix', normalizedName: 'netflix', amount: 649, frequency: 'MONTHLY', lastDetectedAt: iso(daysFromNow(-4)), nextExpectedAt: iso(daysFromNow(26)), isActive: true, category: 'Entertainment', transactionCount: 8 },
  { id: 'sub-2', merchantName: 'Spotify', normalizedName: 'spotify', amount: 119, frequency: 'MONTHLY', lastDetectedAt: iso(daysFromNow(-8)), nextExpectedAt: iso(daysFromNow(22)), isActive: true, category: 'Entertainment', transactionCount: 11 },
  { id: 'sub-3', merchantName: 'Amazon Prime', normalizedName: 'amazon prime', amount: 1499, frequency: 'YEARLY', lastDetectedAt: iso(daysFromNow(-40)), nextExpectedAt: iso(daysFromNow(320)), isActive: true, category: 'Shopping', transactionCount: 2 },
  { id: 'sub-4', merchantName: 'Gym membership', normalizedName: 'gym', amount: 1200, frequency: 'MONTHLY', lastDetectedAt: iso(daysFromNow(-15)), nextExpectedAt: iso(daysFromNow(15)), isActive: true, category: 'Wellness', transactionCount: 6 },
  { id: 'sub-5', merchantName: 'iCloud storage', normalizedName: 'icloud', amount: 75, frequency: 'MONTHLY', lastDetectedAt: iso(daysFromNow(-70)), nextExpectedAt: iso(daysFromNow(-40)), isActive: false, category: 'Bills', transactionCount: 4 },
  { id: 'sub-6', merchantName: 'YouTube Premium', normalizedName: 'youtube premium', amount: 129, frequency: 'MONTHLY', lastDetectedAt: iso(daysFromNow(-6)), nextExpectedAt: iso(daysFromNow(24)), isActive: true, category: 'Entertainment', transactionCount: 9 },
];

const txnCat = ['Eating out', 'Bills', 'Groceries', 'Travel', 'Shopping', 'Salary', 'Entertainment'];
const transactions = Array.from({ length: 24 }).map((_, i) => {
  const isIncome = i % 7 === 5;
  return {
    id: `txn-${i + 1}`,
    userId: 'emp-1',
    companyId: 'c-1',
    accountId: 'acc-1',
    amount: isIncome ? 100000 : [420, 1299, 260, 850, 2400, 180, 640][i % 7],
    type: isIncome ? 'INCOME' : 'EXPENSE',
    category: isIncome ? 'Salary' : txnCat[i % 7],
    subCategory: null,
    origin: 'SMS',
    mode: ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'UPI', 'NET_BANKING'][i % 5],
    description: isIncome ? 'Salary — Koshpal Technologies' : `${txnCat[i % 7]} · ${['Swiggy', 'Electricity board', 'BigBasket', 'Uber', 'Myntra', '', 'BookMyShow'][i % 7]}`,
    notes: null,
    senderName: isIncome ? 'KOSHPAL TECHNOLOGIES' : 'AARAV SHARMA',
    receiverName: isIncome ? 'AARAV SHARMA' : ['SWIGGY', 'MSEB', 'BIGBASKET', 'UBER', 'MYNTRA', '', 'BOOKMYSHOW'][i % 7],
    bank: 'HDFC Bank',
    maskedAccountNo: 'XXXX3421',
    transactionDate: iso(daysFromNow(-i)),
    isSalary: isIncome,
    isEMI: false,
    isRecurring: false,
    isBookmarked: false,
    upiId: null,
    referenceId: `REF${100000 + i}`,
    availableBalance: 84000 - i * 500,
    createdAt: iso(daysFromNow(-i)),
    updatedAt: iso(daysFromNow(-i)),
    deletedAt: null,
    account: { type: 'SAVINGS', provider: 'HDFC Bank', maskedAccountNo: 'XXXX3421' },
  };
});

const reminderText = 'Review the design mockups and prepare quick notes before the client call';
// 10 reminders: 6 done, 3 overdue (past + not done), 2 due today, rest upcoming.
const reminderDayOffsets = [0, -3, 5, -1, 3, -2, 0, 7, 2, 4];
let reminders = Array.from({ length: 10 }).map((_, i) => ({
  id: `rem-${i + 1}`,
  text: reminderText,
  dueDate: iso(daysFromNow(reminderDayOffsets[i])),
  isDone: [1, 2, 4, 6, 8, 9].includes(i),
  createdAt: iso(daysFromNow(-5)),
  updatedAt: iso(daysFromNow(-1)),
}));

const consent = {
  smsSync: true,
  analytics: true,
  hrVisible: false,
  coachVisible: true,
  consentedAt: iso(daysFromNow(-30)),
  hasConsented: true,
};

const activation = {
  createdAt: iso(daysFromNow(-20)),
  dismissedAt: null,
  completedCount: 4,
  total: 6,
  isComplete: false,
  steps: [
    { key: 'profile', done: true },
    { key: 'checkin', done: true },
    { key: 'consent', done: true },
    { key: 'goal', done: true },
    { key: 'session', done: false },
    { key: 'app', done: false },
  ],
};

const profile = {
  id: 'emp-1',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@koshpal.com',
  phone: '+91 98765 43210',
  profilePicture: 'https://i.pravatar.cc/160?img=68',
  companyId: 'c-1',
  role: 'EMPLOYEE',
  department: 'Product Design',
  createdAt: iso(daysFromNow(-400)),
  updatedAt: iso(daysFromNow(-5)),
  bio: 'Senior product designer. Saving toward a house down-payment and a long Japan trip.',
  expertise: [],
};

const user = { id: 'emp-1', email: 'aarav.sharma@koshpal.com', name: 'Aarav Sharma', role: 'EMPLOYEE', companyId: 'c-1' };

const onboarding = {
  userId: 'emp-1',
  ageGroup: 'AGE_26_30',
  monthlySalaryRange: 'RANGE_75K_1L',
  improvementGoals: ['SAVE_MORE', 'SET_GOALS'],
  moneyChallenges: ['OVERSPENDING', 'LOW_SAVINGS'],
  moneyManagementStyles: ['CHECK_APPS'],
  helpNeeded: ['BUDGETING', 'GOALS'],
  isComplete: true,
  completedAt: iso(daysFromNow(-30)),
};

const availabilitySummary = Object.fromEntries(
  coaches.map((c) => [
    c.id,
    {
      nextSlot: { startTime: iso(at(10, 0, 1)), endTime: iso(at(11, 0, 1)) },
      days: [1, 3, 5].map((d) => iso(daysFromNow(d)).slice(0, 10)),
    },
  ]),
);

/* ── route table ─────────────────────────────────────────────────────────── */

type Handler = (m: RegExpMatchArray, cfg: InternalAxiosRequestConfig) => unknown;
interface Route {
  method: string;
  re: RegExp;
  handler: Handler;
}

const R = (method: string, path: string, handler: Handler): Route => ({
  method: method.toLowerCase(),
  re: new RegExp('^' + path + '$'),
  handler,
});

const routes: Route[] = [
  // auth
  R('post', '/auth/login', () => ({ message: 'ok', user })),
  R('post', '/auth/logout', () => ({})),
  R('post', '/auth/refresh', () => ({})),
  R('post', '/auth/forgot-password', () => ({ message: 'OTP sent' })),
  R('post', '/auth/verify-otp', () => ({ tempToken: 'mock-temp-token' })),
  R('post', '/auth/reset-password/[^/]+', () => ({ message: 'Password updated' })),
  R('get', '/auth/me', () => user),
  R('patch', '/auth/me/password', () => ({ message: 'Password updated' })),

  // employee
  R('get', '/employee/activation', () => activation),
  R('patch', '/employee/activation/dismiss', () => ({ dismissedAt: iso(new Date()) })),
  R('get', '/employee/profile', () => profile),
  R('put', '/employee/profile', () => profile),

  // coaches
  R('get', '/employee/coaches', () => coaches),
  R('get', '/employee/coaches/availability-summary', () => availabilitySummary),
  R('get', '/employee/coaches/slots/range', () => {
    const out: Record<string, number> = {};
    for (let d = 0; d < 14; d++) out[iso(daysFromNow(d)).slice(0, 10)] = d % 2 ? 4 : 2;
    return out;
  }),
  R('get', '/employee/coaches/slots', () => coaches.flatMap((c) => slotsFor(c.id))),
  R('get', '/employee/coaches/[^/]+/slots', (m) => slotsFor(m.input!.split('/')[3])),

  // consultations
  R('get', '/employee/consultations/latest', () => upcomingConsultation),
  R('get', '/employee/consultations/stats', () => ({
    total: 14, past: 9, upcoming: 1, thisWeek: 1, thisMonth: 3,
    minutesBooked: 720, confirmed: 12, cancelled: 2,
  })),
  R('get', '/employee/consultations/[^/]+/details', () => ({
    ...upcomingConsultation,
    agenda: ['Portfolio review', 'SIP top-up plan', 'Tax-saving options'],
  })),
  R('post', '/employee/consultations/book', () => upcomingConsultation),
  R('post', '/employee/consultations/[^/]+/feedback', () => ({ message: 'Thanks for the feedback' })),
  R('post', '/employee/consultations/[^/]+/cancel', () => ({ message: 'Cancelled' })),
  R('get', '/employee/consultations', (_m, cfg) => {
    const filter = (cfg.params?.filter as string) || '';
    if (filter === 'upcoming') return consultations.filter((c) => c.status === 'CONFIRMED');
    if (filter === 'past') return consultations.filter((c) => c.status !== 'CONFIRMED');
    return consultations;
  }),

  // goals
  R('get', '/employee/goals', () => ({ financialGoals: goals })),
  R('post', '/employee/goals', (_m, cfg) => {
    const body = JSON.parse((cfg.data as string) || '{}');
    return { ...goals[0], ...body, id: `goal-${Date.now()}`, savedAmount: body.savedAmount ?? 0 };
  }),
  R('put', '/employee/goals/[^/]+', (m, cfg) => {
    const id = m.input!.split('/')[3];
    const body = JSON.parse((cfg.data as string) || '{}');
    return { ...(goals.find((g) => g.id === id) ?? goals[0]), ...body, id };
  }),
  R('delete', '/employee/goals/[^/]+', () => ({})),

  // reminders
  R('get', '/employee/reminders', () => reminders),
  R('post', '/employee/reminders', (_m, cfg) => {
    const body = JSON.parse((cfg.data as string) || '{}');
    const created = {
      id: `rem-${Date.now()}`, text: body.text, dueDate: body.dueDate ?? null,
      isDone: false, createdAt: iso(new Date()), updatedAt: iso(new Date()),
    };
    reminders = [...reminders, created];
    return created;
  }),
  R('patch', '/employee/reminders/[^/]+', (m, cfg) => {
    const id = m.input!.split('/')[3];
    const body = JSON.parse((cfg.data as string) || '{}');
    reminders = reminders.map((r) => (r.id === id ? { ...r, ...body, updatedAt: iso(new Date()) } : r));
    return reminders.find((r) => r.id === id);
  }),
  R('delete', '/employee/reminders/[^/]+', (m) => {
    const id = m.input!.split('/')[3];
    reminders = reminders.filter((r) => r.id !== id);
    return {};
  }),

  // finance – wellness
  R('get', '/finance/wellness/overview', () => wellnessOverview),
  R('get', '/finance/wellness/score/history', () =>
    Array.from({ length: 6 }).map((_, i) => ({
      ...financialScore, score: 60 + i * 3, scoreDate: iso(daysFromNow(-30 * (5 - i))),
    })),
  ),
  R('get', '/finance/wellness/score', () => financialScore),
  R('post', '/finance/wellness/score/calculate', () => financialScore),

  // finance – consent / sms
  R('get', '/finance/consent', () => consent),
  R('put', '/finance/consent', (_m, cfg) => ({ ...consent, ...JSON.parse((cfg.data as string) || '{}') })),
  R('delete', '/finance/consent/revoke', () => ({})),
  R('get', '/finance/sms/status', () => ({ total: 320, processed: 312, failed: 2, pending: 6 })),
  R('delete', '/finance/sms/data', () => ({})),

  // insights
  R('get', '/insights/smart/unread-count', () => ({ count: insights.filter((i) => !i.isRead).length })),
  R('get', '/insights/smart', () => insights),
  R('post', '/insights/smart/generate', () => ({})),
  R('patch', '/insights/smart/read-all', () => ({})),
  R('patch', '/insights/smart/[^/]+/read', () => ({})),
  R('get', '/insights/analytics', () => analyticsOverview),
  R('get', '/insights/trends', () => ({ trends })),
  R('get', '/insights/category-breakdown', () => ({ categories: topCategories })),
  R('get', '/insights/monthly', () =>
    Array.from({ length: 6 }).map((_, i) => ({
      period: `2026-0${i + 3}`, year: 2026, month: i + 3,
      totalIncome: 100000, totalExpense: 38000 + i * 1500, savings: 20000, savingsRate: 20,
    })),
  ),
  R('get', '/insights/subscriptions', () => subscriptions),

  // transactions
  R('get', '/transactions/changes', () => ({ changes: [], hasMore: false, nextSince: iso(new Date()) })),
  R('get', '/transactions', (_m, cfg) => {
    const page = Number(cfg.params?.page ?? 1);
    const limit = Number(cfg.params?.limit ?? 50);
    let list = transactions;
    if (cfg.params?.type) list = list.filter((t) => t.type === cfg.params.type);
    if (cfg.params?.category) list = list.filter((t) => t.category === cfg.params.category);
    const start = (page - 1) * limit;
    return {
      transactions: list.slice(start, start + limit),
      page, limit, total: list.length, hasMore: start + limit < list.length,
    };
  }),

  // budgets
  R('get', '/budgets', () => budgets),
  R('get', '/budgets/[^/]+/progress', (m) => budgetProgress(m.input!.split('/')[2])),
  R('get', '/budgets/[^/]+', (m) => budgets.find((b) => b.id === m.input!.split('/')[2]) ?? budgets[0]),
  R('post', '/budgets', (_m, cfg) => ({ ...budgets[0], ...JSON.parse((cfg.data as string) || '{}'), id: `budget-${Date.now()}` })),
  R('patch', '/budgets/[^/]+', (m, cfg) => ({ ...budgets[0], ...JSON.parse((cfg.data as string) || '{}'), id: m.input!.split('/')[2] })),
  R('delete', '/budgets/[^/]+', () => ({})),

  // onboarding
  R('get', '/onboarding', () => onboarding),
  R('put', '/onboarding', (_m, cfg) => ({ ...onboarding, ...JSON.parse((cfg.data as string) || '{}') })),
];

/* ── adapter ─────────────────────────────────────────────────────────────── */

function pathOf(cfg: InternalAxiosRequestConfig): string {
  let url = cfg.url || '';
  url = url.replace(/^https?:\/\/[^/]+/, '');
  url = url.replace(/\/api\/v1/, '');
  url = url.split('?')[0];
  if (!url.startsWith('/')) url = '/' + url;
  return url;
}

const mockAdapter: AxiosAdapter = async (cfg) => {
  const method = (cfg.method || 'get').toLowerCase();
  const path = pathOf(cfg);

  const route = routes.find((r) => r.method === method && r.re.test(path));

  const base: AxiosResponse = {
    data: undefined,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: cfg,
    request: {},
  };

  // small latency so skeleton states are still exercised
  await new Promise((res) => setTimeout(res, 120));

  if (!route) {
    // eslint-disable-next-line no-console
    console.warn(`[devMock] no fixture for ${method.toUpperCase()} ${path} — returning {}`);
    return { ...base, data: {} };
  }

  const m = path.match(route.re)!;
  return { ...base, data: route.handler(m, cfg) };
};

export function installDevMock(): void {
  if (!import.meta.env.DEV) return;
  try {
    if (localStorage.getItem('koshpal_mock') === 'off') return;
  } catch {
    /* localStorage unavailable — still mock */
  }
  axiosInstance.defaults.adapter = mockAdapter;
  // eslint-disable-next-line no-console
  console.info('%c[devMock] active — REST calls are answered with Figma-shaped fixtures. localStorage.koshpal_mock="off" to disable.', 'color:#334eac');
}
