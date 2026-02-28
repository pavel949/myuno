
-- Fix security definer view warning
ALTER VIEW v_owner_properties SET (security_invoker = true);
