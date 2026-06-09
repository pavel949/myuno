CREATE OR REPLACE FUNCTION public.sync_investor_inquiry_to_capital_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_sync_investor_inquiry_to_crm ON public.investor_inquiries;

-- Investor inquiries
WITH d AS (SELECT id FROM public.investment_deals WHERE is_published=true ORDER BY created_at LIMIT 2)
INSERT INTO public.investor_inquiries
  (deal_id, investor_name, investor_email, investor_whatsapp, investor_type, investment_capacity_usd, message, status)
SELECT id, 'E2E Smoke Investor', 'smoke+invest@myuno.app', '+66800000001',
       'individual'::investor_type, 250000, 'E2E smoke inquiry — auto', 'new'::inquiry_status
FROM d;

UPDATE public.investor_inquiries
SET status='contacted'::inquiry_status, admin_notes='Partner acknowledged via smoke test'
WHERE investor_email='smoke+invest@myuno.app' AND status='new'::inquiry_status;

-- Yacht booking via availability calendar (SSOT for Partner/Staff)
WITH y AS (SELECT id FROM public.yacht_availability LIMIT 1)
SELECT 1; -- placeholder to ensure CTE materializes nothing dangerous

UPDATE public.yacht_availability
SET status='booked', note='E2E smoke yacht booking', updated_at=now()
WHERE id IN (
  SELECT id FROM public.yacht_availability
  WHERE status='available' AND date >= current_date
  ORDER BY date LIMIT 2
);