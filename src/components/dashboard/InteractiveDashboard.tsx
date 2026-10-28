'use client';

import React, { useState, useEffect } from 'react';
import { 
  GeneratedEventPlan, 
  BudgetItem, 
  TimelineTask, 
  VendorChecklistItem 
} from '@/types/event-planner';
import { BudgetOverview } from './BudgetOverview';
import { TimelineView } from './TimelineView';
import { VendorChecklistView } from './VendorChecklistView';
import { IdeasGallery } from './IdeasGallery';
import { AICopilotChat } from './AICopilotChat';
import { Button } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  Sparkles, 
  Download, 
  Share2, 
  RotateCcw,
  Layers,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface InteractiveDashboardProps {
  initialPlan: GeneratedEventPlan;
  onReset: () => void;
}

export const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  initialPlan,
  onReset
}) => {
  const [plan, setPlan] = useState<GeneratedEventPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'ideas'>('budget');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Auto-persist plan changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`event_plan_${plan.planId}`, JSON.stringify(plan));
    } catch {
      // Storage error handling
    }
  }, [plan]);

  // Synchronize partial updates from AI Co-Pilot
  const handleApplyCopilotUpdate = (updatedPatch: Partial<GeneratedEventPlan>) => {
    setPlan(prev => ({
      ...prev,
      ...updatedPatch,
      summary: {
        ...prev.summary,
        ...(updatedPatch.summary || {})
      }
    }));
  };

  const handleUpdateBudget = (newBudget: BudgetItem[]) => {
    setPlan(prev => ({ ...prev, budgetBreakdown: newBudget }));
  };

  const handleToggleTask = (taskId: string) => {
    setPlan(prev => ({
      ...prev,
      timeline: prev.timeline.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const handleAddTask = (taskData: Omit<TimelineTask, 'id'>) => {
    const newTask: TimelineTask = {
      ...taskData,
      id: `task-${Date.now()}`
    };
    setPlan(prev => ({
      ...prev,
      timeline: [newTask, ...prev.timeline]
    }));
  };

  const handleUpdateVendorStatus = (vendorId: string, status: VendorChecklistItem['status']) => {
    setPlan(prev => ({
      ...prev,
      vendorChecklist: prev.vendorChecklist.map(v => 
        v.id === vendorId ? { ...v, status } : v
      )
    }));
  };

  const handleToggleFavoriteIdea = (ideaId: string) => {
    setPlan(prev => ({
      ...prev,
      personalizedIdeas: prev.personalizedIdeas.map(i => 
        i.id === ideaId ? { ...i, isFavorite: !i.isFavorite } : i
      )
    }));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${plan.summary.eventTitle.replace(/\s+/g, '_')}_Plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleShareSummary = () => {
    const summaryText = `🎉 ${plan.summary.eventTitle} Plan\n📅 Days until event: ${plan.summary.daysUntilEvent}\n👥 Guests: ${plan.summary.targetGuestCount}\n💰 Budget: ${formatCurrency(plan.summary.totalBudget, plan.summary.currency)}\n✨ Vibe: ${plan.summary.vibeStatement}`;
    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const completedTasks = plan.timeline.filter(t => t.completed).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Top Header & Event Quick Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Celebration Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {plan.summary.eventTitle}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {plan.summary.vibeStatement}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={handleShareSummary} className="text-xs gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedNotification ? 'Copied to Clipboard!' : 'Share Brief'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1.5 text-zinc-500">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </Button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lead Time</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {plan.summary.daysUntilEvent} Days
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
              <Users className="w-3.5 h-3.5 text-violet-500" />
              <span>Guest Headcount</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {plan.summary.targetGuestCount} Guests
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Budget</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(plan.summary.totalBudget, plan.summary.currency)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
              <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Milestones Done</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
              {completedTasks} / {plan.timeline.length}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {[
          { id: 'budget', label: 'Budget Allocation', icon: DollarSign },
          { id: 'timeline', label: 'Backwards Timeline', icon: Calendar },
          { id: 'vendors', label: 'Vendor Checklist', icon: Layers },
          { id: 'ideas', label: 'Bespoke Ideas', icon: Sparkles },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              )}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="mt-4">
        {activeTab === 'budget' && (
          <BudgetOverview
            budgetItems={plan.budgetBreakdown}
            totalBudget={plan.summary.totalBudget}
            currency={plan.summary.currency}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            timeline={plan.timeline}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorChecklistView
            vendors={plan.vendorChecklist}
            onUpdateVendorStatus={handleUpdateVendorStatus}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasGallery
            ideas={plan.personalizedIdeas}
            onToggleFavorite={handleToggleFavoriteIdea}
          />
        )}
      </div>

      {/* Floating AI Event Co-Pilot Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          aria-expanded={isCopilotOpen}
          aria-label="Open AI Event Co-Pilot assistant drawer"
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white font-semibold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
          <span>AI Event Co-Pilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* Embedded Co-Pilot Chat Drawer */}
      <AICopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentPlan={plan}
        onApplyPlanUpdate={handleApplyCopilotUpdate}
      />
    </div>
  );
};

