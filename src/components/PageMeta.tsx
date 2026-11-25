import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

/**
 * Per-page metadata for the employee portal. The portal is a single-page app, so the browser tab, link
 * previews and search results would otherwise all show the one title from index.html. This sets the
 * <title>, description, canonical URL and Open Graph / Twitter tags for whichever route is on screen.
 * Add a row to PAGES when you add a route.
 */
const ORIGIN = 'https://employee.koshpal.com';
const PORTAL = 'Koshpal';

interface PageMetaEntry {
  /** react-router path pattern */
  path: string;
  title: string;
  description: string;
}

const DEFAULT_ENTRY: PageMetaEntry = {
  path: '/',
  title: 'Employee Portal',
  description: 'Your Koshpal money space: track spending, set budgets and goals, and book sessions with a certified financial coach.',
};

export const PAGES: PageMetaEntry[] = [
  { path: '/login', title: 'Log In', description: 'Sign in to Koshpal to see your money, goals and financial coaching sessions.' },
  { path: '/forgot-password', title: 'Forgot Password', description: 'Reset your Koshpal password. Enter your email and we will send you a reset link.' },
  { path: '/dashboard', title: 'Dashboard', description: 'Your money at a glance: spending, budgets, goals and your next coaching session.' },
  { path: '/coaches', title: 'Find a Coach', description: 'Browse certified financial coaches and book a one-to-one session.' },
  { path: '/coaches/:id', title: 'Coach Profile', description: 'A coach’s background, areas of expertise and available session times.' },
  { path: '/sessions', title: 'My Sessions', description: 'Your upcoming and past financial coaching sessions.' },
  { path: '/coaching', title: 'My Coaching', description: 'Your coaching programme: sessions, action plan, homework and progress.' },
  { path: '/calendar', title: 'Calendar', description: 'Your coaching sessions and money reminders on one calendar.' },
  { path: '/profile', title: 'Profile', description: 'Your personal details, preferences and security settings.' },
  { path: '/coaching-consent', title: 'Coaching Consent', description: 'Review and manage the consent you have given for financial coaching.' },
  { path: '/onboarding', title: 'Money Check-in', description: 'A short check-in about your money so Koshpal and your coach can personalise your plan.' },
  { path: '/finance', title: 'Finance Overview', description: 'Your income, spending, savings and financial health in one place.' },
  { path: '/finance/transactions', title: 'Transactions', description: 'Every transaction, searchable and sortable, with categories you can change.' },
  { path: '/finance/analytics', title: 'Analytics', description: 'Charts and trends for your income, spending and savings over time.' },
  { path: '/finance/subscriptions', title: 'Subscriptions', description: 'Recurring payments and subscriptions detected from your spending.' },
  { path: '/finance/score', title: 'Wellness Score', description: 'Your financial wellness score and what moves it up.' },
  { path: '/finance/insights', title: 'Insights', description: 'Personalised insights on your spending, saving and upcoming bills.' },
  { path: '/finance/consent', title: 'Data Consent', description: 'Choose what financial data Koshpal can use. You stay in control and can change it any time.' },
  { path: '/finance/goals', title: 'Goals', description: 'Set savings goals and track how close you are to each one.' },
  { path: '/finance/budgets', title: 'Budgets', description: 'Create monthly budgets by category and see how much is left.' },
  { path: '/finance/dues-reminders', title: 'Dues and Reminders', description: 'Never miss a bill: track due dates and set payment reminders.' },
  { path: '/finance/spent-by-category', title: 'Spent by Category', description: 'See where your money went this month, broken down by category.' },
  { path: '/finance/categories', title: 'Categories', description: 'Manage the spending categories used to organise your transactions.' },
  { path: '/finance/categories/:id', title: 'Category Details', description: 'Transactions and trends for one spending category.' },
  { path: '/finance/spending', title: 'Spending Insights', description: 'Patterns in your spending and ideas to spend less on what matters least.' },
];

/** Set (or create) a <meta> in <head>. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function resolvePageMeta(pathname: string): { entry: PageMetaEntry; canonical: string | null } {
  const entry = PAGES.find((p) => matchPath({ path: p.path, end: true }, pathname));
  if (!entry) return { entry: DEFAULT_ENTRY, canonical: null };
  // A canonical URL must not carry a record id or a reset token, so parameterised routes get none.
  return { entry, canonical: entry.path.includes(':') ? null : `${ORIGIN}${entry.path}` };
}

export default function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { entry, canonical } = resolvePageMeta(pathname);
    const title = entry === DEFAULT_ENTRY ? 'Koshpal Employee Portal' : `${entry.title} | ${PORTAL}`;
    document.title = title;
    setMeta('name', 'description', entry.description);
    setMeta('name', 'robots', 'index, follow');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', entry.description);
    setMeta('property', 'og:url', canonical ?? ORIGIN);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', entry.description);
    setCanonical(canonical);
  }, [pathname]);
  return null;
}
