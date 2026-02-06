
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS age_policy text DEFAULT 'all_ages',
ADD COLUMN IF NOT EXISTS dress_code text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS ticket_url text,
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_redirect',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lifeos_context text DEFAULT 'entertainment',
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS organizer_type text DEFAULT 'venue',
ADD COLUMN IF NOT EXISTS ends_at timestamptz,
ADD COLUMN IF NOT EXISTS starts_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug) WHERE slug IS NOT NULL;
