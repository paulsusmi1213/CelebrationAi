'use client';

import React, { useState, useEffect } from 'react';
import { EventOnboardingWizard } from '@/components/onboarding/EventOnboardingWizard';
import { InteractiveDashboard } from '@/components/dashboard/InteractiveDashboard';
import { GeneratedEventPlan } from '@/types/event-planner';

export default function Home() {
  const [activePlan, setActivePlan] = useState<GeneratedEventPlan | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    // Check if there's an existing plan in session/storage
    try {
      const savedPlan = localStorage.getItem('celebration_active_plan');
      if (savedPlan) {
        setActivePlan(JSON.parse(savedPlan));
      }
    } catch {
      // Fallback
    }
  }, []);

  const handlePlanGenerated = (newPlan: GeneratedEventPlan) => {
    setActivePlan(newPlan);
    try {
      localStorage.setItem('celebration_active_plan', JSON.stringify(newPlan));
    } catch {
      // Fallback
    }
  };

  const handleResetPlan = () => {
    setActivePlan(null);
    try {
      localStorage.removeItem('celebration_active_plan');
    } catch {
      // Fallback
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {activePlan ? (
        <InteractiveDashboard
          initialPlan={activePlan}
          onReset={handleResetPlan}
        />
      ) : (
        <EventOnboardingWizard
          onPlanGenerated={handlePlanGenerated}
        />
      )}
    </div>
  );
}

