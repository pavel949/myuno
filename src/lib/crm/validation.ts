/**
 * @module crm/validation
 * Shared validation for CRM intake (leads + deals). Before this, deal creation
 * (CreateDealSheet) validated name/email/phone by hand while lead creation
 * (UniversalLeadForm) only checked presence — so the same client could be
 * accepted with a malformed phone from one entry point and rejected from another.
 *
 * Reuses the canonical phone helpers in src/lib/phone.ts so "valid phone" means
 * the same thing everywhere (≥7 digits).
 */
import { z } from 'zod';
import { isLikelyPhone } from '@/lib/phone';

/** Pragmatic email check — matches the regex already used in CreateDealSheet. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_RE.test(value.trim());
}

/**
 * Contact fields common to every CRM intake point. `email` is optional but, when
 * present, must be well-formed; `phone` must be a plausible phone number.
 */
export const contactIntakeSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  phone: z.string().trim().refine(isLikelyPhone, 'phone_invalid'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidEmail(v), 'email_invalid'),
});

export type ContactIntakeInput = z.infer<typeof contactIntakeSchema>;

export interface IntakeValidationResult {
  ok: boolean;
  /** field → error code (caller maps to localized copy). */
  errors: Record<string, string>;
}

/** Validate the shared contact fields; returns field→code error map. */
export function validateContactIntake(input: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): IntakeValidationResult {
  const parsed = contactIntakeSchema.safeParse({
    name: input.name ?? '',
    phone: input.phone ?? '',
    email: input.email ?? undefined,
  });
  if (parsed.success) return { ok: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
