-- Add 'medical' to booking_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'medical' AND enumtypid = 'booking_type'::regtype) THEN
    ALTER TYPE public.booking_type ADD VALUE 'medical';
  END IF;
END $$;

-- Create clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  clinic_type TEXT NOT NULL DEFAULT 'clinic', -- hospital, clinic, diagnostic_center
  specialty TEXT[] DEFAULT '{}', -- general, dental, cardio, pediatric, eye, etc.
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT '{EN}',
  is_24h BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  consultation_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  provider_id UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  specialty TEXT NOT NULL,
  specialty_ru TEXT,
  qualification TEXT,
  qualification_ru TEXT,
  experience_years INTEGER DEFAULT 0,
  photo TEXT,
  languages TEXT[] DEFAULT '{EN}',
  consultation_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  available_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
  available_times JSONB DEFAULT '{}', -- {"monday": ["09:00", "10:00", ...]}
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical_services table
CREATE TABLE public.medical_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  category TEXT NOT NULL, -- consultation, diagnostic, procedure, surgery
  specialty TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;

-- Clinics policies (public read, provider write)
CREATE POLICY "Clinics are viewable by everyone"
  ON public.clinics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can manage their clinics"
  ON public.clinics FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- Doctors policies (public read, clinic provider write)
CREATE POLICY "Doctors are viewable by everyone"
  ON public.doctors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic providers can manage doctors"
  ON public.doctors FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.providers p ON c.provider_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Medical services policies (public read, clinic provider write)
CREATE POLICY "Medical services are viewable by everyone"
  ON public.medical_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic providers can manage services"
  ON public.medical_services FOR ALL
  USING (
    clinic_id IN (
      SELECT c.id FROM public.clinics c
      JOIN public.providers p ON c.provider_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_clinics_specialty ON public.clinics USING GIN(specialty);
CREATE INDEX idx_clinics_district ON public.clinics(district);
CREATE INDEX idx_clinics_clinic_type ON public.clinics(clinic_type);
CREATE INDEX idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX idx_medical_services_clinic_id ON public.medical_services(clinic_id);
CREATE INDEX idx_medical_services_category ON public.medical_services(category);

-- Add triggers for updated_at
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.clinics (name_en, name_ru, clinic_type, specialty, cover_image, address, district, phone, languages, is_verified, is_featured, rating, review_count, consultation_price, working_hours, is_24h) VALUES
('Bangkok Hospital Phuket', 'Бангкок Госпиталь Пхукет', 'hospital', ARRAY['general', 'cardio', 'pediatric', 'dental', 'eye'], 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', '2/1 Hongyok Utis Road', 'Phuket Town', '+66 76 254 425', ARRAY['EN', 'TH', 'RU', 'CN'], true, true, 4.9, 892, 1500, '{"monday": "00:00-24:00", "tuesday": "00:00-24:00", "wednesday": "00:00-24:00", "thursday": "00:00-24:00", "friday": "00:00-24:00", "saturday": "00:00-24:00", "sunday": "00:00-24:00"}', true),
('Phuket Dental Signature', 'Пхукет Дентал Сигнатюр', 'clinic', ARRAY['dental'], 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600', '58/1 Rat-U-Thit 200 Pee Road', 'Patong', '+66 76 340 234', ARRAY['EN', 'TH', 'RU'], true, false, 4.8, 234, 800, '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00"}', false),
('Heart Center Phuket', 'Кардиоцентр Пхукет', 'clinic', ARRAY['cardio'], 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600', '44 Chalermprakiat Road', 'Kata', '+66 76 333 444', ARRAY['EN', 'TH'], true, false, 4.9, 156, 2500, '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}', false),
('Kids Health Clinic', 'Детская Клиника', 'clinic', ARRAY['pediatric'], 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600', '12 Wiset Road', 'Rawai', '+66 76 288 999', ARRAY['EN', 'TH', 'RU'], true, false, 4.7, 189, 1200, '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-12:00"}', false),
('Phuket Eye Center', 'Глазной Центр Пхукет', 'clinic', ARRAY['eye'], 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600', '88 Thepkrasattri Road', 'Phuket Town', '+66 76 222 333', ARRAY['EN', 'TH'], true, false, 4.8, 145, 1000, '{"monday": "08:30-16:30", "tuesday": "08:30-16:30", "wednesday": "08:30-16:30", "thursday": "08:30-16:30", "friday": "08:30-16:30"}', false);

-- Insert sample doctors
INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Somchai Prasert',
  'Др. Сомчай Прасерт',
  'general',
  'Терапевт',
  15,
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300',
  ARRAY['EN', 'TH'],
  1500,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  true
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Natcha Wong',
  'Др. Натча Вонг',
  'cardio',
  'Кардиолог',
  12,
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
  ARRAY['EN', 'TH', 'RU'],
  2500,
  ARRAY['monday', 'wednesday', 'friday'],
  true
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.doctors (clinic_id, name_en, name_ru, specialty, specialty_ru, experience_years, photo, languages, consultation_price, available_days, is_available) 
SELECT 
  c.id,
  'Dr. Apinya Chen',
  'Др. Апиня Чен',
  'dental',
  'Стоматолог',
  8,
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300',
  ARRAY['EN', 'TH', 'RU'],
  800,
  ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  true
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';

-- Insert sample services
INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'General Consultation', 'Общая консультация', 'consultation', 'general', 1500, 30
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'ECG Test', 'ЭКГ', 'diagnostic', 'cardio', 800, 20
FROM public.clinics c WHERE c.name_en = 'Bangkok Hospital Phuket';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'Teeth Cleaning', 'Чистка зубов', 'procedure', 'dental', 1200, 45
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';

INSERT INTO public.medical_services (clinic_id, name_en, name_ru, category, specialty, price, duration_minutes)
SELECT c.id, 'Dental X-Ray', 'Рентген зубов', 'diagnostic', 'dental', 500, 15
FROM public.clinics c WHERE c.name_en = 'Phuket Dental Signature';