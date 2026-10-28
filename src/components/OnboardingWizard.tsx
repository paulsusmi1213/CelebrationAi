'use client';

import React, { useState } from 'react';
import { EventOnboardingData, EventType, Currency } from '@/types/event';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Palette, 
  HeartHandshake, 
  ArrowRight, 
  ArrowLeft, 
  PartyPopper,
  Cake,
  Heart,
  Globe
} from 'lucide-react';

interface OnboardingWizardProps {
  onPlanGenerated: (data: EventOnboardingData) => void;
  isLoading: boolean;
}

const EVENT_TYPE_OPTIONS: { type: EventType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    type: 'WEDDING',
    label: 'Wedding Celebration',
    icon: <Heart className="w-6 h-6 text-pink-500" aria-hidden="true" />,
    desc: 'Ceremony, reception, rehearsals, and multi-vendor coordination.',
  },
  {
    type: 'BIRTHDAY',
    label: 'Milestone Birthday',
    icon: <Cake className="w-6 h-6 text-amber-500" aria-hidden="true" />,
    desc: 'Theme parties, dinners, entertainment, and surprise celebrations.',
  },
  {
    type: 'COMMUNITY',
    label: 'Community & Cultural',
    icon: <Globe className="w-6 h-6 text-emerald-500" aria-hidden="true" />,
    desc: 'Festivals, charity fundraisers, cultural galas, and reunions.',
  },
  {
    type: 'CUSTOM',
    label: 'Custom Occasion',
    icon: <PartyPopper className="w-6 h-6 text-indigo-500" aria-hidden="true" />,
    desc: 'Anniversaries, corporate milestones, or tailored gatherings.',
  },
];

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD ($)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onPlanGenerated, isLoading }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<EventOnboardingData>({
    eventType: 'WEDDING',
    customEventType: '',
    eventName: 'Our Dream Wedding',
    eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    location: 'San Francisco, CA',
    guestCount: 120,
    totalBudget: 35000,
    currency: 'USD',
    themePreferences: 'Modern Botanical Elegance with warm ambient fairy lighting and neutral ivory tones.',
    specialRequests: 'Allergen-conscious catering (gluten-free and vegan options), acoustic live music during cocktail hour.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.eventName.trim()) errs.eventName = 'Event name is required.';
      if (formData.eventType === 'CUSTOM' && !formData.customEventType?.trim()) {
        errs.customEventType = 'Please describe your custom event.';
      }
    } else if (step === 2) {
      if (!formData.eventDate) errs.eventDate = 'Event date is required.';
      if (!formData.location.trim()) errs.location = 'Location or city is required.';
    } else if (step === 3) {
      if (!formData.guestCount || formData.guestCount < 1) errs.guestCount = 'Guest count must be at least 1.';
      if (!formData.totalBudget || formData.totalBudget < 100) errs.totalBudget = 'Budget must be at least 100.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      onPlanGenerated(formData);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
      <div className="px-6 sm:px-10 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {currentStep === 1 && 'Event Type & Name'}
            {currentStep === 2 && 'Date & Destination'}
            {currentStep === 3 && 'Guests & Budget'}
            {currentStep === 4 && 'Theme & Custom Touches'}
          </span>
        </div>

        <div 
          className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden" 
          role="progressbar" 
          aria-valuenow={(currentStep / totalSteps) * 100} 
          aria-valuemin={0} 
          aria-valuemax={100}
          aria-label="Onboarding Progress"
        >
          <div
            className="bg-gradient-to-r from-fuchsia-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                What are you celebrating?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Choose the occasion so our AI can customize vendor requirements and planning lead times.
              </p>
            </div>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="sr-only">Select Event Type</legend>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-fuchsia-500 ${
                    formData.eventType === opt.type
                      ? 'border-fuchsia-600 bg-fuchsia-50/50 dark:bg-fuchsia-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                      {opt.icon}
                    </span>
                    <input
                      type="radio"
                      name="eventType"
                      value={opt.type}
                      checked={formData.eventType === opt.type}
                      onChange={() => setFormData({ ...formData, eventType: opt.type })}
                      className="w-4 h-4 text-fuchsia-600 focus:ring-fuchsia-500"
                    />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {opt.desc}
                  </span>
                </label>
              ))}
            </fieldset>

            {formData.eventType === 'CUSTOM' && (
              <div>
                <label htmlFor="customEventType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Specify Custom Event Type
                </label>
                <input
                  id="customEventType"
                  type="text"
                  placeholder="e.g., 50th Golden Anniversary Gala"
                  value={formData.customEventType || ''}
                  onChange={(e) => setFormData({ ...formData, customEventType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Event Title / Celebration Name
              </label>
              <input
                id="eventName"
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                placeholder="e.g., Maya & Liam's Sunset Nuptials"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                When & where will it take place?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                The date determines your backwards timeline, while the location tailors vendor costs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="eventDate" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                  Target Event Date
                </label>
                <input
                  id="eventDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <MapPin className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                  Location / City & Venue
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g., Austin, TX or Rome, Italy"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Guest count & Financial budget
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                We will dynamically allocate your funds with an automatic 10% contingency reserve.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="guestCount" className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                    Estimated Headcount
                  </span>
                  <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">{formData.guestCount} guests</span>
                </label>
                <input
                  id="guestCount"
                  type="number"
                  min="5"
                  max="10000"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="totalBudget" className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                  Total Target Budget
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formData.currency} {Number(formData.totalBudget || 0).toLocaleString()}
                </span>
              </label>
              <input
                id="totalBudget"
                type="number"
                step="500"
                min="500"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500"
              />
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Includes automatic 10% contingency reserve ({formData.currency} {Math.round(formData.totalBudget * 0.1).toLocaleString()}).
              </p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Themes, Style & Traditions
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Share dietary rules, cultural traditions, or specific aesthetic preferences.
              </p>
            </div>

            <div>
              <label htmlFor="themePreferences" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Palette className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                Theme & Aesthetic Vision
              </label>
              <textarea
                id="themePreferences"
                rows={3}
                value={formData.themePreferences}
                onChange={(e) => setFormData({ ...formData, themePreferences: e.target.value })}
                placeholder="e.g. Vintage Parisian Bistro, rustic boho chic with warm string lights"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="specialRequests" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <HeartHandshake className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                Special Requests, Traditions & Dietary Needs
              </label>
              <textarea
                id="specialRequests"
                rows={3}
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="e.g. Kosher-certified caterer, tea ceremony protocol, wheelchair accessibility"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm focus:ring-2 focus:ring-slate-400"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:from-fuchsia-700 hover:to-indigo-700 focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Custom Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Event Plan
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

