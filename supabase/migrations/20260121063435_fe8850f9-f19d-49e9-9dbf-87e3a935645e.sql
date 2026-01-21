-- Add delegated creation fields to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS created_on_behalf BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS actual_owner_email TEXT,
ADD COLUMN IF NOT EXISTS actual_owner_name TEXT,
ADD COLUMN IF NOT EXISTS actual_owner_phone TEXT,
ADD COLUMN IF NOT EXISTS managed_by_org_id UUID REFERENCES public.orgs(id),
ADD COLUMN IF NOT EXISTS ownership_transferred_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ownership_type TEXT DEFAULT 'own' CHECK (ownership_type IN ('own', 'client', 'poa'));

-- Create index for org access queries
CREATE INDEX IF NOT EXISTS idx_owner_properties_managed_by_org ON public.owner_properties(managed_by_org_id) WHERE managed_by_org_id IS NOT NULL;

-- Update RLS policy to include org member access
DROP POLICY IF EXISTS "Owner can view own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can insert own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can update own properties" ON public.owner_properties;
DROP POLICY IF EXISTS "Owner can delete own properties" ON public.owner_properties;

-- Comprehensive access policy: owner OR org member OR delegate
CREATE POLICY "property_full_access" ON public.owner_properties
FOR ALL USING (
  owner_id = auth.uid() OR
  managed_by_org_id IN (
    SELECT org_id FROM public.org_members 
    WHERE user_id = auth.uid() AND is_active = true
  ) OR
  id IN (
    SELECT property_id FROM public.property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Table for pending property invitations (when owner doesn't have account yet)
CREATE TABLE IF NOT EXISTS public.property_ownership_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('ownership_transfer', 'delegate')),
  delegate_role TEXT CHECK (delegate_role IN ('trustee', 'agent', 'manager', 'management_company')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up invites by email
CREATE INDEX IF NOT EXISTS idx_property_invites_email ON public.property_ownership_invites(invitee_email, status);

-- Enable RLS
ALTER TABLE public.property_ownership_invites ENABLE ROW LEVEL SECURITY;

-- Policy for invites
CREATE POLICY "invites_access" ON public.property_ownership_invites
FOR ALL USING (
  inviter_id = auth.uid() OR
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Log ownership transfer in activity
CREATE OR REPLACE FUNCTION public.log_ownership_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id AND NEW.ownership_transferred_at IS NOT NULL THEN
    INSERT INTO public.property_activity_log (property_id, actor_id, action, details)
    VALUES (
      NEW.id,
      NEW.owner_id,
      'ownership_transferred',
      jsonb_build_object(
        'previous_owner_id', OLD.owner_id,
        'new_owner_id', NEW.owner_id,
        'transferred_at', NEW.ownership_transferred_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_ownership_transfer ON public.owner_properties;
CREATE TRIGGER trg_log_ownership_transfer
  AFTER UPDATE ON public.owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ownership_transfer();