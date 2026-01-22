-- Add admin SELECT policies for content moderation tables
-- This allows admins to view ALL content regardless of approval_status

-- Restaurants: Admin can view all
CREATE POLICY "Admins can view all restaurants"
ON restaurants FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Salons: Admin can view all
CREATE POLICY "Admins can view all salons"
ON salons FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Gyms: Admin can view all
CREATE POLICY "Admins can view all gyms"
ON gyms FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Clinics: Admin can view all
CREATE POLICY "Admins can view all clinics"
ON clinics FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Events: Admin can view all
CREATE POLICY "Admins can view all events"
ON events FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Water activities: Admin can view all
CREATE POLICY "Admins can view all water_activities"
ON water_activities FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Education providers: Admin can view all
CREATE POLICY "Admins can view all education_providers"
ON education_providers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Cleaning services: Admin can view all
CREATE POLICY "Admins can view all cleaning_services"
ON cleaning_services FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);

-- Babysitters: Admin can view all
CREATE POLICY "Admins can view all babysitters"
ON babysitters FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'uno_team'::app_role)
);