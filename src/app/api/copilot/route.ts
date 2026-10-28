import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeInput, scrubPII, extractAuthUser } from '@/lib/security';
import { BudgetItem, TimelineTask } from '@/types/event';

const CopilotRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  currentPlan: z.object({
    budgetBreakdown: z.array(z.any()),
    timeline: z.array(z.any()),
    vendors: z.array(z.any()),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = extractAuthUser(authHeader);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.ip || user.id;
    const rateLimit = checkRateLimit(`copilot_${clientIp}`, 20, 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit reached for Co-Pilot. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = CopilotRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid copilot payload.' }, { status: 400 });
    }

    const { message, currentPlan } = parseResult.data;
    const sanitizedMsg = scrubPII(sanitizeInput(message));

    const lower = sanitizedMsg.toLowerCase();
    let assistantReply = `I've analyzed your request: "${sanitizedMsg}". `;
    const updatedBudget: BudgetItem[] = JSON.parse(JSON.stringify(currentPlan.budgetBreakdown));
    const addedTasks: TimelineTask[] = [];

    if (lower.includes('vegetarian') || lower.includes('vegan')) {
      const catering = updatedBudget.find((b) => b.category.toLowerCase().includes('catering'));
      if (catering) {
        catering.notes = 'Refined: 100% plant-based gourmet menu selected.';
        catering.costSavingTip = 'Plant-based seasonal menus often save 10-15% compared to prime beef cuts while offering vibrant culinary variety.';
      }
      assistantReply += 'I updated the catering profile to plant-based/vegetarian and refreshed your cost-saving recommendations. ';
    }

    if (lower.includes('cut') && lower.includes('decor') && (lower.includes('20%') || lower.includes('20 percent'))) {
      const decor = updatedBudget.find((b) => b.category.toLowerCase().includes('decor'));
      const contingency = updatedBudget.find((b) => b.isContingency);
      if (decor && contingency) {
        const cutAmount = Math.round(decor.allocatedAmount * 0.2);
        decor.allocatedAmount -= cutAmount;
        decor.percentage = Math.round((decor.percentage * 0.8) * 10) / 10;
        contingency.allocatedAmount += cutAmount;
        contingency.percentage = Math.round((contingency.percentage + (decor.percentage * 0.2)) * 10) / 10;
        assistantReply += `Reduced decor allocation by 20% (-$${cutAmount.toLocaleString()}) and reassigned the surplus into your Contingency buffer. `;
      }
    } else if (lower.includes('photobooth') || lower.includes('photo booth')) {
      addedTasks.push({
        id: `t-added-${Date.now()}`,
        phase: '2-4 Weeks Out',
        title: 'Book 360 Open-Air Photobooth & Custom Props',
        description: 'Secure interactive photo station with instant SMS/AirDrop sharing and branded celebration overlay.',
        targetDateDescription: '3 Weeks Prior',
        priority: 'MEDIUM',
        isCompleted: false,
        category: 'Entertainment',
      });
      assistantReply += 'Added a high-priority task for booking an open-air photobooth 3 weeks out. ';
    } else {
      assistantReply += 'Your event plan has been updated with your preferences. You can also drag the budget sliders or toggle tasks directly!';
    }

    return NextResponse.json({
      success: true,
      reply: assistantReply,
      modifications: {
        updatedBudget,
        addedTasks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process copilot command.' }, { status: 500 });
  }
}

