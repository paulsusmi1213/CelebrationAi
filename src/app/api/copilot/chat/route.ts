import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { containsInjectionSignatures } from '@/lib/security/sanitizer';
import { chatWithEventCopilot } from '@/lib/ai/gemini-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please pause before your next request.', retryAfter: rateLimit.reset },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { currentPlan, userPrompt } = body;

    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: 'Valid user prompt is required' }, { status: 400 });
    }

    if (!currentPlan) {
      return NextResponse.json({ error: 'Current plan context is missing' }, { status: 400 });
    }

    if (containsInjectionSignatures(userPrompt)) {
      return NextResponse.json({
        replyMessage: "I cannot fulfill prompt injection requests. Let me know how I can adjust your budget, timeline, or vendor plans!"
      }, { status: 200 });
    }

    const copilotResult = await chatWithEventCopilot(currentPlan, userPrompt);
    return NextResponse.json(copilotResult, { status: 200 });

  } catch (error: any) {
    console.error('Copilot Chat Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while consulting the AI Event Co-Pilot' },
      { status: 500 }
    );
  }
}

