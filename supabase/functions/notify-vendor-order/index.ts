/**
 * Customer enquiries are handled centrally by myUNO, not forwarded to suppliers.
 * Keep this legacy webhook target as an explicit no-op until an independently
 * authorized fulfilment handoff exists. Do not read customer records here.
 * This does not claim admin delivery; the original canonical order is unchanged.
 */
import { supplierDispatchSuppressed } from './policy.ts';

Deno.serve(supplierDispatchSuppressed);
