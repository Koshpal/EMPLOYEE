import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  IconChartPie,
  IconAddressBook,
  IconActivitySquare,
  IconAlarmClock,
  IconAnglesLeft,
  IconAngleUpSmall,
  IconSettings2,
  IconChatInfo,
} from '../icons/figma';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

type Item = {
  icon: React.FC<{ size?: number | string; className?: string }>;
  label: string;
  path: string;
  match: (p: string) => boolean;
  onClick?: () => void;
};

/**
 * Figma "Sidebar employee" — floating white panel, 256px open / 88px collapsed,
 * 42px items with a 36px bordered leading-icon tile, Outfit labels.
 * Nav mirrors the design (Overview / Book Coach / Finance / Insights / Sessions
 * + an "Actions" group). Calendar and the Finance sub-pages (Budgets, Goals,
 * Dues & Reminders, Spent by Category, Analytics, ...) stay routable but are
 * linked from inside their parent screens rather than the rail.
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [actionsOpen, setActionsOpen] = useState(true);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const main: Item[] = [
    { icon: IconChartPie, label: 'Overview', path: '/dashboard', match: (p) => p === '/dashboard' || p === '/' },
    { icon: IconAddressBook, label: 'Book Coach', path: '/coaches', match: (p) => p.startsWith('/coaches') },
    { icon: Wallet, label: 'Finance', path: '/finance/budgets', match: (p) => p.startsWith('/finance/') },
    { icon: IconActivitySquare, label: 'Insights', path: '/finance/insights', match: (p) => p === '/finance/insights' },
    { icon: IconAlarmClock, label: 'Sessions', path: '/sessions', match: (p) => p.startsWith('/sessions') },
  ];

  const actions: Item[] = [
    { icon: IconSettings2, label: 'Settings', path: '/profile', match: (p) => p === '/profile' },
    {
      icon: IconChatInfo,
      label: 'Help & Support',
      path: '',
      match: () => false,
      onClick: () => {
        window.location.href = 'mailto:koshpal@koshpal.com?subject=Koshpal%20portal%20support';
      },
    },
  ];

  const userName = user?.name || user?.email?.split('@')[0] || 'Employee';
  const initials = (() => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || 'E').toUpperCase();
  })();

  const NavRow = ({ item, small }: { item: Item; small?: boolean }) => {
    const active = item.match(location.pathname);
    return (
      <button
        type="button"
        title={isCollapsed ? item.label : undefined}
        onClick={() => (item.onClick ? item.onClick() : go(item.path))}
        className={`group flex h-[42px] w-full items-center gap-2 rounded-[16px] p-1 transition-colors ${
          isCollapsed ? 'justify-center' : ''
        } ${
          active
            ? 'bg-[var(--color-primary-lightest)]'
            : 'hover:bg-[var(--color-bg-tertiary)]'
        }`}
      >
        <span
          className={`flex aspect-square h-full shrink-0 items-center justify-center rounded-[12px] border transition-colors ${
            active
              ? 'border-transparent bg-[var(--color-primary)] text-white'
              : 'border-[var(--color-bg-tertiary)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
          }`}
        >
          <item.icon size={16} />
        </span>
        {!isCollapsed && (
          <span
            className={`min-w-0 flex-1 truncate text-left ${
              small ? 'text-body-sm' : 'text-body-md'
            } ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}
          >
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed z-50 flex flex-col bg-[var(--color-bg-card)] transition-all duration-300 ease-in-out
          left-0 top-0 h-full w-[264px] -translate-x-full
          lg:left-6 lg:top-6 lg:bottom-6 lg:h-auto lg:translate-x-0 lg:rounded-[16px] lg:shadow-[var(--shadow-soft)]
          ${isOpen ? 'translate-x-0' : ''}
          ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[256px]'}`}
      >
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="flex flex-col gap-6">
            {/* Logo & collapse */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Koshpal" className="h-7 w-7" />
                  <span className="font-heading text-[20px] font-bold tracking-tight text-[var(--color-text-primary)]">
                    Koshpal
                  </span>
                </div>
              )}
              {isCollapsed && <img src="/logo.png" alt="Koshpal" className="h-7 w-7" />}

              <button
                onClick={onClose}
                className="rounded-[8px] border border-[var(--color-border-primary)] p-2.5 text-[var(--color-text-secondary)] lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

              {onToggleCollapse && !isCollapsed && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden rounded-[8px] border border-[var(--color-border-primary)] p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] lg:block"
                  aria-label="Collapse sidebar"
                >
                  <IconAnglesLeft size={20} />
                </button>
              )}
            </div>

            {onToggleCollapse && isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="mx-auto hidden rotate-180 rounded-[8px] border border-[var(--color-border-primary)] p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] lg:block"
                aria-label="Expand sidebar"
              >
                <IconAnglesLeft size={20} />
              </button>
            )}

            <div className="flex flex-col gap-6">
              <nav className="flex flex-col gap-2">
                {main.map((item) => (
                  <NavRow key={item.label} item={item} />
                ))}
              </nav>

              <div className="flex flex-col gap-2">
                {!isCollapsed && (
                  <button
                    onClick={() => setActionsOpen((o) => !o)}
                    className="flex items-center justify-between pr-1 text-body-sm text-[var(--color-text-tertiary)]"
                  >
                    <span>Actions</span>
                    <IconAngleUpSmall size={24} className={actionsOpen ? '' : 'rotate-180'} />
                  </button>
                )}
                {(actionsOpen || isCollapsed) &&
                  actions.map((item) => <NavRow key={item.label} item={item} small />)}
              </div>
            </div>
          </div>

          {/* User */}
          <div className={`flex items-center gap-4 pt-6 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="relative h-10 w-10 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--color-primary)] text-sm font-bold text-white">
                {initials}
              </div>
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-bg-card)] bg-[var(--color-primary)]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-label text-[16px] font-medium leading-7 text-[var(--color-text-primary)] truncate">
                  {userName}
                </p>
                <p className="text-body-2xs text-[var(--color-text-tertiary)]">Employee</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
