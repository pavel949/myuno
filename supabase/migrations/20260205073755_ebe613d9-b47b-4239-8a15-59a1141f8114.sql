-- Extend order_status ENUM with property-specific statuses
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'checked_in';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'checked_out';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_deposit';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'deposit_paid';