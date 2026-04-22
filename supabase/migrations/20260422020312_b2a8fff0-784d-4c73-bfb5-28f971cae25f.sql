ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS guest_extra_fees jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.guest_extra_fees IS
  'Host-configurable extra fees the guest pays separately (electricity, water, internet, cleaning, etc). Array of objects: { id, kind, label_en, label_ru, unit, rate, currency, estimate_min, estimate_max, when_paid, notes }';