import React from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#80b597'; // success
  if (score >= 60) return '#f5a038'; // warning
  if (score >= 40) return '#f5a038';
  return '#f55a51'; // error
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Needs Work';
  return 'Critical';
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
  animated = true,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const progress = (clampedScore / 100) * circumference;
  const color = getScoreColor(clampedScore);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border-primary)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          {animated ? (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          ) : (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
            />
          )}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-heading font-bold text-[var(--color-text-primary)]"
            style={{ fontSize: size * 0.22, color }}
            initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
            animate={animated ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {clampedScore}
          </motion.span>
          {showLabel && (
            <span
              className="text-[var(--color-text-secondary)] font-medium"
              style={{ fontSize: size * 0.09 }}
            >
              / 100
            </span>
          )}
        </div>
      </div>
      {showLabel && (
        <span
          className="text-sm font-bold"
          style={{ color }}
        >
          {getScoreLabel(clampedScore)}
        </span>
      )}
    </div>
  );
};
