'use client';

import React, { useState } from 'react';
import { BudgetItem, Currency } from '@/types/event-planner';
import { Card } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  Lock, 
  Unlock, 
  Lightbulb, 
  ShieldAlert, 
  TrendingDown, 
  RotateCcw,
  DollarSign
} from 'lucide-react';

interface BudgetOverviewProps {
  budgetItems: BudgetItem[];
  totalBudget: number;
  currency: Currency;
  onUpdateBudget: (updated: BudgetItem[]) => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budgetItems,
  totalBudget,
  currency,
  onUpdateBudget
}) => {
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set(['b-contingency']));
  const [showTips, setShowTips] = useState<boolean>(true);

  // Calculate sum of percentages
  const currentTotalPercentage = budgetItems.reduce((sum, item) => sum + item.percentage, 0);
  const roundedSum = Math.round(currentTotalPercentage * 10) / 10;
  const isBalanced = Math.abs(roundedSum - 100.0) < 0.2;

  const toggleLock = (id: string) => {
    // Prevent unlocking contingency to maintain strict 10% safety buffer requirement
    if (id === 'b-contingency' || id.toLowerCase().includes('contingency')) {
      return;
    }
    const next = new Set(lockedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLockedIds(next);
  };

  const handleSliderChange = (changedId: string, newPercentage: number) => {
    const targetItem = budgetItems.find(i => i.id === changedId);
    if (!targetItem) return;

    // Fixed categories that cannot be automatically shifted
    const locked = new Set(lockedIds);
    locked.add('b-contingency');
    locked.add(changedId);

    const oldTargetPercentage = targetItem.percentage;
    const diff = newPercentage - oldTargetPercentage;

    // Remaining items that can absorb the difference
    const freeItems = budgetItems.filter(i => !locked.has(i.id));

    if (freeItems.length === 0) {
      // Cannot shift, only update single value if within 0-100
      const updated = budgetItems.map(item => {
        if (item.id === changedId) {
          return {
            ...item,
            percentage: newPercentage,
            allocatedAmount: Math.round((totalBudget * (newPercentage / 100)) * 100) / 100
          };
        }
        return item;
      });
      onUpdateBudget(updated);
      return;
    }

    // Distribute diff proportionally among free items
    const freeSum = freeItems.reduce((acc, curr) => acc + curr.percentage, 0);
    const updated = budgetItems.map(item => {
      if (item.id === changedId) {
        return {
          ...item,
          percentage: newPercentage,
          allocatedAmount: Math.round((totalBudget * (newPercentage / 100)) * 100) / 100
        };
      }
      if (!locked.has(item.id)) {
        const ratio = freeSum > 0 ? item.percentage / freeSum : 1 / freeItems.length;
        const adjusted = Math.max(1, Math.round((item.percentage - (diff * ratio)) * 10) / 10);
        return {
          ...item,
          percentage: adjusted,
          allocatedAmount: Math.round((totalBudget * (adjusted / 100)) * 100) / 100
        };
      }
      return item;
    });

    onUpdateBudget(updated);
  };

  const resetToEqual = () => {
    // 10% contingency, 90% split evenly across remaining 5 categories (18% each)
    const updated = budgetItems.map(item => {
      if (item.category === 'CONTINGENCY') {
        return {
          ...item,
          percentage: 10.0,
          allocatedAmount: Math.round(totalBudget * 0.10)
        };
      }
      return {
        ...item,
        percentage: 18.0,
        allocatedAmount: Math.round(totalBudget * 0.18)
      };
    });
    onUpdateBudget(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dynamic Budget Allocation</h2>
            <span className={cn(
              "text-xs font-bold px-2.5 py-0.5 rounded-full border",
              isBalanced 
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            )}>
              {roundedSum}% Allocated {isBalanced ? '✓ 100% Balanced' : `(${100 - roundedSum > 0 ? `${(100 - roundedSum).toFixed(1)}% unallocated` : `${(roundedSum - 100).toFixed(1)}% over`})`}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Slide any category. Non-locked categories dynamically re-balance while the 10% safety buffer stays locked.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTips(!showTips)}
            className="text-xs gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToEqual}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Auto Balance</span>
          </Button>
        </div>
      </div>

      {/* Category Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetItems.map((item) => {
          const isContingency = item.category === 'CONTINGENCY';
          const isLocked = lockedIds.has(item.id) || isContingency;

          return (
            <Card 
              key={item.id} 
              className={cn(
                "p-5 transition-all border",
                isContingency 
                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                      {item.label}
                    </span>
                    {isContingency && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                        <ShieldAlert className="w-3 h-3" />
                        Strict Buffer
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1 tabular-nums">
                    {formatCurrency(item.allocatedAmount, currency)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLock(item.id)}
                  disabled={isContingency}
                  title={isContingency ? "Contingency buffer is permanently locked" : isLocked ? "Unlock category" : "Lock category"}
                  aria-label={isLocked ? `Unlock ${item.label}` : `Lock ${item.label}`}
                  className={cn(
                    "p-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isLocked 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300" 
                      : "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  )}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>

              {/* Range Slider */}
              <Slider
                label="Share of Total"
                value={item.percentage}
                min={2}
                max={60}
                step={0.5}
                unit="%"
                isLocked={isLocked}
                onChange={(val) => handleSliderChange(item.id, val)}
              />

              {/* Notes */}
              {item.notes && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 line-clamp-2">
                  {item.notes}
                </p>
              )}

              {/* Cost Saving Tip */}
              {showTips && item.costSavingTip && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl">
                  <TrendingDown className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-semibold">Cost-Saving Tip: </span>
                    {item.costSavingTip}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

