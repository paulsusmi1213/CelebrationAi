'use client';

import React from 'react';
import { BudgetItem, Currency } from '@/types/event';
import { AlertCircle, CheckCircle, Lock, Lightbulb, DollarSign } from 'lucide-react';

interface BudgetBreakdownProps {
  budgetItems: BudgetItem[];
  totalBudget: number;
  currency: Currency;
  onUpdateBudget: (items: BudgetItem[]) => void;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  budgetItems,
  totalBudget,
  currency,
  onUpdateBudget,
}) => {
  const totalAllocated = budgetItems.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
  const totalPercentage = Math.round(budgetItems.reduce((acc, curr) => acc + curr.percentage, 0) * 10) / 10;
  const isBudgetBalanced = Math.abs(totalPercentage - 100) < 0.1;

  const handleSliderChange = (id: string, newPercentage: number) => {
    const updated = budgetItems.map((item) => {
      if (item.id === id) {
        const roundedPct = Math.round(newPercentage * 10) / 10;
        const newAllocated = Math.round((totalBudget * roundedPct) / 100);
        return {
          ...item,
          percentage: roundedPct,
          allocatedAmount: newAllocated,
        };
      }
      return item;
    });

    onUpdateBudget(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              Dynamic Budget Allocation
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Adjust category sliders to dynamically reshape your plan. Contingency is safeguarded.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Allocated
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {currency} {totalAllocated.toLocaleString()}
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isBudgetBalanced
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isBudgetBalanced ? (
                <>
                  <CheckCircle className="w-4 h-4" /> 100% Balanced
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" /> {totalPercentage}% Total ({(100 - totalPercentage > 0 ? `+${(100 - totalPercentage).toFixed(1)}% free` : `${(totalPercentage - 100).toFixed(1)}% over`)})
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
            {budgetItems.map((item, idx) => {
              const bgColors = [
                'bg-fuchsia-500',
                'bg-indigo-500',
                'bg-sky-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-rose-500',
              ];
              const color = item.isContingency ? 'bg-amber-500' : bgColors[idx % bgColors.length];
              return (
                <div
                  key={item.id}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  className={`${color} transition-all duration-300 relative group`}
                  title={`${item.category}: ${item.percentage}%`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-slate-600 dark:text-slate-400">
            {budgetItems.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.isContingency ? 'bg-amber-500' : 'bg-fuchsia-500'
                  }`}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                <span className="text-slate-400">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all ${
              item.isContingency
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {item.category}
                  {item.isContingency && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Mandatory Buffer
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {item.percentage}% of total fund
                </span>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {currency} {item.allocatedAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>0%</span>
                <label htmlFor={`slider-${item.id}`} className="sr-only">
                  {item.category} Budget Percentage
                </label>
                <span>{item.percentage}%</span>
                <span>60%</span>
              </div>
              <input
                id={`slider-${item.id}`}
                type="range"
                min="0"
                max="60"
                step="0.5"
                value={item.percentage}
                onChange={(e) => handleSliderChange(item.id, parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                aria-label={`${item.category} percentage slider`}
              />
            </div>

            {item.costSavingTip && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Cost-Saving Tip: </strong>
                  {item.costSavingTip}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

