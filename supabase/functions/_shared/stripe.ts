/**
 * Shared Stripe client for Edge Functions.
 * Use this module to ensure consistent Stripe SDK versioning across all functions.
 */

import Stripe from "npm:stripe@18.5.0";

export const STRIPE_API_VERSION = "2025-08-27.basil" as const;

/**
 * Create a Stripe client with the project's secret key.
 */
export function createStripeClient() {
  return new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: STRIPE_API_VERSION,
  });
}

export { Stripe };
export default Stripe;
