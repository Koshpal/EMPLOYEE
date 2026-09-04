import { useNavigate } from 'react-router-dom';

export type FinanceTab = 'Budget' | 'Goals' | 'Dues & Reminders' | 'Spent by Category';

const TAB_ROUTES: Record<FinanceTab, string> = {
  Budget: '/finance/budgets',
  Goals: '/finance/goals',
  'Dues & Reminders': '/finance/dues-reminders',
  'Spent by Category': '/finance/spent-by-category',
};

const TAB_ORDER: FinanceTab[] = ['Budget', 'Goals', 'Dues & Reminders', 'Spent by Category'];

/**
 * Figma "Finance tools header" tab row — shared across the Budget / Goals /
 * Dues & Reminders / Spent by Category pages so the tab bar (and its
 * active-state styling) stays identical and cross-navigation stays correct
 * in one place instead of being re-implemented per page.
 */
export function FinanceTabs({ active }: { active: FinanceTab }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4 overflow-x-auto">
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          onClick={() => tab !== active && navigate(TAB_ROUTES[tab])}
          className={`flex min-w-[88px] shrink-0 items-center justify-center gap-2 px-1 py-2 text-[16px] leading-7 transition-colors ${
            tab === active
              ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'text-[var(--color-black-mid)] hover:text-[var(--color-primary)]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
