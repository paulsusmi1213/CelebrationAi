import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  isLocked?: boolean;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  isLocked = false,
  onChange,
  className,
  id,
  ...props
}) => {
  const inputId = id || `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex justify-between items-center text-sm">
        <label htmlFor={inputId} className="font-medium text-zinc-700 dark:text-zinc-200">
          {label}
        </label>
        <span 
          aria-live="polite" 
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums",
            isLocked 
              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
          )}
        >
          {value}{unit}
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={isLocked}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={`${label} percentage slider`}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-opacity",
            isLocked 
              ? "bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed opacity-60" 
              : "bg-zinc-200 dark:bg-zinc-700 accent-indigo-600"
          )}
          {...props}
        />
      </div>
    </div>
  );
};

