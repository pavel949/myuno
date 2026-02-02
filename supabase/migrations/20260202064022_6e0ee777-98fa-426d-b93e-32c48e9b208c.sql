-- Add universal lead fields to consultation_requests
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS vertical_id text,
ADD COLUMN IF NOT EXISTS vertical_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS entry_point text,
ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'organic';

-- Create index for vertical filtering
CREATE INDEX IF NOT EXISTS idx_consultation_requests_vertical_id 
ON consultation_requests(vertical_id);

-- Create index for lead source analytics
CREATE INDEX IF NOT EXISTS idx_consultation_requests_lead_source 
ON consultation_requests(lead_source);

-- Add comment for documentation
COMMENT ON COLUMN consultation_requests.vertical_id IS 'References INTAKE_VERTICALS.id - e.g. yachts, tours, properties';
COMMENT ON COLUMN consultation_requests.vertical_metadata IS 'Flexible JSON for vertical-specific data';
COMMENT ON COLUMN consultation_requests.entry_point IS 'Page URL where lead was captured';
COMMENT ON COLUMN consultation_requests.lead_source IS 'fab, cta, chat, external, organic';