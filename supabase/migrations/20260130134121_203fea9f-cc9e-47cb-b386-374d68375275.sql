-- Create ai_intake_sessions table for tracking intake workflow
CREATE TABLE public.ai_intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Input
  input_mode TEXT NOT NULL,  -- 'single', 'bulk_text', 'bulk_file', 'bulk_urls'
  raw_input TEXT,
  file_name TEXT,
  uploaded_images TEXT[],
  
  -- Detected items
  items_count INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,  -- Array of IntakeItem objects
  
  -- Status
  status TEXT DEFAULT 'processing',  -- 'processing', 'ready', 'partial', 'failed', 'completed'
  processed_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  discarded_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: only admins and uno_team can manage intake sessions
CREATE POLICY "Admins manage intake sessions" ON public.ai_intake_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Indexes for quick lookup
CREATE INDEX idx_ai_intake_sessions_admin ON public.ai_intake_sessions(admin_id);
CREATE INDEX idx_ai_intake_sessions_status ON public.ai_intake_sessions(status);
CREATE INDEX idx_ai_intake_sessions_created ON public.ai_intake_sessions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_ai_intake_sessions_updated_at
  BEFORE UPDATE ON public.ai_intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();