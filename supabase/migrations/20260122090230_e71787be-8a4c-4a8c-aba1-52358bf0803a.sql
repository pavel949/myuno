-- Function to publish owner property to marketplace automatically
CREATE OR REPLACE FUNCTION public.publish_property_to_marketplace(p_owner_property_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  op RECORD;
  new_property_id UUID;
  existing_property_id UUID;
BEGIN
  -- Get owner property data
  SELECT * INTO op FROM owner_properties WHERE id = p_owner_property_id;
  
  IF op IS NULL THEN
    RAISE EXCEPTION 'Owner property not found: %', p_owner_property_id;
  END IF;
  
  -- Check if already linked to marketplace
  existing_property_id := op.marketplace_property_id;
  
  IF existing_property_id IS NOT NULL THEN
    -- Update existing property
    UPDATE properties SET
      title_en = op.title,
      title_ru = op.title_ru,
      description_en = op.description,
      description_ru = op.description_ru,
      property_type = op.property_type,
      listing_type = 'rent',
      price = COALESCE(op.price_per_night, 0),
      price_period = 'night',
      currency = 'THB',
      bedrooms = op.bedrooms,
      bathrooms = op.bathrooms,
      area_sqm = op.area_sqm,
      max_guests = op.max_guests,
      cover_image = op.cover_image,
      images = op.images,
      address = op.address,
      district = op.district,
      lat = op.lat,
      lng = op.lng,
      amenities = op.amenities,
      is_active = true,
      is_verified = true,
      instant_booking = COALESCE(op.instant_booking, false),
      min_stay_nights = op.min_stay_nights,
      approval_status = 'approved',
      updated_at = NOW()
    WHERE id = existing_property_id;
    
    RETURN existing_property_id;
  ELSE
    -- Create new property in marketplace
    INSERT INTO properties (
      title_en, title_ru, description_en, description_ru,
      property_type, listing_type, price, price_period, currency,
      bedrooms, bathrooms, area_sqm, max_guests, cover_image, images,
      address, district, lat, lng, amenities,
      is_active, is_verified, instant_booking, min_stay_nights, approval_status
    ) VALUES (
      op.title, op.title_ru, op.description, op.description_ru,
      op.property_type, 'rent', COALESCE(op.price_per_night, 0), 'night', 'THB',
      op.bedrooms, op.bathrooms, op.area_sqm, op.max_guests,
      op.cover_image, op.images, op.address, op.district, op.lat, op.lng,
      op.amenities, true, true, COALESCE(op.instant_booking, false),
      op.min_stay_nights, 'approved'
    )
    RETURNING id INTO new_property_id;
    
    -- Link owner property to marketplace property
    UPDATE owner_properties 
    SET marketplace_property_id = new_property_id,
        status = 'active'
    WHERE id = p_owner_property_id;
    
    RETURN new_property_id;
  END IF;
END;
$$;

-- Function to handle auto-publish on approval
CREATE OR REPLACE FUNCTION public.auto_publish_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_marketplace_id UUID;
BEGIN
  -- Only trigger when approval_status changes to 'approved'
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Publish to marketplace
    v_marketplace_id := publish_property_to_marketplace(NEW.id);
    
    -- Create notification for owner
    INSERT INTO notifications (
      user_id,
      title,
      body,
      type,
      data,
      is_read
    ) VALUES (
      NEW.owner_id,
      '🎉 Объект одобрен и опубликован!',
      'Ваш объект "' || NEW.title || '" теперь доступен для бронирования на платформе.',
      'property_approved',
      jsonb_build_object(
        'owner_property_id', NEW.id,
        'marketplace_property_id', v_marketplace_id,
        'title', NEW.title
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_publish_on_approval ON owner_properties;
CREATE TRIGGER trigger_auto_publish_on_approval
  AFTER UPDATE OF approval_status ON owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_on_approval();

-- Function to sync updates from owner_properties to marketplace
CREATE OR REPLACE FUNCTION public.sync_owner_property_to_marketplace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if property is published to marketplace
  IF NEW.marketplace_property_id IS NOT NULL AND NEW.approval_status = 'approved' THEN
    UPDATE properties SET
      title_en = NEW.title,
      title_ru = NEW.title_ru,
      description_en = NEW.description,
      description_ru = NEW.description_ru,
      price = COALESCE(NEW.price_per_night, 0),
      bedrooms = NEW.bedrooms,
      bathrooms = NEW.bathrooms,
      area_sqm = NEW.area_sqm,
      max_guests = NEW.max_guests,
      cover_image = NEW.cover_image,
      images = NEW.images,
      address = NEW.address,
      district = NEW.district,
      lat = NEW.lat,
      lng = NEW.lng,
      amenities = NEW.amenities,
      instant_booking = COALESCE(NEW.instant_booking, false),
      min_stay_nights = NEW.min_stay_nights,
      updated_at = NOW()
    WHERE id = NEW.marketplace_property_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create sync trigger
DROP TRIGGER IF EXISTS trigger_sync_owner_property ON owner_properties;
CREATE TRIGGER trigger_sync_owner_property
  AFTER UPDATE ON owner_properties
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.price_per_night IS DISTINCT FROM NEW.price_per_night OR
    OLD.cover_image IS DISTINCT FROM NEW.cover_image OR
    OLD.images IS DISTINCT FROM NEW.images OR
    OLD.description IS DISTINCT FROM NEW.description
  )
  EXECUTE FUNCTION sync_owner_property_to_marketplace();