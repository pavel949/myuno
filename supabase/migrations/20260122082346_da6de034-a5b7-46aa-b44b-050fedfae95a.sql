-- Trigger function to notify admins when a new property is submitted for moderation
CREATE OR REPLACE FUNCTION notify_admins_new_property_submission()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  property_title TEXT;
BEGIN
  -- Only trigger on new submissions (status becomes 'pending')
  IF NEW.approval_status = 'pending' AND (OLD IS NULL OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    property_title := COALESCE(NEW.title, 'Без названия');
    
    -- Create in-app notification for all admins and uno_team members
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role IN ('admin', 'uno_team')
    LOOP
      INSERT INTO notifications (user_id, title, body, type, data)
      VALUES (
        admin_user.user_id,
        '🏠 Новый объект на модерации',
        'Объект "' || property_title || '" ожидает проверки.',
        'property_submission',
        jsonb_build_object(
          'property_id', NEW.id,
          'property_title', property_title,
          'owner_id', NEW.owner_id,
          'action', 'review'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on owner_properties
DROP TRIGGER IF EXISTS trigger_notify_admins_property_submission ON owner_properties;
CREATE TRIGGER trigger_notify_admins_property_submission
  AFTER INSERT OR UPDATE ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_property_submission();