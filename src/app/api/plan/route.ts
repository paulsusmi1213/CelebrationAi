import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeInput, scrubPII, extractAuthUser } from '@/lib/security';
import { generateEventPlan } from '@/lib/ai-engine';
import { EventOnboardingData } from '@/types/event';

const OnboardingSchema = z.object({
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'COMMUNITY', 'CUSTOM']),
  customEventType: z.string().max(100).optional(),
  eventName: z.string().min(2).max(100),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  location: z.string().min(2).max(120),
  guestCount: z.number().int().min(1).max(10000),
  totalBudget: z.number().positive().min(50).max(50000000),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']),
  themePreferences: z.string().max(1000).optional().default(''),
  specialRequests: z.string().max(1000).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const user = extractAuthUser(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication token required.' },
        { status: 401 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.ip || user.id;
    const rateLimit = checkRateLimit(clientIp, 10, 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before generating another plan.',
          resetMs: rateLimit.resetMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await req.json();
    const parseResult = OnboardingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;

    const sanitizedData: EventOnboardingData = {
      ...validatedData,
      themePreferences: scrubPII(sanitizeInput(validatedData.themePreferences)),
      specialRequests: scrubPII(sanitizeInput(validatedData.specialRequests)),
      customEventType: validatedData.customEventType
        ? sanitizeInput(validatedData.customEventType, 100)
        : undefined,
    };

    const plan = await generateEventPlan(sanitizedData);

    return NextResponse.json(
      {
        success: true,
        data: plan,
        rateLimit: {
          remaining: rateLimit.remaining,
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'An internal error occurred while generating your celebration plan.',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

