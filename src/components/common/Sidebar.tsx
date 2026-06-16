import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  X,
  ChevronLeft,
  BookOpen,
  TrendingUp,
  Target,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Coaches', path: '/coaches' },
  { icon: BookOpen, label: 'Sessions', path: '/sessions' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: TrendingUp, label: 'Finance', path: '/finance' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/finance'
      ? location.pathname.startsWith('/finance')
      : location.pathname === path;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-500 ease-in-out bg-[var(--color-bg-card)] border-r border-[var(--color-border-primary)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} lg:translate-x-0 w-72`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 border-b border-[var(--color-border-primary)] h-[89px]">
            {!isCollapsed && (
              <div className="flex items-center gap-3 transition-opacity duration-500">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/logo.png" alt="Koshpal" className="w-8 h-8" />
                </div>
                <span className="text-xl font-bold text-(--color-text-primary) font-heading tracking-tight">
                  Koshpal <span className="text-(--color-primary)">Employee</span>
                </span>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 flex items-center justify-center mx-auto">
                <img src="/logo.png" alt="Koshpal" className="w-8 h-8" />
              </div>
            )}

            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:opacity-80 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-lg hover:opacity-80 transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                aria-label="Toggle sidebar"
              >
                <ChevronLeft
                  className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isFinance = item.path === '/finance';
                const financeActive = location.pathname.startsWith('/finance');

                return (
                  <React.Fragment key={item.path}>
                    <li>
                      <button
                        onClick={() => {
                          navigate(item.path);
                          onClose();
                        }}
                        className={`group w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold transition-all duration-200 relative ${
                          isCollapsed ? 'justify-center' : ''
                        } ${
                          active
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_10px_rgba(51,78,172,0.5)]" />
                        )}
                        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {!isCollapsed && (
                          <span className={`flex-1 text-left text-body-md transition-all duration-200 ${active ? 'font-bold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        )}
                      </button>
                    </li>
                    {isFinance && financeActive && !isCollapsed && (
                      <li>
                        <button
                          onClick={() => { navigate('/finance/goals'); onClose(); }}
                          className={`group w-full flex items-center gap-2 pl-14 pr-6 py-2.5 text-sm transition-all duration-200 relative ${
                            location.pathname === '/finance/goals'
                              ? 'text-[var(--color-primary)] font-semibold'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          <Target className="w-4 h-4 flex-shrink-0" />
                          <span>Goals</span>
                        </button>
                      </li>
                    )}
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};
