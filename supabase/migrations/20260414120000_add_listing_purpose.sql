-- Add listing_purpose to property_projects
-- Distinguishes project intent: offplan sale, investment/crowdfunding, or completed reference
ALTER TABLE property_projects
  ADD COLUMN IF NOT EXISTS listing_purpose TEXT DEFAULT 'offplan'
  CONSTRAINT chk_listing_purpose CHECK (listing_purpose IN ('offplan', 'investment', 'completed'));

-- Backfill based on existing data
UPDATE property_projects SET listing_purpose = 'investment' WHERE investment_enabled = true;
UPDATE property_projects SET listing_purpose = 'completed' WHERE project_status = 'completed';

-- Index for filtering by listing_purpose
CREATE INDEX IF NOT EXISTS idx_property_projects_listing_purpose ON property_projects(listing_purpose);
