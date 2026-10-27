import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSettings2 } from '../icons/figma';

/** Header icon button that opens Profile & Settings. */
export const HeaderSettingsButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      aria-label="Settings"
      className="flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <IconSettings2 size={20} />
    </button>
  );
};
