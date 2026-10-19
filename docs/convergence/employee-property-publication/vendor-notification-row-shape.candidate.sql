-- SOURCE CANDIDATE ONLY. Not a migration; no live activation approval.
-- Forward compatibility repair for the verified deployed shared trigger.
-- Missing optional title/name fields must be read from JSON, not record attributes.
-- Existing recipients, status gates, notifications, security and grants are unchanged.
BEGIN;
DO $$ BEGIN
 IF to_regprocedure('public.notify_vendor_on_content_status_change()') IS NULL THEN
  RAISE EXCEPTION 'existing vendor moderation trigger function is required';
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_vendor_on_content_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_provider_user_id UUID;
  v_item_name TEXT;
  v_title_en TEXT;
  v_title_ru TEXT;
  v_body_en TEXT;
  v_body_ru TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.approval_status IS NOT DISTINCT FROM NEW.approval_status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider's user_id
  SELECT user_id INTO v_provider_user_id
  FROM providers
  WHERE id = NEW.provider_id;
  
  -- Skip if no provider found
  IF v_provider_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get item name (try different column naming conventions)
  v_item_name := COALESCE(
    to_jsonb(NEW)->>'title_en',
    to_jsonb(NEW)->>'name_en',
    'Your item'
  );
  
  -- Set notification content based on status
  IF NEW.approval_status = 'approved' THEN
    v_title_en := '✅ Content Approved!';
    v_title_ru := '✅ Контент одобрен!';
    v_body_en := '"' || v_item_name || '" is now visible to users';
    v_body_ru := '"' || v_item_name || '" теперь виден пользователям';
  ELSIF NEW.approval_status = 'rejected' THEN
    v_title_en := '❌ Content Rejected';
    v_title_ru := '❌ Контент отклонён';
    v_body_en := '"' || v_item_name || '" was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified');
    v_body_ru := '"' || v_item_name || '" отклонён. Причина: ' || COALESCE(NEW.rejection_reason, 'Не указана');
  ELSE
    RETURN NEW;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    data,
    is_read
  ) VALUES (
    v_provider_user_id,
    v_title_ru,
    v_body_ru,
    'content_moderation',
    jsonb_build_object(
      'item_id', NEW.id,
      'item_type', TG_TABLE_NAME,
      'new_status', NEW.approval_status,
      'rejection_reason', NEW.rejection_reason
    ),
    false
  );
  
  RETURN NEW;
END;
$function$

COMMIT;
