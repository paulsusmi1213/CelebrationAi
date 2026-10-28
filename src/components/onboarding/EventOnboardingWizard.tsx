'use client';

import React, { useState, useEffect } from 'react';
import { 
  EventType, 
  Currency, 
  OnboardingFormData, 
  GeneratedEventPlan 
} from '@/types/event-planner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { 
  HeartHandshake, 
  Cake, 
  Users, 
  Sparkles, 
  Calendar, 
  MapPin, 
  UserCheck, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventOnboardingWizardProps {
  onPlanGenerated: (plan: GeneratedEventPlan) => void;
}

const INITIAL_FORM: OnboardingFormData = {
  eventType: 'wedding',
  customTypeLabel: '',
  title: 'Autumn Garden Wedding',
  eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  location: 'Napa Valley, CA',
  guestCount: 85,
  totalBudget: 28000,
  currency: 'USD',
  themeStyle: 'Rustic Elegance with Warm Earth Tones & Botanical Florals',
  specialRequests: 'Include vegan & gluten-free dining options; acoustic guitar ceremony prelude; zero-waste recycling.'
};

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' }
];

export const EventOnboardingWizard: React.FC<EventOnboardingWizardProps> = ({ onPlanGenerated }) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<{ stage: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore saved draft from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('celebration_planner_draft');
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const updateField = <K extends keyof OnboardingFormData>(key: K, value: OnboardingFormData[K]) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    setErrorMessage(null);
    try {
      localStorage.setItem('celebration_planner_draft', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleQuickPreset = (type: EventType) => {
    if (type === 'wedding') {
      setFormData({
        ...formData,
        eventType: 'wedding',
        title: 'Vineyard Sunset Wedding',
        guestCount: 90,
        totalBudget: 32000,
        currency: 'USD',
        themeStyle: 'Modern Bohemian with Pampas Grass & Warm Brass Accents',
        specialRequests: 'Organic local wines, gluten-free dessert bar, acoustic processional.'
      });
    } else if (type === 'birthday') {
      setFormData({
        ...formData,
        eventType: 'birthday',
        title: 'Milestone 40th Birthday Soirée',
        guestCount: 45,
        totalBudget: 6500,
        currency: 'USD',
        themeStyle: 'Speakeasy Retro Glamour with Jazz & Cocktail Pairings',
        specialRequests: 'Mocktail options for non-drinkers, projection photo wall, surprise live brass trio.'
      });
    } else if (type === 'community') {
      setFormData({
        ...formData,
        eventType: 'community',
        title: 'Annual Maker & Artisan Harvest Fair',
        guestCount: 300,
        totalBudget: 15000,
        currency: 'USD',
        themeStyle: 'Sustainable Eco-Market with Upcycled Wood & Interactive Workshops',
        specialRequests: 'Wheelchair-accessible aisles, certified compost station, food truck dietary tags.'
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.eventType) return false;
      if (formData.eventType === 'custom' && !formData.customTypeLabel?.trim()) {
        setErrorMessage('Please specify your custom event type name.');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!formData.title.trim()) {
        setErrorMessage('Please provide an event title.');
        return false;
      }
      if (!formData.location.trim()) {
        setErrorMessage('Please enter an event city or venue location.');
        return false;
      }
      const selected = new Date(formData.eventDate);
      if (isNaN(selected.getTime())) {
        setErrorMessage('Please choose a valid event date.');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (formData.guestCount <= 0) {
        setErrorMessage('Guest count must be at least 1.');
        return false;
      }
      if (formData.totalBudget <= 0) {
        setErrorMessage('Please enter a realistic celebration budget.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setErrorMessage(null);
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitPlan = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setStreamProgress({ stage: 'init', message: 'Connecting to GenAI Engine...' });

    try {
      // Initiate SSE streaming request for transparent real-time feedback
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan.');
      }

      // Check if response is streaming SSE
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event: (.*)$/m);
            const dataMatch = line.match(/^data: (.*)$/m);

            const eventType = eventMatch ? eventMatch[1].trim() : 'message';
            const dataStr = dataMatch ? dataMatch[1].trim() : '';

            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (eventType === 'progress') {
                setStreamProgress(data);
              } else if (eventType === 'complete') {
                onPlanGenerated(data);
                setIsSubmitting(false);
                return;
              } else if (eventType === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            }
          }
        }
      } else {
        // Fallback standard JSON
        const plan = await response.json();
        onPlanGenerated(plan);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>GenAI Event Architecture Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Design Your Perfect Celebration
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Tailored backwards timelines, zero-sum budget protection with a locked 10% emergency buffer, and curated vendor checklists.
        </p>
      </div>

      {/* Accessible Step Progress Indicator */}
      <nav aria-label="Onboarding Progress" className="mb-8">
        <div className="flex items-center justify-between relative mb-2">
          {[
            { stepNum: 1, label: 'Type' },
            { stepNum: 2, label: 'Details' },
            { stepNum: 3, label: 'Budget' },
            { stepNum: 4, label: 'Vibe & Needs' }
          ].map((item) => {
            const isCompleted = step > item.stepNum;
            const isCurrent = step === item.stepNum;
            return (
              <button
                key={item.stepNum}
                type="button"
                onClick={() => isCompleted && setStep(item.stepNum)}
                disabled={!isCompleted}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 focus:outline-none group",
                  isCompleted ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border-2",
                    isCompleted && "bg-emerald-600 border-emerald-600 text-white",
                    isCurrent && "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50",
                    !isCompleted && !isCurrent && "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : item.stepNum}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isCurrent ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-500"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <ProgressBar value={((step - 1) / 3) * 100} showPercent={false} colorClass="bg-indigo-600" />
      </nav>

      {/* Error Banner */}
      {errorMessage && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Main Step Container */}
      <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 relative">
        {/* STEP 1: EVENT TYPE */}
        {step === 1 && (
          <fieldset className="space-y-6">
            <legend className="text-xl font-bold text-zinc-900 dark:text-white">
              What kind of celebration are we orchestrating?
            </legend>
            <p className="text-xs sm:text-sm text-zinc-500">
              Select an event framework. Our AI automatically adapts timeline milestones and vendor recommendations to your choice.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'wedding',
                  title: 'Wedding Celebration',
                  desc: 'Comprehensive multi-month milestones, tastings, and rehearsal logistics.',
                  icon: HeartHandshake,
                  badge: 'Popular'
                },
                {
                  id: 'birthday',
                  title: 'Milestone Birthday',
                  desc: 'High-energy party design, entertainment programming, and surprise elements.',
                  icon: Cake
                },
                {
                  id: 'community',
                  title: 'Community / Gala',
                  desc: 'Ticketing, accessibility compliance, permits, and volunteer coordination.',
                  icon: Users
                },
                {
                  id: 'custom',
                  title: 'Custom Event',
                  desc: 'Anniversary, corporate retreat, album release, or boutique pop-up.',
                  icon: Sparkles
                }
              ].map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = formData.eventType === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all relative text-left select-none focus-within:ring-2 focus-within:ring-indigo-500",
                      isSelected 
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                    )}
                  >
                    <input
                      type="radio"
                      name="eventType"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => {
                        updateField('eventType', opt.id as EventType);
                        if (opt.id !== 'custom') handleQuickPreset(opt.id as EventType);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      {opt.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-base mb-1">{opt.title}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{opt.desc}</span>
                  </label>
                );
              })}
            </div>

            {formData.eventType === 'custom' && (
              <div className="pt-2">
                <label htmlFor="customTypeLabel" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Specify Custom Celebration Name
                </label>
                <input
                  id="customTypeLabel"
                  type="text"
                  placeholder="e.g., 25th Silver Wedding Anniversary, Tech Hackathon Gala"
                  value={formData.customTypeLabel || ''}
                  onChange={(e) => updateField('customTypeLabel', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </fieldset>
        )}

        {/* STEP 2: DETAILS (TITLE, DATE, LOCATION) */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">When and where is the magic happening?</h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Lead times dynamically shape your backwards timeline and contract signing urgency.
              </p>
            </div>

            <div>
              <label htmlFor="eventTitle" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Celebration Name / Headline
              </label>
              <input
                id="eventTitle"
                type="text"
                required
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Maya & Liam's Sunset Vineyard Wedding"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Target Date
                </label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.eventDate}
                  onChange={(e) => updateField('eventDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="eventLocation" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  City, Venue or Region
                </label>
                <input
                  id="eventLocation"
                  type="text"
                  required
                  placeholder="e.g., Napa Valley, CA or Austin, TX"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET & HEADCOUNT */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Budget & Guest Scale</h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                The GenAI engine guarantees a 10% locked emergency reserve and precise per-category zero-sum allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="totalBudget" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Total Event Budget
                </label>
                <div className="relative">
                  <input
                    id="totalBudget"
                    type="number"
                    min="100"
                    step="500"
                    required
                    value={formData.totalBudget}
                    onChange={(e) => updateField('totalBudget', Math.max(0, Number(e.target.value)))}
                    className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs font-bold text-zinc-500">
                    {formData.currency}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="currencySelect" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Currency
                </label>
                <select
                  id="currencySelect"
                  value={formData.currency}
                  onChange={(e) => updateField('currency', e.target.value as Currency)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="guestCount" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  Estimated Guest Count
                </label>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {formData.guestCount} Guests
                </span>
              </div>
              <input
                id="guestCount"
                type="range"
                min="5"
                max="500"
                step="5"
                value={formData.guestCount}
                onChange={(e) => updateField('guestCount', Number(e.target.value))}
                aria-label="Guest count slider"
                className="w-full h-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                <span>Intimate (5-30)</span>
                <span>Medium (50-120)</span>
                <span>Grand (200-500)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Contingency Shield:</strong> We automatically isolate <strong>{formData.currency} {Math.round(formData.totalBudget * 0.10).toLocaleString()}</strong> (10%) as a non-spendable buffer until final vendor reconciliations.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: THEME, SPECIAL REQUESTS & ACCESSIBILITY */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Aesthetic & Special Inclusions</h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Infuse your celebration with personal flair, dietary needs, accessibility considerations, and traditions.
              </p>
            </div>

            <div>
              <label htmlFor="themeStyle" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Vibe, Theme & Color Palette
              </label>
              <input
                id="themeStyle"
                type="text"
                required
                value={formData.themeStyle}
                onChange={(e) => updateField('themeStyle', e.target.value)}
                placeholder="e.g. Modern Minimalist with Terracotta & Olive Green Accents"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="specialRequests" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Dietary, Cultural Traditions & Accessibility Needs</span>
                <span className="text-xs text-zinc-400 font-normal">Optional</span>
              </label>
              <textarea
                id="specialRequests"
                rows={3}
                value={formData.specialRequests}
                onChange={(e) => updateField('specialRequests', e.target.value)}
                placeholder="e.g., Strict nut-free and vegan meal requirements; wheelchair accessible staging; Jewish Horah dance tradition; quiet sensory room."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Streaming Progress Feedback Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 z-20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Architecting Your Celebration
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-sm mb-4 animate-pulse">
              {streamProgress?.message || 'Validating constraints and calculating budget breakdown...'}
            </p>
            <div className="w-64">
              <ProgressBar value={75} showPercent={false} colorClass="bg-indigo-600 animate-pulse" />
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              className="gap-2 ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitPlan}
              isLoading={isSubmitting}
              className="gap-2 ml-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Event Plan</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

