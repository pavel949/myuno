-- Add rooms JSONB field to owner_properties for detailed room configuration
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS rooms JSONB DEFAULT '[]'::jsonb;

-- Add highlights array for property features
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Add nearby_places JSONB for points of interest
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS nearby_places JSONB DEFAULT '[]'::jsonb;

-- Add safety_features array
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS safety_features TEXT[] DEFAULT '{}';

-- Add accessibility_features array
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}';

-- Create property_availability table for calendar management
CREATE TABLE IF NOT EXISTS property_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'booked')),
  price_override DECIMAL(10,2),
  min_nights_override INTEGER,
  note TEXT,
  booking_id UUID REFERENCES property_bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Enable RLS on property_availability
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their property availability
CREATE POLICY "Owners can view own property availability"
ON property_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can insert availability for their properties
CREATE POLICY "Owners can insert own property availability"
ON property_availability
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can update their property availability
CREATE POLICY "Owners can update own property availability"
ON property_availability
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Owners can delete their property availability
CREATE POLICY "Owners can delete own property availability"
ON property_availability
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_availability.property_id
    AND op.owner_id = auth.uid()
  )
);

-- Policy: Admins can manage all availability (using has_role function)
CREATE POLICY "Admins can manage all availability"
ON property_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Policy: Public can view availability for active properties (for booking calendar)
CREATE POLICY "Public can view availability for active properties"
ON property_availability
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM owner_properties op
    JOIN properties mp ON mp.id = op.marketplace_property_id
    WHERE op.id = property_availability.property_id
    AND mp.is_active = true
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_availability_property_date 
ON property_availability(property_id, date);

CREATE INDEX IF NOT EXISTS idx_property_availability_status 
ON property_availability(status);

-- Add trigger for updated_at
CREATE TRIGGER update_property_availability_updated_at
BEFORE UPDATE ON property_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();