import { NextRequest, NextResponse } from 'next/server';
import { OnboardingFormSchema, containsInjectionSignatures } from '@/lib/security/sanitizer';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { generateEventPlanWithAI } from '@/lib/ai/gemini-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Rate Limit Security Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimit = await checkRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a minute before generating another plan.',
          retryAfter: rateLimit.reset 
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.reset) } }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json();
    const validationResult = OnboardingFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 3. Prompt Injection Defense
    if (
      containsInjectionSignatures(validatedData.specialRequests) ||
      containsInjectionSignatures(validatedData.themeStyle) ||
      containsInjectionSignatures(validatedData.title)
    ) {
      return NextResponse.json(
        { error: 'Security warning: Input contains prohibited prompt injection patterns.' },
        { status: 422 }
      );
    }

    // 4. Check if client accepts Server-Sent Events (SSE) for streaming progress
    const acceptsSSE = req.headers.get('accept')?.includes('text/event-stream');

    if (acceptsSSE) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };

          try {
            sendEvent('progress', { stage: 'init', message: 'Analyzing date parameters & location feasibility...' });
            await new Promise(r => setTimeout(r, 400));

            sendEvent('progress', { stage: 'budget', message: 'Calculating zero-sum budget with locked 10% emergency contingency...' });
            await new Promise(r => setTimeout(r, 400));

            sendEvent('progress', { stage: 'timeline', message: 'Synthesizing backwards-planning timeline milestones...' });
            
            // Execute generation
            const plan = await generateEventPlanWithAI(validatedData);

            sendEvent('progress', { stage: 'vendors', message: 'Assembling contract risk checklists and tailored ideas...' });
            await new Promise(r => setTimeout(r, 300));

            sendEvent('complete', plan);
            controller.close();
          } catch (err: any) {
            sendEvent('error', { message: err?.message || 'Plan generation failed' });
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        }
      });
    }

    // Standard synchronous JSON response fallback
    const plan = await generateEventPlanWithAI(validatedData);
    return NextResponse.json(plan, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/plan/generate:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during event plan generation' },
      { status: 500 }
    );
  }
}

