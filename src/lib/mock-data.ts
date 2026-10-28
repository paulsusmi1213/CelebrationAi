import { EventOnboardingData, GeneratedEventPlan, BudgetItem, TimelineTask, VendorItem, BespokeIdea } from '../types/event';

export function generateRealisticMockPlan(data: EventOnboardingData): GeneratedEventPlan {
  const total = Number(data.totalBudget) || 10000;
  const currency = data.currency || 'USD';
  const guests = Number(data.guestCount) || 50;
  const eventDate = new Date(data.eventDate);
  const now = new Date();
  const diffDays = Math.max(1, Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const diffMonths = Math.max(1, Math.round(diffDays / 30));

  const isWedding = data.eventType === 'WEDDING';
  const isBirthday = data.eventType === 'BIRTHDAY';
  const isCommunity = data.eventType === 'COMMUNITY';

  let venuePct = isWedding ? 30 : isCommunity ? 25 : 20;
  let cateringPct = isWedding ? 30 : isBirthday ? 35 : 30;
  let decorPct = isWedding ? 15 : isBirthday ? 15 : 15;
  let entertainmentPct = isWedding ? 10 : isBirthday ? 15 : 15;
  let miscPct = 5;
  let contingencyPct = 10;

  const totalPct = venuePct + cateringPct + decorPct + entertainmentPct + miscPct + contingencyPct;
  if (totalPct !== 100) {
    miscPct += (100 - totalPct);
  }

  const budgetBreakdown: BudgetItem[] = [
    {
      id: 'b-venue',
      category: 'Venue & Facilities',
      percentage: venuePct,
      allocatedAmount: Math.round((total * venuePct) / 100),
      actualSpent: 0,
      costSavingTip: 'Inquire if booking an off-peak day (Friday or Sunday) or morning/afternoon slot unlocks a 15-25% rental discount.',
      isContingency: false,
    },
    {
      id: 'b-catering',
      category: 'Catering & Beverages',
      percentage: cateringPct,
      allocatedAmount: Math.round((total * cateringPct) / 100),
      actualSpent: 0,
      costSavingTip: `With ${guests} guests, opting for buffet-style or chef-station service instead of plated dining saves roughly 20% on staffing fees.`,
      isContingency: false,
    },
    {
      id: 'b-decor',
      category: 'Decor & Florals',
      percentage: decorPct,
      allocatedAmount: Math.round((total * decorPct) / 100),
      actualSpent: 0,
      costSavingTip: 'Repurpose ceremony/welcome floral arrangements into reception centerpieces and cocktail table accents.',
      isContingency: false,
    },
    {
      id: 'b-entertainment',
      category: 'Entertainment & Audio/Visual',
      percentage: entertainmentPct,
      allocatedAmount: Math.round((total * entertainmentPct) / 100),
      actualSpent: 0,
      costSavingTip: 'Bundle MC and DJ services into a single sound-and-lighting contract to eliminate split travel and gear rental charges.',
      isContingency: false,
    },
    {
      id: 'b-misc',
      category: 'Miscellaneous & Logistics',
      percentage: miscPct,
      allocatedAmount: Math.round((total * miscPct) / 100),
      actualSpent: 0,
      costSavingTip: 'Use digital RSVPs and custom QR invitations to cut down on physical stationery, printing, and postage expenses.',
      isContingency: false,
    },
    {
      id: 'b-contingency',
      category: 'Contingency Reserve (10%)',
      percentage: contingencyPct,
      allocatedAmount: Math.round((total * contingencyPct) / 100),
      actualSpent: 0,
      costSavingTip: 'Keep this untouched until 14 days before the event. It buffers against last-minute overtime fees, weather accommodations, or guest count shifts.',
      isContingency: true,
    },
  ];

  const timeline: TimelineTask[] = [
    {
      id: 't-1',
      phase: diffMonths >= 6 ? '6+ Months Out' : '3-5 Months Out',
      title: 'Lock In Primary Venue & Date Confirmation',
      description: `Reserve location in ${data.location}. Confirm maximum legal capacity for ${guests} attendees, curfew rules, and liquor licensing.`,
      targetDateDescription: diffMonths >= 6 ? '6 Months Prior' : 'Immediate / Urgent',
      priority: 'HIGH',
      isCompleted: false,
      category: 'Venue',
    },
    {
      id: 't-2',
      phase: diffMonths >= 3 ? '3-5 Months Out' : '1-2 Months Out',
      title: 'Tasting Session & Finalize Caterer Contract',
      description: `Review dietary requests (${data.specialRequests || 'general preferences'}). Lock down menu, beverage package, and cleanup clauses.`,
      targetDateDescription: '3-4 Months Prior',
      priority: 'HIGH',
      isCompleted: false,
      category: 'Catering',
    },
    {
      id: 't-3',
      phase: '1-2 Months Out',
      title: 'Send Official Invitations & RSVP Portal Launch',
      description: `Disclose parking, dress code themed around "${data.themePreferences || 'Celebration Style'}", and dietary questionnaire.`,
      targetDateDescription: '6-8 Weeks Prior',
      priority: 'MEDIUM',
      isCompleted: false,
      category: 'Guest Management',
    },
    {
      id: 't-4',
      phase: '2-4 Weeks Out',
      title: 'Confirm Final Headcount & Seating Chart',
      description: 'Submit guaranteed meal counts to caterer and verify rental furniture deliveries.',
      targetDateDescription: '2 Weeks Prior',
      priority: 'HIGH',
      isCompleted: false,
      category: 'Logistics',
    },
    {
      id: 't-5',
      phase: '1 Week Out',
      title: 'Final Vendor Walkthrough & Master Run of Show',
      description: 'Distribute minute-by-minute contact sheet and itinerary to venue coordinator, DJ, and key family/committee members.',
      targetDateDescription: '7 Days Prior',
      priority: 'HIGH',
      isCompleted: false,
      category: 'Coordination',
    },
    {
      id: 't-6',
      phase: 'Day-of',
      title: 'Day-Of Execution & Vendor Arrival Check-in',
      description: 'Oversee setup load-in, AV soundcheck, emergency kit staging, and enjoy the celebration stress-free.',
      targetDateDescription: 'Event Morning',
      priority: 'CRITICAL',
      isCompleted: false,
      category: 'Execution',
    },
  ];

  const vendors: VendorItem[] = [
    {
      id: 'v-venue',
      vendorType: 'Venue Coordinator / Manager',
      priority: 'CRITICAL',
      status: 'PENDING',
      estimatedCost: Math.round((total * venuePct) / 100),
      questionsToAsk: [
        'What is your exact policy on outside caterers or AV production?',
        'What time does vendor access open and what is the sound curfew?',
        'Is there a designated weather backup space in case of rain?',
        'Are security and janitorial staff included in the baseline rental price?'
      ],
      contractWatchouts: [
        'Check for mandatory service fees (18-24%) added on top of the base quote.',
        'Review the force majeure and cancellation refund conditions in detail.'
      ]
    },
    {
      id: 'v-caterer',
      vendorType: 'Caterer & Beverage Service',
      priority: 'CRITICAL',
      status: 'PENDING',
      estimatedCost: Math.round((total * cateringPct) / 100),
      questionsToAsk: [
        'How do you accommodate dietary restrictions and severe allergies safely?',
        'Do you provide staff for bussing, cleanup, and trash haul-away?',
        'Can we provide our own alcohol, and is there a corkage fee?',
        'What is the cutoff date for final headcount adjustment?'
      ],
      contractWatchouts: [
        'Look out for cake-cutting fees, glassware rental add-ons, or overtime billing per server hour.'
      ]
    },
    {
      id: 'v-media',
      vendorType: 'Photographer / Videographer',
      priority: 'HIGH',
      status: 'PENDING',
      estimatedCost: Math.round(total * 0.12),
      questionsToAsk: [
        'Have you shot events at this venue before with comparable lighting?',
        'What is the turnaround time for the preview gallery versus the full high-res catalog?',
        'Do you have backup cameras, lenses, and redundant memory card recording?'
      ],
      contractWatchouts: [
        'Ensure the contract grants full non-commercial printing and digital distribution rights without watermarks.'
      ]
    },
    {
      id: 'v-av',
      vendorType: 'DJ / Live Music & Audio Engineer',
      priority: 'HIGH',
      status: 'PENDING',
      estimatedCost: Math.round((total * entertainmentPct) / 100),
      questionsToAsk: [
        'Do you supply wireless handheld lapel mics for toasts and speeches?',
        'How do you manage song request lists and "do-not-play" blacklists?',
        'What power requirements does your audio/lighting rig require?'
      ],
      contractWatchouts: [
        'Verify backup gear availability on site in the event of hardware or laptop failure.'
      ]
    }
  ];

  const bespokeIdeas: BespokeIdea[] = [
    {
      id: 'idea-1',
      title: 'Interactive Audio Guestbook & Memory Lounge',
      category: 'Activity & Flow',
      description: 'Replace traditional paper sign-in books with a vintage rotary telephone recording station where guests leave spontaneous voice messages and warm wishes.',
      estimatedCostImpact: 'Low ($)',
    },
    {
      id: 'idea-2',
      title: 'Curated Signature Mocktail/Cocktail Tasting Flights',
      category: 'Food & Beverage',
      description: `Design two customized signature drinks named after personal milestones or local traditions in ${data.location}, accompanied by artisanal garnish skewers.`,
      estimatedCostImpact: 'Moderate ($$)',
    },
    {
      id: 'idea-3',
      title: 'Atmospheric Lighting & Ambient Projection Canopy',
      category: 'Decor & Aesthetics',
      description: `Transform the space with warm amber uplighting and cascading fairy lights or monogram gobos aligned with ${data.themePreferences || 'your aesthetic'}.`,
      estimatedCostImpact: 'Moderate ($$)',
    },
    {
      id: 'idea-4',
      title: 'Live Acoustic Sunset Interlude',
      category: 'Theme & Vibe',
      description: 'Transition guests between the main program and evening reception with an acoustic solo guitarist or saxophonist playing modern downtempo covers.',
      estimatedCostImpact: 'Moderate ($$)',
    },
    {
      id: 'idea-5',
      title: 'Community Giveback / Eco-Conscious Keepsake Station',
      category: 'Community Impact',
      description: 'Provide guests with personalized seed paper favors or succulent cuttings that double as table place cards, reducing paper waste completely.',
      estimatedCostImpact: 'Low ($)',
    },
  ];

  return {
    planSummary: `Custom ${data.eventType.toLowerCase()} plan for "${data.eventName || 'Your Celebration'}" in ${data.location} on ${data.eventDate}. Engineered for ${guests} guests within a total budget of ${currency} ${total.toLocaleString()}. A mandatory 10% contingency (${currency} ${Math.round(total * 0.1).toLocaleString()}) is reserved to absorb unexpected costs.`,
    budgetBreakdown,
    timeline,
    vendors,
    bespokeIdeas,
  };
}

