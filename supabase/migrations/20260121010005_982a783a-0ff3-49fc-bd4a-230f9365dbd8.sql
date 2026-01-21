-- Update existing records to have approved status (since they were created before moderation system)
UPDATE tours SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE water_activities SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE restaurants SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE salons SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE clinics SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE gyms SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE vehicles SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE properties SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE pharmacies SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE insurance_providers SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE babysitters SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE cleaning_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE legal_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE pet_services SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE education_providers SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE yachts SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE flower_shops SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;
UPDATE stores SET approval_status = 'approved' WHERE approval_status = 'pending' OR approval_status IS NULL;

-- Create function for vendor content status notifications
CREATE OR REPLACE FUNCTION notify_vendor_on_content_status_change()
RETURNS TRIGGER AS $$
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
    NEW.title_en,
    NEW.name_en,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for all content tables
DROP TRIGGER IF EXISTS trigger_notify_vendor_tours ON tours;
CREATE TRIGGER trigger_notify_vendor_tours
  AFTER UPDATE OF approval_status ON tours
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_water_activities ON water_activities;
CREATE TRIGGER trigger_notify_vendor_water_activities
  AFTER UPDATE OF approval_status ON water_activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_restaurants ON restaurants;
CREATE TRIGGER trigger_notify_vendor_restaurants
  AFTER UPDATE OF approval_status ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_salons ON salons;
CREATE TRIGGER trigger_notify_vendor_salons
  AFTER UPDATE OF approval_status ON salons
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_clinics ON clinics;
CREATE TRIGGER trigger_notify_vendor_clinics
  AFTER UPDATE OF approval_status ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_gyms ON gyms;
CREATE TRIGGER trigger_notify_vendor_gyms
  AFTER UPDATE OF approval_status ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_vehicles ON vehicles;
CREATE TRIGGER trigger_notify_vendor_vehicles
  AFTER UPDATE OF approval_status ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_properties ON properties;
CREATE TRIGGER trigger_notify_vendor_properties
  AFTER UPDATE OF approval_status ON properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_yachts ON yachts;
CREATE TRIGGER trigger_notify_vendor_yachts
  AFTER UPDATE OF approval_status ON yachts
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_events ON events;
CREATE TRIGGER trigger_notify_vendor_events
  AFTER UPDATE OF approval_status ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_babysitters ON babysitters;
CREATE TRIGGER trigger_notify_vendor_babysitters
  AFTER UPDATE OF approval_status ON babysitters
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_cleaning_services ON cleaning_services;
CREATE TRIGGER trigger_notify_vendor_cleaning_services
  AFTER UPDATE OF approval_status ON cleaning_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_legal_services ON legal_services;
CREATE TRIGGER trigger_notify_vendor_legal_services
  AFTER UPDATE OF approval_status ON legal_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_pet_services ON pet_services;
CREATE TRIGGER trigger_notify_vendor_pet_services
  AFTER UPDATE OF approval_status ON pet_services
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_education_providers ON education_providers;
CREATE TRIGGER trigger_notify_vendor_education_providers
  AFTER UPDATE OF approval_status ON education_providers
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_pharmacies ON pharmacies;
CREATE TRIGGER trigger_notify_vendor_pharmacies
  AFTER UPDATE OF approval_status ON pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_insurance_providers ON insurance_providers;
CREATE TRIGGER trigger_notify_vendor_insurance_providers
  AFTER UPDATE OF approval_status ON insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_flower_shops ON flower_shops;
CREATE TRIGGER trigger_notify_vendor_flower_shops
  AFTER UPDATE OF approval_status ON flower_shops
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();

DROP TRIGGER IF EXISTS trigger_notify_vendor_stores ON stores;
CREATE TRIGGER trigger_notify_vendor_stores
  AFTER UPDATE OF approval_status ON stores
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_on_content_status_change();