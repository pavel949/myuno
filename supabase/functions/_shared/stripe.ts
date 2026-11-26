/**
 * Shared Stripe client for Edge Functions.
 * Use this module to ensure consistent Stripe SDK versioning across all functions.
 */

import Stripe from "npm:stripe@18.5.0";
import { stripeKeyMode, STRIPE_NOT_CONFIGURED_CODE } from "./stripe-config.ts";

export const STRIPE_API_VERSION = "2025-08-27.basil" as const;

/** Thrown before any Stripe call when the secret key is absent or malformed. */
export class StripeNotConfiguredError extends Error {
  readonly code = STRIPE_NOT_CONFIGURED_CODE;
  constructor() {
    super("Card payments are not configured: STRIPE_SECRET_KEY is missing or invalid");
    this.name = "StripeNotConfiguredError";
  }
}

/** True when a usable secret key is present. Never exposes the key. */
export function isStripeConfigured(): boolean {
  return stripeKeyMode(Deno.env.get("STRIPE_SECRET_KEY")) !== "missing";
}

/**
 * Create a Stripe client with the project's secret key.
 * Fails closed with StripeNotConfiguredError instead of building a client
 * around an empty key that only errors later, after orders were written.
 */
export function createStripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (stripeKeyMode(key) === "missing") throw new StripeNotConfiguredError();
  return new Stripe(key as string, {
    apiVersion: STRIPE_API_VERSION,
  });
}

/** JSON 503 for callers that must stop before writing an order. */
export function stripeNotConfiguredResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Card payments are not configured", code: STRIPE_NOT_CONFIGURED_CODE }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
  );
}

export { Stripe };
export default Stripe;
