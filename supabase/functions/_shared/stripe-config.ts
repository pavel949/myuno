/** Pure Stripe configuration helpers shared by edge functions and their tests. */

export const STRIPE_NOT_CONFIGURED_CODE = "stripe_not_configured" as const;

export type StripeKeyMode = "live" | "test" | "missing";

/** Classify a secret key by its documented prefix without revealing it. */
export function stripeKeyMode(key: string | null | undefined): StripeKeyMode {
  const value = (key ?? "").trim();
  if (/^(sk|rk)_live_\w+/.test(value)) return "live";
  if (/^(sk|rk)_test_\w+/.test(value)) return "test";
  return "missing";
}

export interface StripeConfigStatus {
  secret_key: StripeKeyMode;
  webhook_secret: boolean;
  /** Card checkout can start and its webhook can be verified. */
  ready: boolean;
}

export function stripeConfigStatus(env: (name: string) => string | undefined): StripeConfigStatus {
  const secret_key = stripeKeyMode(env("STRIPE_SECRET_KEY"));
  const webhook_secret = /^whsec_\w+/.test((env("STRIPE_WEBHOOK_SECRET") ?? "").trim());
  return { secret_key, webhook_secret, ready: secret_key !== "missing" && webhook_secret };
}
