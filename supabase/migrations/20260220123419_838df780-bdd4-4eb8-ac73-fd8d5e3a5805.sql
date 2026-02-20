
-- Create inventory_inspections table for check-in/check-out checklists
CREATE TABLE public.inventory_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('check_in', 'check_out')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_inspections ENABLE ROW LEVEL SECURITY;

-- RLS: owners can manage inspections for their own properties
CREATE POLICY "Owners can view their inspections"
ON public.inventory_inspections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can create inspections"
ON public.inventory_inspections
FOR INSERT
TO authenticated
WITH CHECK (
  inspector_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their inspections"
ON public.inventory_inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);
