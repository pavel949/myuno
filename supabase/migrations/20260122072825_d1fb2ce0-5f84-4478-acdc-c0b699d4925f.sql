-- Add approval workflow fields to owner_properties
ALTER TABLE owner_properties 
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS instant_booking_enabled_at timestamp with time zone;

-- Create index for faster moderation queries
CREATE INDEX IF NOT EXISTS idx_owner_properties_approval_status 
  ON owner_properties(approval_status);

-- Create trigger function for approval notifications
CREATE OR REPLACE FUNCTION notify_owner_property_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Set instant booking enabled after 48 hours
    NEW.instant_booking_enabled_at := NOW() + INTERVAL '48 hours';
    NEW.approved_at := NOW();
    NEW.status := 'active';
    
    -- Create notification for owner
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (
      NEW.owner_id,
      'Объект одобрен! 🎉',
      'Ваш объект "' || COALESCE(NEW.title, 'Без названия') || '" одобрен и опубликован. Настройте календарь и цены.',
      'property_approved',
      jsonb_build_object(
        'property_id', NEW.id,
        'action', 'setup_calendar'
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
        'reason', NEW.rejection_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS owner_property_approval_trigger ON owner_properties;
CREATE TRIGGER owner_property_approval_trigger
  BEFORE UPDATE ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_owner_property_approval();