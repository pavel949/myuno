-- Performance indexes for Owner Module (P0)

-- Index for property_financials - query by owner and date (most common query)
CREATE INDEX IF NOT EXISTS idx_property_financials_owner_date 
ON property_financials(owner_id, transaction_date DESC);

-- Index for property_financials - filter by property_id
CREATE INDEX IF NOT EXISTS idx_property_financials_property 
ON property_financials(property_id);

-- Index for owner_properties - frequent lookup by owner and status
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_status 
ON owner_properties(owner_id, approval_status);

-- Index for owner_properties - owner_id only for property list
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_id 
ON owner_properties(owner_id);

-- Index for property_bookings - common calendar query
CREATE INDEX IF NOT EXISTS idx_property_bookings_property_dates 
ON property_bookings(property_id, check_in, check_out);