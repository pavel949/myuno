-- Extend user_type enum with admin roles
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'uno_team';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'owner';