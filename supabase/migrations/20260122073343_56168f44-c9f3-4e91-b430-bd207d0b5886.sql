-- Update trigger function to include setup URL in notification data
CREATE OR REPLACE FUNCTION notify_owner_property_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Set instant booking enabled after 48 hours
    NEW.instant_booking_enabled_at := NOW() + INTERVAL '48 hours';
    NEW.approved_at := NOW();
    NEW.status := 'active';
    
    -- Create notification for owner with setup link
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Объект одобрен! 🎉',
      'Ваш объект "' || COALESCE(NEW.title, 'Без названия') || '" одобрен и опубликован. Настройте календарь и цены.',
      'property_approved',
      jsonb_build_object(
        'property_id', NEW.id,
        'action', 'setup_calendar',
        'url', '/owner/properties/' || NEW.id || '/setup'
      )
    );
  END IF;
  
  -- When rejected
  IF NEW.approval_status = 'rejected' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'rejected') THEN
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Требуется доработка',
      'Объект "' || COALESCE(NEW.title, 'Без названия') || '" требует доработки: ' || COALESCE(NEW.rejection_reason, 'См. комментарии'),
      'property_rejected',
      jsonb_build_object(
        'property_id', NEW.id, 
        'reason', NEW.rejection_reason,
        'url', '/owner/properties/' || NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;