-- Enable the Thai Business / Local Services layer for production (GA 2026-06-24).
-- The whole vertical (B2B self-serve dashboard, B2C catalogue, per-business
-- landings at /ts/:slug, chat + bookings) was shipped behind
-- `feature_flag:thai_business_layer` (default OFF) and is now switched ON.
--
-- Note: the runtime gate (`useFeatureFlag('THAI_BUSINESS_LAYER')`) treats this
-- DB row as a kill-switch on top of the hardcoded default in
-- src/lib/featureFlags.ts. Both must be ON for the layer to be visible; the
-- code default was flipped to enabled in the same change. Setting this row back
-- to {"enabled": false} force-disables the module without a redeploy.
--
-- Idempotent; uses the canonical `feature_flag:<name>` key shape so the existing
-- useFeatureFlag hook picks it up without code changes.
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'feature_flag:thai_business_layer',
  '{"enabled": true}'::jsonb,
  'Thai Business / Local Services layer GA on 2026-06-24'
)
ON CONFLICT (key) DO UPDATE
SET value       = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at  = now();
