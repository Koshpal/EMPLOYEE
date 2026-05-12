import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, trend }) => {
  return (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-primary)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold ${trend.isUp ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          {title}
        </h3>
        <div className="text-3xl font-bold text-[var(--color-text-primary)] font-heading">
          {value}
        </div>
        {description && (
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
