'use client';

import React, { useState } from 'react';
import { EventOnboardingData, GeneratedEventPlan, BudgetItem, TimelineTask, VendorItem } from '@/types/event';
import { BudgetBreakdown } from './BudgetBreakdown';
import { TimelineView } from './TimelineView';
import { VendorChecklist } from './VendorChecklist';
import { PersonalizedIdeas } from './PersonalizedIdeas';
import { AiCopilotChat } from './AiCopilotChat';
import { 
  DollarSign, 
  Clock, 
  Briefcase, 
  Sparkles, 
  Bot, 
  RotateCcw, 
  MapPin, 
  Download
} from 'lucide-react';

interface InteractiveDashboardProps {
  eventData: EventOnboardingData;
  initialPlan: GeneratedEventPlan;
  onReset: () => void;
}

export const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({
  eventData,
  initialPlan,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'ideas'>('budget');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialPlan.budgetBreakdown);
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>(initialPlan.timeline);
  const [vendors, setVendors] = useState<VendorItem[]>(initialPlan.vendors);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  const totalBudget = Number(eventData.totalBudget);
  const completedTasks = timelineTasks.filter((t) => t.isCompleted).length;
  const bookedVendors = vendors.filter((v) => v.status === 'BOOKED').length;

  const targetDate = new Date(eventData.eventDate);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const handleToggleTask = (taskId: string) => {
    setTimelineTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleUpdateVendorStatus = (vendorId: string, newStatus: VendorItem['status']) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v))
    );
  };

  const handleExportPlan = () => {
    const exportData = {
      event: eventData,
      summary: initialPlan.planSummary,
      budget: budgetItems,
      timeline: timelineTasks,
      vendors: vendors,
      bespokeIdeas: initialPlan.bespokeIdeas,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventData.eventName.replace(/\s+/g, '_')}_Plan.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-fuchsia-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-900">
                {eventData.eventType} PLANNER
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {eventData.location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {eventData.eventName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {initialPlan.planSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              title="Download Plan JSON"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              title="Start over with a new event"
            >
              <RotateCcw className="w-4 h-4" /> New Plan
            </button>

            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-fuchsia-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              AI Event Co-Pilot
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Days Until Event
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
              {daysLeft} <span className="text-xs font-medium text-slate-400">days</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Date: {eventData.eventDate}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Budget Target
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {eventData.currency} {totalBudget.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              10% Contingency Safe
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Timeline Tasks
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {completedTasks} / {timelineTasks.length}
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 block">
              {Math.round((completedTasks / timelineTasks.length) * 100 || 0)}% Completed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Vendors Secured
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {bookedVendors} / {vendors.length}
            </div>
            <span className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 mt-1 block">
              {vendors.length - bookedVendors} In Progress
            </span>
          </div>
        </div>
      </div>

      <div 
        className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label="Dashboard views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'budget'}
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${
            activeTab === 'budget'
              ? 'bg-fuchsia-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Budget Allocation
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${
            activeTab === 'timeline'
              ? 'bg-fuchsia-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Timeline & Milestones
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vendors'}
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${
            activeTab === 'vendors'
              ? 'bg-fuchsia-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Vendor Checklist
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ideas'}
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${
            activeTab === 'ideas'
              ? 'bg-fuchsia-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Bespoke Ideas (5)
        </button>
      </div>

      <div className="pt-2">
        {activeTab === 'budget' && (
          <div>
            <BudgetBreakdown
              budgetItems={budgetItems}
              totalBudget={totalBudget}
              currency={eventData.currency}
              onUpdateBudget={setBudgetItems}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <TimelineView
              tasks={timelineTasks}
              onToggleTask={handleToggleTask}
            />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div>
            <VendorChecklist
              vendors={vendors}
              currency={eventData.currency}
              onUpdateVendorStatus={handleUpdateVendorStatus}
            />
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <PersonalizedIdeas ideas={initialPlan.bespokeIdeas} />
          </div>
        )}
      </div>

      {!isCopilotOpen && (
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold text-sm shadow-2xl hover:scale-105 transition-all focus:ring-4 focus:ring-fuchsia-300"
          aria-label="Open AI Event Co-Pilot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Bot className="w-5 h-5" />
          <span>Ask AI Co-Pilot</span>
        </button>
      )}

      <AiCopilotChat
        currentBudget={budgetItems}
        currentTimeline={timelineTasks}
        onApplyBudgetUpdate={setBudgetItems}
        onAddTimelineTasks={(newTasks) => setTimelineTasks((prev) => [...prev, ...newTasks])}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};

