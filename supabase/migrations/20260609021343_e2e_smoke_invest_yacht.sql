-- E2E smoke test: investor inquiries + yacht booking
WITH d AS (SELECT id FROM public.investment_deals WHERE is_published=true ORDER BY created_at LIMIT 2)
INSERT INTO public.investor_inquiries
  (deal_id, investor_name, investor_email, investor_whatsapp, investor_type, investment_capacity_usd, message, status)
SELECT id, 'E2E Smoke Investor', 'smoke+invest@myuno.app', '+66800000001',
       'individual', 250000, 'E2E smoke inquiry — auto', 'new'
FROM d;

WITH y AS (SELECT id, provider_id FROM public.water_activities WHERE category='yacht' LIMIT 1)
INSERT INTO public.bookings
  (provider_id, service_id, booking_type, status, scheduled_at, total_amount, currency, notes)
SELECT provider_id, id, 'tour'::booking_type, 'submitted'::booking_status,
       now() + interval '5 days', 35000, 'THB', 'E2E smoke yacht booking'
FROM y;

-- Simulate Partner acknowledging inquiry → contacted, and confirming booking
UPDATE public.investor_inquiries
SET status='contacted', admin_notes='Partner acknowledged via smoke test'
WHERE investor_email='smoke+invest@myuno.app' AND status='new';

UPDATE public.bookings
SET status='confirmed'::booking_status, updated_at=now()
WHERE notes='E2E smoke yacht booking' AND status='submitted';
