
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE team_member_permissions ADD COLUMN IF NOT EXISTS sub_permissions JSONB DEFAULT '{}';
