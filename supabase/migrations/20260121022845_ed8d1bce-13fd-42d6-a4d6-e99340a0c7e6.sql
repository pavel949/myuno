-- Add RLS policy for admins to view and manage all consultation requests
CREATE POLICY "Admins can view all consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all consultation requests"
  ON public.consultation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Add vacation_rental to the request_type check constraint
ALTER TABLE public.consultation_requests 
DROP CONSTRAINT IF EXISTS consultation_requests_request_type_check;

ALTER TABLE public.consultation_requests 
ADD CONSTRAINT consultation_requests_request_type_check 
CHECK (request_type IN (
  'vacation_rental',
  'property_consultation',
  'property_tour',
  'full_management',
  'investment_advice'
));

-- Add guests_count and children_count columns for vacation rentals
ALTER TABLE public.consultation_requests 
ADD COLUMN IF NOT EXISTS guests_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;