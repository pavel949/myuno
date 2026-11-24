DROP POLICY IF EXISTS thai_reviews_select ON public.thai_business_reviews;
CREATE POLICY thai_reviews_select ON public.thai_business_reviews
FOR SELECT TO authenticated
USING (
  customer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.thai_businesses b WHERE b.id = thai_business_reviews.business_id AND b.owner_id = auth.uid())
);