import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { IconPlus, IconBell, IconSettings2 } from '../icons/figma';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  /** Overrides the default right-hand cluster (Book session + bell + settings). */
  actions?: React.ReactNode;
  /** Row rendered inside the header card, under the title (tabs / sub-nav). */
  below?: React.ReactNode;
}

/**
 * Figma "Header" — white rounded-16 card, p-16. Title (Plus Jakarta Sans
 * SemiBold 24/44) on the left; on the right a primary "Book session" button and
 * two 40px outline icon-buttons. Theme toggle + account menu are kept from the
 * existing app (not in the Figma light-only design).
 */
export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, actions, below }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = user?.name || user?.email?.split('@')[0] || 'Employee';
  const userEmail = user?.email || '';

  const initials = (() => {
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || 'E').toUpperCase();
  })();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const iconBtn =
    'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

  return (
    <header className="flex flex-col gap-6 overflow-hidden rounded-[16px] bg-[var(--color-bg-card)] p-4 shadow-[var(--shadow-drop-low)]">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-[8px] border border-[var(--color-border-primary)] p-2.5 text-[var(--color-text-primary)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="flex-1 truncate font-heading text-[24px] font-semibold leading-[44px] text-[var(--color-text-primary)]">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <button
                onClick={() => navigate('/coaches')}
                className="flex h-12 items-center gap-1.5 rounded-[8px] bg-[var(--color-primary)] pl-3 pr-6 text-[16px] font-normal text-white shadow-[var(--shadow-drop-low)] transition-colors hover:bg-[var(--color-primary-darkest)]"
              >
                <IconPlus size={24} />
                Book session
              </button>
              <button className={iconBtn} aria-label="Notifications">
                <IconBell size={20} />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className={iconBtn}
                aria-label="Settings"
              >
                <IconSettings2 size={20} />
              </button>
            </>
          )}

          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white transition-transform hover:scale-105"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[12px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">{userName}</p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">{userEmail}</p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-secondary)]"
                  >
                    <SettingsIcon className="h-5 w-5 opacity-70" />
                    <span className="flex-1 text-left">Profile Settings</span>
                  </button>
                  <a
                    href="mailto:koshpal@koshpal.com?subject=Koshpal%20portal%20support"
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-secondary)]"
                  >
                    <ChevronRight className="h-5 w-5 opacity-70" />
                    <span className="flex-1 text-left">Help &amp; Support</span>
                  </a>
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--color-error)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    <LogOut className="h-5 w-5 opacity-70" />
                    <span className="flex-1 text-left font-medium">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {below}
    </header>
  );
};
