'use client';

import React, { useState, useEffect } from 'react';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { InteractiveDashboard } from '@/components/InteractiveDashboard';
import { EventOnboardingData, GeneratedEventPlan } from '@/types/event';
import { Sparkles, CalendarHeart, Moon, Sun, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_PLAN = 'celebration_ai_plan_v1';
const STORAGE_KEY_DATA = 'celebration_ai_event_v1';

export default function Home() {
  const [eventData, setEventData] = useState<EventOnboardingData | null>(null);
  const [eventPlan, setEventPlan] = useState<GeneratedEventPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const cachedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
      const cachedData = localStorage.getItem(STORAGE_KEY_DATA);
      if (cachedPlan && cachedData) {
        setEventPlan(JSON.parse(cachedPlan));
        setEventData(JSON.parse(cachedData));
      }
    } catch (e) {
      console.warn('Could not read cached plan from storage:', e);
    }
  }, []);

  const handleGeneratePlan = async (data: EventOnboardingData) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Planning engine returned status ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to generate plan structure.');
      }

      setEventData(data);
      setEventPlan(json.data);

      localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(json.data));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to generate event plan. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PLAN);
      localStorage.removeItem(STORAGE_KEY_DATA);
    } catch (e) {}
    setEventPlan(null);
    setEventData(null);
    setErrorMsg(null);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-fuchsia-600 text-white rounded-lg font-bold"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white shadow-sm">
              <CalendarHeart className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Celebration<span className="text-fuchsia-600">AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-900">
                  Production Ready
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>WCAG 2.1 AA & GDPR Compliant</span>
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs sm:text-sm flex items-start justify-between"
          >
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="font-bold underline ml-4 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {!eventPlan || !eventData ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-300 text-xs font-semibold border border-fuchsia-200 dark:border-fuchsia-900">
                <Sparkles className="w-3.5 h-3.5" />
                Intelligent Event Architecture Engine
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Plan Your Milestone Celebration in Seconds
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Engineered for weddings, milestone birthdays, and community galas. Get dynamic budget allocations, backwards timelines, and vendor contract checklists.
              </p>
            </div>

            <OnboardingWizard
              onPlanGenerated={handleGeneratePlan}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <InteractiveDashboard
            eventData={eventData}
            initialPlan={eventPlan}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

