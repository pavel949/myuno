-- Function to notify admins when a property is submitted for moderation
CREATE OR REPLACE FUNCTION public.notify_admins_new_property_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  property_title TEXT;
  owner_name TEXT;
BEGIN
  -- Only trigger when approval_status changes to 'pending'
  IF NEW.approval_status = 'pending' AND (OLD IS NULL OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    -- Get property title
    property_title := COALESCE(NEW.title, NEW.title_ru, 'Без названия');
    
    -- Get owner name
    SELECT COALESCE(full_name, 'Владелец') INTO owner_name
    FROM profiles
    WHERE id = NEW.owner_id;
    
    -- Create notification for all admins and UNO Team members
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role IN ('admin', 'uno_team')
    LOOP
      INSERT INTO notifications (user_id, title, body, type, data, is_read)
      VALUES (
        admin_user.user_id,
        '🏠 Новый объект на модерации',
        'Объект "' || property_title || '" от ' || owner_name || ' ожидает проверки.',
        'property_submission',
        jsonb_build_object(
          'property_id', NEW.id,
          'property_title', property_title,
          'owner_id', NEW.owner_id,
          'owner_name', owner_name
        ),
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_property_submission_notify_admins ON owner_properties;

-- Create trigger on INSERT and UPDATE of approval_status
CREATE TRIGGER on_property_submission_notify_admins
  AFTER INSERT OR UPDATE OF approval_status ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_property_submission();