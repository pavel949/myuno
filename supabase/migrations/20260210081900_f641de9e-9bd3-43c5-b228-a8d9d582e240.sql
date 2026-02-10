
-- Add provider_id link to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD CONSTRAINT management_companies_provider_id_key UNIQUE (provider_id);

-- Trigger function: auto-create/update management_companies from providers
CREATE OR REPLACE FUNCTION public.sync_provider_to_management_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for property_management providers
  IF NEW.business_category = 'property_management' THEN
    INSERT INTO public.management_companies (
      provider_id,
      slug,
      name_en,
      name_ru,
      description_en,
      description_ru,
      logo,
      cover_image,
      phone,
      email,
      website,
      rating,
      review_count,
      is_verified,
      is_active
    ) VALUES (
      NEW.id,
      LOWER(REPLACE(REPLACE(TRIM(NEW.name), ' ', '-'), '''', '')),
      NEW.name,
      COALESCE(NEW.name, ''),
      NEW.description_en,
      NEW.description_ru,
      NEW.logo_url,
      NEW.cover_image,
      NEW.phone,
      NEW.email,
      NEW.website,
      NEW.rating,
      NEW.review_count,
      NEW.is_verified,
      NEW.is_active
    )
    ON CONFLICT (provider_id) DO UPDATE SET
      name_en = EXCLUDED.name_en,
      name_ru = EXCLUDED.name_ru,
      description_en = EXCLUDED.description_en,
      description_ru = EXCLUDED.description_ru,
      logo = EXCLUDED.logo,
      cover_image = EXCLUDED.cover_image,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      website = EXCLUDED.website,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      is_verified = EXCLUDED.is_verified,
      is_active = EXCLUDED.is_active;
  ELSE
    -- If category changed away from property_management, deactivate
    IF TG_OP = 'UPDATE' AND OLD.business_category = 'property_management' THEN
      UPDATE public.management_companies SET is_active = false WHERE provider_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_sync_provider_to_mc ON public.providers;
CREATE TRIGGER trg_sync_provider_to_mc
  AFTER INSERT OR UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_provider_to_management_company();
