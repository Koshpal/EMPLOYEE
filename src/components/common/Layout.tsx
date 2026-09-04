import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Overrides the header's right-hand action cluster. */
  headerActions?: React.ReactNode;
  /** Row rendered inside the header card, under the title (tabs / sub-nav). */
  headerBelow?: React.ReactNode;
  /** Hide the shared header entirely (screen renders its own). */
  hideHeader?: boolean;
}

/**
 * Figma shell — floating white panels on a #f6f6f6 canvas with 24px gutters.
 * Sidebar: fixed, 256px (88px collapsed). Content column is inset to clear it.
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  headerActions,
  headerBelow,
  hideHeader = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true',
  );

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
      />

      <div
        className={`flex min-h-screen flex-col gap-6 p-4 transition-[padding] duration-300 ease-in-out lg:py-6 lg:pr-6 ${
          isSidebarCollapsed ? 'lg:pl-[136px]' : 'lg:pl-[304px]'
        }`}
      >
        {!hideHeader && (
          <Header
            onMenuClick={() => setIsSidebarOpen(true)}
            title={title}
            actions={headerActions}
            below={headerBelow}
          />
        )}
        <main className="flex-1 animate-fade-in">{children}</main>
      </div>
    </div>
  );
};
