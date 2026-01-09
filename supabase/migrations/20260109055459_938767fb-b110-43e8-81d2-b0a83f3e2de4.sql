-- Create view_history table for tracking viewed items
CREATE TABLE public.view_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_data JSONB DEFAULT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 1
);

-- Create unique constraint for user + item combination
CREATE UNIQUE INDEX idx_view_history_user_item ON public.view_history(user_id, item_id, item_type);

-- Create index for faster queries
CREATE INDEX idx_view_history_user_viewed ON public.view_history(user_id, viewed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own history"
ON public.view_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own history"
ON public.view_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
ON public.view_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.view_history
FOR DELETE
USING (auth.uid() = user_id);