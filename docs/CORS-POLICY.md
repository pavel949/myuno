# CORS policy (Edge Functions)

## Current behavior

`supabase/functions/_shared/cors.ts` resolves allowed `Origin` from a **whitelist**. If the request `Origin` header is not in the list, the implementation may fall back to a **default** app origin (see code comments there).

## Guidelines

1. **Read-only / public GET** endpoints may keep permissive behavior where product requires it.
2. **Mutations, payments, webhooks** — prefer **rejecting** unknown `Origin` or validating `INTERNAL_SECRET` / JWT without relying on browser CORS alone.
3. When changing the whitelist, update **Supabase** allowed redirect URLs for Auth if needed.

## Review

Revisit this policy when enabling first production transactions (Phase C roadmap).
