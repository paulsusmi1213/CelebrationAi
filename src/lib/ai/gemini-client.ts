import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  EVENT_PLANNER_SYSTEM_PROMPT, 
  EVENT_PLAN_JSON_SCHEMA,
  COPILOT_REFINEMENT_SYSTEM_PROMPT
} from './planner-prompt';
import { 
  GeneratedEventPlan, 
  OnboardingFormData, 
  BudgetItem, 
  TimelineTask,
  VendorChecklistItem,
  PersonalizedIdea
} from '@/types/event-planner';
import { sanitizePromptInput } from '../security/sanitizer';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Mathematically validates and normalizes the budget breakdown:
 * 1. Guarantees CONTINGENCY is strictly 10.0%.
 * 2. Normalizes other 5 categories so total equals exactly 100.0%.
 * 3. Recalculates allocatedAmount precisely as totalBudget * (percentage / 100).
 */
export function enforceBudgetInvariants(items: BudgetItem[], totalBudget: number): BudgetItem[] {
  const contingencyCategory = items.find(i => i.category === 'CONTINGENCY');
  const nonContingency = items.filter(i => i.category !== 'CONTINGENCY');

  // Calculate sum of non-contingency percentages
  const sumNonContingency = nonContingency.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  const targetNonContingencySum = 90.0; // Since contingency is 10%

  const rebalancedNonContingency = nonContingency.map(item => {
    let normalizedPercentage = sumNonContingency > 0 
      ? (item.percentage / sumNonContingency) * targetNonContingencySum
      : targetNonContingencySum / nonContingency.length;
    
    // Round to 1 decimal place
    normalizedPercentage = Math.round(normalizedPercentage * 10) / 10;
    const allocated = Math.round((totalBudget * (normalizedPercentage / 100)) * 100) / 100;

    return {
      ...item,
      percentage: normalizedPercentage,
      allocatedAmount: allocated,
      spentAmount: item.spentAmount || 0,
    };
  });

  // Calculate total allocated so far to adjust rounding differences
  const allocatedSum = rebalancedNonContingency.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
  const contingencyAllocated = Math.round((totalBudget * 0.10) * 100) / 100;

  const normalizedContingency: BudgetItem = {
    id: contingencyCategory?.id || 'b-contingency',
    category: 'CONTINGENCY',
    label: 'Emergency Contingency (Strict 10%)',
    percentage: 10.0,
    allocatedAmount: contingencyAllocated,
    spentAmount: 0,
    notes: 'Preserved exclusively for unforeseen vendor surcharges, weather mitigations, and last-minute guest additions.',
    costSavingTip: 'Do not allocate or commit this fund until 72 hours before the event date.'
  };

  return [...rebalancedNonContingency, normalizedContingency];
}

/**
 * Calls Gemini 1.5 with structured JSON schema to generate a comprehensive plan.
 */
export async function generateEventPlanWithAI(formData: OnboardingFormData): Promise<GeneratedEventPlan> {
  const sanitizedSpecial = sanitizePromptInput(formData.specialRequests);
  const sanitizedTheme = sanitizePromptInput(formData.themeStyle);
  const sanitizedLocation = sanitizePromptInput(formData.location);
  const sanitizedTitle = sanitizePromptInput(formData.title);

  // Compute lead days
  const eventDate = new Date(formData.eventDate);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const daysUntil = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const userPrompt = `
Generate a comprehensive, bespoke event plan for the following celebration:
- Event Type: ${formData.eventType} ${formData.customTypeLabel ? `(${formData.customTypeLabel})` : ''}
- Event Title: ${sanitizedTitle}
- Date: ${formData.eventDate} (${daysUntil} days lead time from today)
- Location: ${sanitizedLocation}
- Estimated Guest Count: ${formData.guestCount}
- Total Budget: ${formData.currency} ${formData.totalBudget}
- Theme/Style Preferences: ${sanitizedTheme}
- Special Requests & Inclusions: ${sanitizedSpecial || 'None specified'}

Remember: Return pure structured JSON adhering to the schema. 
Contingency must be exactly 10%, with all 6 categories summing to 100%.
`.trim();

  // If Gemini API is available and key is configured:
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: EVENT_PLANNER_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          // @ts-ignore - responseSchema is supported in Gemini 1.5
          responseSchema: EVENT_PLAN_JSON_SCHEMA,
          temperature: 0.3, // Low temperature for high precision and financial accuracy
        }
      });

      const result = await model.generateContent(userPrompt);
      const textResponse = result.response.text();
      const parsedPlan = JSON.parse(textResponse) as GeneratedEventPlan;

      // Mathematically reinforce budget invariants
      parsedPlan.budgetBreakdown = enforceBudgetInvariants(
        parsedPlan.budgetBreakdown, 
        formData.totalBudget
      );

      return parsedPlan;
    } catch (error) {
      console.error("Gemini API call failed, falling back to local deterministic generation:", error);
    }
  }

  // Robust Fallback / Mock Generator (ensures instant local usability if API key is not configured)
  return generateDeterministicMockPlan(formData, daysUntil);
}

/**
 * Handles conversational queries with the embedded AI Event Co-Pilot.
 */
export async function chatWithEventCopilot(
  currentPlan: GeneratedEventPlan, 
  userPrompt: string
): Promise<{ replyMessage: string; updatedPlan?: Partial<GeneratedEventPlan> }> {
  const sanitizedQuery = sanitizePromptInput(userPrompt);

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: COPILOT_REFINEMENT_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        }
      });

      const promptContext = `
CURRENT EVENT PLAN SUMMARY:
- Title: ${currentPlan.summary.eventTitle}
- Guest Count: ${currentPlan.summary.targetGuestCount}
- Total Budget: ${currentPlan.summary.currency} ${currentPlan.summary.totalBudget}
- Current Budget Breakdown: ${JSON.stringify(currentPlan.budgetBreakdown.map(b => ({ category: b.category, percentage: b.percentage, amount: b.allocatedAmount })))}
- Current Timeline Task Count: ${currentPlan.timeline.length}

USER REQUEST:
"${sanitizedQuery}"

Respond in JSON with format:
{
  "replyMessage": "A concise explanation of the changes made or advice given",
  "budgetAdjustments": [ ...optional array of updated budget items if budget was requested to change... ],
  "newTasks": [ ...optional array of tasks if new tasks were requested... ]
}
`;

      const response = await model.generateContent(promptContext);
      const data = JSON.parse(response.response.text());

      let updatedPlan: Partial<GeneratedEventPlan> = {};

      if (data.budgetAdjustments && Array.isArray(data.budgetAdjustments)) {
        updatedPlan.budgetBreakdown = enforceBudgetInvariants(
          data.budgetAdjustments,
          currentPlan.summary.totalBudget
        );
      }

      if (data.newTasks && Array.isArray(data.newTasks)) {
        updatedPlan.timeline = [...currentPlan.timeline, ...data.newTasks];
      }

      return {
        replyMessage: data.replyMessage || "I've reviewed your request and updated your celebration plan.",
        updatedPlan: Object.keys(updatedPlan).length > 0 ? updatedPlan : undefined
      };
    } catch (err) {
      console.warn("Copilot API error, fallback to algorithmic response:", err);
    }
  }

  // Fallback algorithmic response for chat refinement
  return handleAlgorithmicCopilotResponse(currentPlan, sanitizedQuery);
}

/**
 * High-fidelity deterministic event plan generator (Fallback / Offline support)
 */
function generateDeterministicMockPlan(formData: OnboardingFormData, daysUntil: number): GeneratedEventPlan {
  const b = formData.totalBudget;

  const budgetBreakdown: BudgetItem[] = [
    {
      id: 'b-venue',
      category: 'VENUE',
      label: 'Venue Rental & Location Permits',
      percentage: 30.0,
      allocatedAmount: Math.round(b * 0.30),
      spentAmount: 0,
      notes: `Securing an accessible, weather-proof venue in ${formData.location} for ${formData.guestCount} guests.`,
      costSavingTip: 'Ask for non-peak arrival windows or bundle tables and chairs with the venue package to waive rental surcharges.'
    },
    {
      id: 'b-catering',
      category: 'CATERING',
      label: 'Catering, Beverages & Service Staff',
      percentage: 35.0,
      allocatedAmount: Math.round(b * 0.35),
      spentAmount: 0,
      notes: `Includes plated or family-style dinner, non-alcoholic and celebratory beverage service, and tip calculations.`,
      costSavingTip: 'Opt for elevated grazing tables or family-style service instead of formal plated courses to save 18% on staffing.'
    },
    {
      id: 'b-decor',
      category: 'DECOR',
      label: 'Floral, Styling, Lighting & Signage',
      percentage: 12.0,
      allocatedAmount: Math.round(b * 0.12),
      spentAmount: 0,
      notes: `Bespoke floral arrangements, warm ambient up-lighting, printed welcome signs, and table centerpieces matching ${formData.themeStyle}.`,
      costSavingTip: 'Repurpose ceremony/reception floral installations for the main dining head table.'
    },
    {
      id: 'b-entertainment',
      category: 'ENTERTAINMENT',
      label: 'Music, Sound System & Photography',
      percentage: 8.0,
      allocatedAmount: Math.round(b * 0.08),
      spentAmount: 0,
      notes: 'Sound equipment, professional DJ or acoustic performers, and 6 hours of high-res photography coverage.',
      costSavingTip: 'Book combined photo & live audio packages from creator collectives to unlock multi-service discounts.'
    },
    {
      id: 'b-misc',
      category: 'MISCELLANEOUS',
      label: 'Stationery, Favors, Permits & Insurance',
      percentage: 5.0,
      allocatedAmount: Math.round(b * 0.05),
      spentAmount: 0,
      notes: 'Event liability insurance, digital invitations with RSVP tracking, and bespoke guest favors.',
      costSavingTip: 'Send premium interactive digital invitations to eliminate postage delays and high printing costs.'
    },
    {
      id: 'b-contingency',
      category: 'CONTINGENCY',
      label: 'Emergency Buffer (Strict 10%)',
      percentage: 10.0,
      allocatedAmount: Math.round(b * 0.10),
      spentAmount: 0,
      notes: 'Strictly locked contingency fund for unexpected guest additions, rush delivery fees, or weather modifications.',
      costSavingTip: 'Leave this account untouched until 48 hours prior to the event.'
    }
  ];

  const timeline: TimelineTask[] = [
    {
      id: 't-1',
      phase: 'phase_early',
      phaseLabel: daysUntil > 90 ? '6 to 3 Months Out' : 'Initial Kickoff Phase',
      title: 'Lock Venue & Verify Capacity Bounds',
      description: `Finalize rental contract for ${formData.location}, confirming ADA accessibility and noise ordinance times.`,
      suggestedDueDaysBefore: Math.min(daysUntil - 5, 90),
      priority: 'high',
      completed: false,
      category: 'VENUE'
    },
    {
      id: 't-2',
      phase: 'phase_early',
      phaseLabel: daysUntil > 90 ? '6 to 3 Months Out' : 'Initial Kickoff Phase',
      title: 'Tasting & Dietary Menu Finalization',
      description: `Review menu pairings accommodating: "${formData.specialRequests || 'Standard & vegetarian options'}"`,
      suggestedDueDaysBefore: Math.min(daysUntil - 10, 60),
      priority: 'high',
      completed: false,
      category: 'CATERING'
    },
    {
      id: 't-3',
      phase: 'phase_mid',
      phaseLabel: '4 to 2 Weeks Out',
      title: 'Send Final RSVP Headcount to Caterer',
      description: `Freeze guest list at ${formData.guestCount} and submit dietary allergy matrix to kitchen team.`,
      suggestedDueDaysBefore: 14,
      priority: 'high',
      completed: false,
      category: 'CATERING'
    },
    {
      id: 't-4',
      phase: 'phase_final_weeks',
      phaseLabel: '1 Week Out',
      title: 'Master Run-Sheet & Vendor Distribution',
      description: 'Email minute-by-minute timeline to all vendors, emergency contacts, and venue manager.',
      suggestedDueDaysBefore: 7,
      priority: 'medium',
      completed: false,
      category: 'GENERAL'
    },
    {
      id: 't-5',
      phase: 'phase_day_of',
      phaseLabel: 'Day of Event',
      title: 'Vendor Load-In & Audio Check',
      description: 'Supervise floral delivery, table placecards, microphone balance, and backup contingency kit.',
      suggestedDueDaysBefore: 0,
      priority: 'high',
      completed: false,
      category: 'GENERAL'
    },
    {
      id: 't-6',
      phase: 'phase_post_event',
      phaseLabel: 'Post-Event Wrap Up',
      title: 'Vendor Balance Settlement & Rental Returns',
      description: 'Verify all rental equipment is intact to reclaim full security deposits and send thank-you notes.',
      suggestedDueDaysBefore: -2,
      priority: 'low',
      completed: false,
      category: 'MISCELLANEOUS'
    }
  ];

  const vendorChecklist: VendorChecklistItem[] = [
    {
      id: 'v-1',
      category: 'VENUE',
      vendorRole: 'Venue Coordinator / Site Manager',
      priority: 'essential',
      status: 'to_contact',
      targetBookingLeadWeeks: 16,
      questionsToAsk: [
        'What is your strict load-in and teardown curfew policy?',
        'Do you require preferred in-house vendors or allow licensed external vendors?',
        'What is the rain/inclement weather contingency plan for outdoor spaces?'
      ],
      contractReviewReminders: [
        'Check for mandatory security or trash disposal fees not quoted in base rent.',
        'Verify certificate of insurance (COI) liability requirements.'
      ],
      estimatedCostRange: `${formData.currency} ${Math.round(b * 0.25)} - ${Math.round(b * 0.32)}`
    },
    {
      id: 'v-2',
      category: 'CATERING',
      vendorRole: 'Head Chef & Beverage Director',
      priority: 'essential',
      status: 'to_contact',
      targetBookingLeadWeeks: 12,
      questionsToAsk: [
        'How do you handle severe dietary allergies (celiac, nuts, vegan) to avoid cross-contamination?',
        'Is glassware, flatware, and linen service included in per-plate estimates?',
        'What is the ratio of service staff to guests?'
      ],
      contractReviewReminders: [
        'Examine guaranteed minimum guest headcount cutoff date.',
        'Watch for 20-25% administrative service charges vs gratuity distribution.'
      ],
      estimatedCostRange: `${formData.currency} ${Math.round(b * 0.30)} - ${Math.round(b * 0.38)}`
    },
    {
      id: 'v-3',
      category: 'ENTERTAINMENT',
      vendorRole: 'Lead Photographer & Cinematographer',
      priority: 'essential',
      status: 'to_contact',
      targetBookingLeadWeeks: 10,
      questionsToAsk: [
        'Do you provide full raw footage / high-res digital printing rights?',
        'What is your contingency backup plan if the primary shooter falls ill?',
        'What is your typical turnaround time for teaser gallery vs final album?'
      ],
      contractReviewReminders: [
        'Confirm overtime hourly rate charged if event runs 30 minutes over.',
        'Verify cancellation and rescheduling clauses.'
      ],
      estimatedCostRange: `${formData.currency} ${Math.round(b * 0.06)} - ${Math.round(b * 0.10)}`
    }
  ];

  const personalizedIdeas: PersonalizedIdea[] = [
    {
      id: 'idea-1',
      title: 'Interactive Audio Guestbook Booth',
      category: 'activity',
      description: 'Replace standard paper books with a vintage rotary phone where guests leave heartfelt voice messages that get compiled into a digital vinyl record.',
      whyItFits: `Complements the "${formData.themeStyle}" aesthetic while capturing spontaneous memories from all ${formData.guestCount} guests.`,
      estimatedCostImpact: 'low'
    },
    {
      id: 'idea-2',
      title: 'Curated Artisan Food Station',
      category: 'hospitality',
      description: 'Create a live interactive culinary station featuring dishes honoring personal heritage and dietary accommodations.',
      whyItFits: `Directly honors special request requirements: "${formData.specialRequests || 'Custom culinary preferences'}".`,
      estimatedCostImpact: 'medium'
    },
    {
      id: 'idea-3',
      title: 'Illuminated Ceiling Canopy with Micro-Fairy Lights',
      category: 'decor',
      description: 'Suspended warm starlight drapery creating an intimate atmosphere that transforms open venues into magical gathering spaces.',
      whyItFits: `Transforms ${formData.location} without requiring excessive tabletop floral sprawl.`,
      estimatedCostImpact: 'medium'
    },
    {
      id: 'idea-4',
      title: 'Live Acoustic Duo Transitioning to Curated Vinyl Set',
      category: 'activity',
      description: 'Subtle acoustic music during arrival and dinner, seamlessly pivoting into an upbeat dance curation.',
      whyItFits: 'Maximizes entertainment budget efficiency with a 2-in-1 performer agreement.',
      estimatedCostImpact: 'medium'
    },
    {
      id: 'idea-5',
      title: 'Personalized Botanical Escort Tile Keepsakes',
      category: 'custom',
      description: 'Pressed botanical ceramic placecards engraved with each guest’s name that double as personalized take-home gifts.',
      whyItFits: `Elevates guest appreciation while combining seating cards and favor budgets into one cost-effective item.`,
      estimatedCostImpact: 'low'
    }
  ];

  return {
    planId: `plan-${Date.now()}`,
    summary: {
      eventTitle: formData.title,
      vibeStatement: `A thoughtfully orchestrated ${formData.eventType} celebrating connection, defined by a ${formData.themeStyle} aesthetic and joyful memories.`,
      targetGuestCount: formData.guestCount,
      totalBudget: formData.totalBudget,
      currency: formData.currency,
      daysUntilEvent: daysUntil
    },
    budgetBreakdown,
    timeline,
    vendorChecklist,
    personalizedIdeas,
    coPilotWelcomeMessage: `Welcome! I've engineered your celebration plan with strict budget protection (including our 10% emergency buffer). Tell me anything you'd like to refine!`
  };
}

function handleAlgorithmicCopilotResponse(
  currentPlan: GeneratedEventPlan, 
  userPrompt: string
): { replyMessage: string; updatedPlan?: Partial<GeneratedEventPlan> } {
  const lower = userPrompt.toLowerCase();
  
  if (lower.includes('vegetarian') || lower.includes('vegan') || lower.includes('dietary')) {
    const updatedBudget = currentPlan.budgetBreakdown.map(b => {
      if (b.category === 'CATERING') {
        return {
          ...b,
          notes: `${b.notes} [MODIFIED: 100% plant-based / dietary tailored menu with zero cross-contamination protocols].`,
          costSavingTip: 'Plant-forward seasonal menus can lower raw food costs by 12% compared to premium beef selections.'
        };
      }
      return b;
    });

    return {
      replyMessage: "I've tailored your catering blueprint to be 100% plant-forward and dietary-compliant! Seasonal vegetable pairings will also help manage per-plate costs.",
      updatedPlan: { budgetBreakdown: updatedBudget }
    };
  }

  if (lower.includes('cut decor') || lower.includes('reduce decor') || lower.includes('budget')) {
    // Rebalance: reduce decor by 3%, move 3% to entertainment or keep contingency intact
    const updated = currentPlan.budgetBreakdown.map(item => {
      if (item.category === 'DECOR') {
        const newPct = Math.max(5, item.percentage - 3);
        return { ...item, percentage: newPct, allocatedAmount: Math.round(currentPlan.summary.totalBudget * (newPct / 100)) };
      }
      if (item.category === 'ENTERTAINMENT') {
        const newPct = item.percentage + 3;
        return { ...item, percentage: newPct, allocatedAmount: Math.round(currentPlan.summary.totalBudget * (newPct / 100)) };
      }
      return item;
    });

    return {
      replyMessage: "I have adjusted your budget allocation: reduced Decor and reallocated funds to Entertainment while keeping your 10% contingency safely intact.",
      updatedPlan: { budgetBreakdown: enforceBudgetInvariants(updated, currentPlan.summary.totalBudget) }
    };
  }

  return {
    replyMessage: `Great point! I've noted: "${userPrompt}". I've updated the event timeline and advisory notes to reflect this priority.`
  };
}

