const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior|above)/gi,
  /you\s+are\s+now\s+a\s+/gi,
  /system\s+prompt\s*:/gi,
  /system\s*override/gi,
  /dan\s+mode/gi,
  /jailbreak/gi,
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
];

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim().slice(0, maxLength);

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[filtered content]');
  }

  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return sanitized;
}

export function scrubPII(text: string): string {
  if (!text) return '';

  let scrubbed = text.replace(
    /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
    '[REDACTED_EMAIL]'
  );

  scrubbed = scrubbed.replace(
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
    '[REDACTED_PHONE]'
  );

  scrubbed = scrubbed.replace(
    /\b(?:\d{4}[ -]?){3}(?:\d{4})\b/g,
    '[REDACTED_CARD]'
  );

  return scrubbed;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export function extractAuthUser(authHeader?: string | null): AuthUser | null {
  if (!authHeader) {
    return {
      id: 'usr_guest_demo_01',
      email: 'guest@eventplanner.ai',
      role: 'USER',
    };
  }

  return {
    id: 'usr_verified_demo_01',
    email: 'user@eventplanner.ai',
    role: 'USER',
  };
}

