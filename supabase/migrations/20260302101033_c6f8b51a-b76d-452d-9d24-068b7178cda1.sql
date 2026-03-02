
-- Add mode and entity_id columns to existing user_active_context
ALTER TABLE public.user_active_context 
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'user' CHECK (mode IN ('user', 'owner', 'mc', 'investor', 'vendor', 'admin', 'team'));

ALTER TABLE public.user_active_context 
ADD COLUMN IF NOT EXISTS entity_id uuid;

-- Sync: populate mode from active_role for existing rows
UPDATE public.user_active_context 
SET mode = CASE 
  WHEN active_role IN ('admin', 'ombudsman') THEN 'admin'
  WHEN active_role IN ('uno_team') THEN 'team'
  WHEN active_role IN ('vendor') THEN 'vendor'
  WHEN active_role IN ('owner', 'property_owner', 'property_manager') THEN 'owner'
  WHEN active_role IN ('investor') THEN 'investor'
  ELSE 'user'
END,
entity_id = active_org_id
WHERE mode = 'user' AND active_role != 'user';
