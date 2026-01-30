-- Add admin UPDATE policies for all content moderation tables

-- Tours
CREATE POLICY "Admins can update tours"
ON public.tours
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Water Activities
CREATE POLICY "Admins can update water_activities"
ON public.water_activities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Salons
CREATE POLICY "Admins can update salons"
ON public.salons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Clinics
CREATE POLICY "Admins can update clinics"
ON public.clinics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Gyms
CREATE POLICY "Admins can update gyms"
ON public.gyms
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Vehicles
CREATE POLICY "Admins can update vehicles"
ON public.vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Properties
CREATE POLICY "Admins can update properties"
ON public.properties
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Yachts
CREATE POLICY "Admins can update yachts"
ON public.yachts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Events
CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Babysitters
CREATE POLICY "Admins can update babysitters"
ON public.babysitters
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Cleaning Services
CREATE POLICY "Admins can update cleaning_services"
ON public.cleaning_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Legal Services
CREATE POLICY "Admins can update legal_services"
ON public.legal_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Pet Services
CREATE POLICY "Admins can update pet_services"
ON public.pet_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Education Providers
CREATE POLICY "Admins can update education_providers"
ON public.education_providers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Pharmacies
CREATE POLICY "Admins can update pharmacies"
ON public.pharmacies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Insurance Providers
CREATE POLICY "Admins can update insurance_providers"
ON public.insurance_providers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Flower Shops
CREATE POLICY "Admins can update flower_shops"
ON public.flower_shops
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Stores
CREATE POLICY "Admins can update stores"
ON public.stores
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Vendor Locations
CREATE POLICY "Admins can update vendor_locations"
ON public.vendor_locations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));