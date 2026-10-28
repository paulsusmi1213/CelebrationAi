export type EventType = 'wedding' | 'birthday' | 'community' | 'custom';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY';

export type BudgetCategoryKey = 
  | 'VENUE' 
  | 'CATERING' 
  | 'DECOR' 
  | 'ENTERTAINMENT' 
  | 'MISCELLANEOUS' 
  | 'CONTINGENCY';

export interface OnboardingFormData {
  eventType: EventType;
  customTypeLabel?: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: Currency;
  themeStyle: string;
  specialRequests: string; // Dietary, cultural, sensory, accessibility preferences
}

export interface BudgetItem {
  id: string;
  category: BudgetCategoryKey;
  label: string;
  percentage: number; // e.g. 35 for 35%
  allocatedAmount: number;
  spentAmount: number;
  notes: string;
  costSavingTip: string;
}

export type TimelinePhase = 
  | 'phase_early'       // 6+ months or initial phase
  | 'phase_mid'         // 3 to 1 month out
  | 'phase_final_weeks' // 2 to 1 week out
  | 'phase_day_of'      // Day-of logistics
  | 'phase_post_event'; // Wrap-up & thank you notes

export interface TimelineTask {
  id: string;
  phase: TimelinePhase;
  phaseLabel: string;
  title: string;
  description: string;
  suggestedDueDaysBefore: number; // e.g. 180, 30, 7, 0
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category: BudgetCategoryKey | 'GENERAL';
}

export interface VendorChecklistItem {
  id: string;
  category: BudgetCategoryKey;
  vendorRole: string; // e.g., "Lead Photographer", "Artisan Caterer", "DJ / Acoustic Duo"
  priority: 'essential' | 'recommended' | 'optional';
  status: 'to_contact' | 'contacted' | 'quoted' | 'booked';
  targetBookingLeadWeeks: number;
  questionsToAsk: string[];
  contractReviewReminders: string[];
  estimatedCostRange?: string;
}

export interface PersonalizedIdea {
  id: string;
  title: string;
  category: 'theme' | 'activity' | 'decor' | 'hospitality' | 'custom';
  description: string;
  whyItFits: string;
  estimatedCostImpact: 'low' | 'medium' | 'high';
  isFavorite?: boolean;
}

export interface GeneratedEventPlan {
  planId: string;
  summary: {
    eventTitle: string;
    vibeStatement: string;
    targetGuestCount: number;
    totalBudget: number;
    currency: Currency;
    daysUntilEvent: number;
  };
  budgetBreakdown: BudgetItem[];
  timeline: TimelineTask[];
  vendorChecklist: VendorChecklistItem[];
  personalizedIdeas: PersonalizedIdea[];
  coPilotWelcomeMessage: string;
}

export interface AICopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionsApplied?: {
    type: 'BUDGET_ADJUSTED' | 'TASK_ADDED' | 'THEME_UPDATED';
    summary: string;
  }[];
}

export interface CopilotRefinementRequest {
  currentPlan: GeneratedEventPlan;
  userPrompt: string;
  focusCategory?: BudgetCategoryKey;
}

export interface CopilotRefinementResponse {
  replyMessage: string;
  updatedPlan?: Partial<GeneratedEventPlan>;
}

