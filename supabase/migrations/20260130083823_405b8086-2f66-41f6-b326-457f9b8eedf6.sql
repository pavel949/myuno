-- Create table for tracking PWA installations
CREATE TABLE public.pwa_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  browser TEXT,
  device_info JSONB,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT,
  ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.pwa_installs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking)
CREATE POLICY "Anyone can log installs"
  ON public.pwa_installs FOR INSERT
  WITH CHECK (true);

-- Admins can view via user_roles
CREATE POLICY "Admins can view installs"
  ON public.pwa_installs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'uno_team')
    )
  );

-- Create indexes
CREATE INDEX idx_pwa_installs_date ON public.pwa_installs(installed_at);
CREATE INDEX idx_pwa_installs_platform ON public.pwa_installs(platform);