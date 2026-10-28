import { z } from 'zod';

/**
 * Zod validation schema for the Onboarding Wizard Form.
 * Enforces strict string lengths, date boundaries, and realistic ranges.
 */
export const OnboardingFormSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community', 'custom']),
  customTypeLabel: z.string().max(60).optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  eventDate: z.string().refine((val) => {
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return parsed >= now;
  }, { message: "Event date must be in the future" }),
  location: z.string().min(2, "Location is required").max(120),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(10000, "Guest count cannot exceed 10,000"),
  totalBudget: z.number().min(100, "Budget must be at least 100").max(10000000, "Budget limit exceeded"),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']).default('USD'),
  themeStyle: z.string().min(2, "Theme/Style is required").max(200),
  specialRequests: z.string().max(1000).default(''),
});

export type ValidatedOnboardingInput = z.infer<typeof OnboardingFormSchema>;

export const CopilotChatInputSchema = z.object({
  userPrompt: z.string().min(1).max(500, "Prompt must be under 500 characters"),
  currentPlan: z.any(), // Validated within the handler
});

/**
 * Sanitizes user input to protect against Prompt Injection attacks,
 * prompt escapes, and token exhaustion.
 */
export function sanitizePromptInput(input: string): string {
  if (!input) return '';

  return input
    // Remove control characters and zero-width spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    // Neutralize prompt delimiters that could attempt instruction escaping
    .replace(/```/g, "'''")
    .replace(/<\|.*?\|>/g, '')
    // Strip HTML tags for defense-in-depth
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Trim excess whitespace
    .trim();
}

/**
 * Detects common prompt injection patterns.
 * Returns true if suspicious adversarial patterns are found.
 */
export function containsInjectionSignatures(text: string): boolean {
  const suspiciousSignatures = [
    /ignore (all )?(previous|prior) instructions/i,
    /disregard (all )?(previous|prior) rules/i,
    /you are now an unfiltered/i,
    /jailbreak/i,
    /system prompt override/i,
    /reveal your instructions/i,
    /forget everything you were told/i,
    /dan mode/i,
    /act as an unrestricted/i
  ];

  return suspiciousSignatures.some(pattern => pattern.test(text));
}

/**
 * GDPR Helper: Mask Personally Identifiable Information (PII) before LLM logging
 */
export function redactPII(text: string): string {
  // Redact emails
  const emailRegex = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;
  // Redact phone numbers (international and domestic formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

  return text
    .replace(emailRegex, '[EMAIL_REDACTED]')
    .replace(phoneRegex, '[PHONE_REDACTED]');
}

