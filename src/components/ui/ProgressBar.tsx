import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
  colorClass?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  colorClass = 'bg-indigo-600',
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label && <span>{label}</span>}
          {showPercent && <span className="tabular-nums">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div 
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress bar"}
        className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
      >
        <div
          className={cn("h-full transition-all duration-300 rounded-full", colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

