export type EventType = 'WEDDING' | 'BIRTHDAY' | 'COMMUNITY' | 'CUSTOM';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY';

export interface EventOnboardingData {
  eventType: EventType;
  customEventType?: string;
  eventName: string;
  eventDate: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: Currency;
  themePreferences: string;
  specialRequests: string;
}

export interface BudgetItem {
  id: string;
  category: 'Venue' | 'Catering' | 'Decor' | 'Entertainment' | 'Miscellaneous' | 'Contingency' | string;
  percentage: number;
  allocatedAmount: number;
  actualSpent: number;
  costSavingTip: string;
  notes?: string;
  isContingency: boolean;
}

export type TimelinePhase = 
  | '6+ Months Out' 
  | '3-5 Months Out' 
  | '1-2 Months Out' 
  | '2-4 Weeks Out' 
  | '1 Week Out' 
  | 'Day-of' 
  | 'Post-Event';

export interface TimelineTask {
  id: string;
  phase: TimelinePhase;
  title: string;
  description: string;
  targetDateDescription: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isCompleted: boolean;
  category?: string;
}

export interface VendorItem {
  id: string;
  vendorType: string;
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD';
  status: 'PENDING' | 'RESEARCHING' | 'CONTACTED' | 'BOOKED';
  estimatedCost: number;
  questionsToAsk: string[];
  contractWatchouts: string[];
}

export interface BespokeIdea {
  id: string;
  title: string;
  category: 'Theme & Vibe' | 'Activity & Flow' | 'Decor & Aesthetics' | 'Food & Beverage' | 'Community Impact';
  description: string;
  estimatedCostImpact: 'Low ($)' | 'Moderate ($$)' | 'High ($$$)';
}

export interface GeneratedEventPlan {
  planSummary: string;
  budgetBreakdown: BudgetItem[];
  timeline: TimelineTask[];
  vendors: VendorItem[];
  bespokeIdeas: BespokeIdea[];
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modifications?: {
    updatedBudget?: BudgetItem[];
    addedTasks?: TimelineTask[];
    updatedVendors?: VendorItem[];
  };
}

