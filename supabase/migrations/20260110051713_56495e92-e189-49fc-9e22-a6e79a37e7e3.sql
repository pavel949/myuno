-- Create function to increment helpful count on reviews
CREATE OR REPLACE FUNCTION public.increment_helpful_count(review_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews 
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = review_id_param;
END;
$$;