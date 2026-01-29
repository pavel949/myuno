
-- Add Expat Services category group with proper UUID
INSERT INTO category_groups (slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('expat-services', 'Expat Services', 'Услуги для экспатов', 'Globe', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru,
  sort_order = EXCLUDED.sort_order;

-- Add expat categories using subquery for group_id
INSERT INTO categories (slug, name_en, name_ru, icon, color, group_id, mini_app_type, sort_order, is_active, is_new)
VALUES
  ('banking', 'Banks & Finance', 'Банки и финансы', 'Landmark', 'from-emerald-500 to-teal-600', (SELECT id FROM category_groups WHERE slug = 'expat-services'), 'banking', 1, true, true),
  ('visa', 'Visa & Immigration', 'Визы и иммиграция', 'Stamp', 'from-blue-500 to-indigo-600', (SELECT id FROM category_groups WHERE slug = 'expat-services'), 'visa', 2, true, true),
  ('education-expat', 'Education', 'Образование', 'GraduationCap', 'from-purple-500 to-violet-600', (SELECT id FROM category_groups WHERE slug = 'expat-services'), 'education', 3, true, false),
  ('veterinary', 'Veterinary', 'Ветеринары', 'Stethoscope', 'from-pink-500 to-rose-600', (SELECT id FROM category_groups WHERE slug = 'expat-services'), 'veterinary', 4, true, true)
ON CONFLICT (slug) DO UPDATE SET
  group_id = EXCLUDED.group_id,
  is_new = EXCLUDED.is_new,
  sort_order = EXCLUDED.sort_order;

-- Create veterinary_clinics table
CREATE TABLE IF NOT EXISTS public.veterinary_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
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
  services TEXT[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  is_24h BOOLEAN DEFAULT false,
  has_emergency BOOLEAN DEFAULT false,
  home_visits BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price_consultation NUMERIC,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo TEXT,
  cover_image TEXT,
  bank_type TEXT DEFAULT 'commercial',
  services TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  accepts_foreigners BOOLEAN DEFAULT true,
  online_banking BOOLEAN DEFAULT true,
  mobile_app BOOLEAN DEFAULT true,
  swift_code TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  min_deposit NUMERIC,
  currency TEXT DEFAULT 'THB',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE veterinary_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for veterinary_clinics" ON veterinary_clinics FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for banks" ON banks FOR SELECT USING (is_active = true);

-- Provider write access
CREATE POLICY "Providers can manage own veterinary_clinics" ON veterinary_clinics 
  FOR ALL USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));
CREATE POLICY "Providers can manage own banks" ON banks 
  FOR ALL USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));

-- Seed veterinary clinics
INSERT INTO veterinary_clinics (name_en, name_ru, description_en, description_ru, address, district, lat, lng, phone, services, specializations, languages, is_24h, has_emergency, home_visits, rating, review_count, price_consultation, is_active, is_verified, is_featured) VALUES
('Phuket Animal Hospital', 'Пхукет Госпиталь для животных', 'Full-service veterinary hospital with modern equipment', 'Полноценный ветеринарный госпиталь с современным оборудованием', '123/4 Thepkrasattri Rd', 'Talad Yai', 7.8910, 98.3880, '+66 76 123 456', ARRAY['Surgery', 'Vaccination', 'Dental', 'X-Ray', 'Laboratory'], ARRAY['Dogs', 'Cats', 'Exotic'], ARRAY['English', 'Thai', 'Russian'], true, true, true, 4.8, 156, 800, true, true, true),
('Happy Paws Vet Clinic', 'Клиника Happy Paws', 'Friendly neighborhood vet clinic', 'Дружелюбная районная ветклиника', '45 Rat-U-Thit Rd', 'Patong', 7.8965, 98.2988, '+66 76 234 567', ARRAY['Vaccination', 'Check-up', 'Grooming', 'Pet Hotel'], ARRAY['Dogs', 'Cats'], ARRAY['English', 'Thai'], false, false, true, 4.6, 89, 500, true, true, false),
('Laguna Veterinary Center', 'Ветеринарный центр Лагуна', 'Premium pet care in Laguna area', 'Премиальный уход за питомцами в районе Лагуны', 'Laguna Complex', 'Cherngtalay', 7.9821, 98.2901, '+66 76 345 678', ARRAY['Surgery', 'Vaccination', 'Dental', 'Boarding'], ARRAY['Dogs', 'Cats', 'Birds'], ARRAY['English', 'Thai'], false, true, false, 4.7, 67, 1000, true, true, true),
('Chalong Pet Hospital', 'Чалонг Госпиталь для питомцев', 'Comprehensive veterinary services', 'Комплексные ветеринарные услуги', '89 Chao Fa West Rd', 'Chalong', 7.8456, 98.3367, '+66 76 456 789', ARRAY['Surgery', 'Vaccination', 'Emergency', 'Laboratory'], ARRAY['Dogs', 'Cats', 'Reptiles'], ARRAY['English', 'Thai'], true, true, true, 4.5, 112, 600, true, true, false),
('Kata Vet Care', 'Ката Вет Кеар', 'Small animal veterinary practice', 'Ветеринарная практика для мелких животных', '22 Kata Rd', 'Kata', 7.8234, 98.3012, '+66 76 567 890', ARRAY['Vaccination', 'Check-up', 'Dental'], ARRAY['Dogs', 'Cats'], ARRAY['English', 'Thai', 'German'], false, false, false, 4.4, 45, 450, true, false, false),
('Royal Phuket Vet', 'Роял Пхукет Вет', 'Luxury pet healthcare', 'Люксовое здравоохранение для питомцев', 'Boat Avenue', 'Cherngtalay', 7.9912, 98.2845, '+66 76 678 901', ARRAY['Surgery', 'Vaccination', 'Spa', 'Grooming', 'Hotel'], ARRAY['Dogs', 'Cats', 'Exotic'], ARRAY['English', 'Thai', 'Russian', 'Chinese'], false, true, true, 4.9, 203, 1500, true, true, true),
('Pet Emergency Phuket', 'Экстренная помощь питомцам Пхукет', '24/7 emergency veterinary services', 'Круглосуточная экстренная ветеринарная помощь', '56 Yaowarat Rd', 'Phuket Town', 7.8823, 98.3912, '+66 76 789 012', ARRAY['Emergency', 'Surgery', 'ICU', 'Blood Bank'], ARRAY['Dogs', 'Cats'], ARRAY['English', 'Thai'], true, true, true, 4.7, 178, 1200, true, true, true),
('Rawai Pet Clinic', 'Равай Клиника для питомцев', 'Caring for your pets since 2010', 'Заботимся о ваших питомцах с 2010 года', '33 Wiset Rd', 'Rawai', 7.7812, 98.3234, '+66 76 890 123', ARRAY['Vaccination', 'Check-up', 'Dental', 'Surgery'], ARRAY['Dogs', 'Cats'], ARRAY['English', 'Thai'], false, false, true, 4.3, 56, 400, true, false, false),
('Kamala Animal Care', 'Камала Забота о животных', 'Community vet clinic', 'Общественная ветклиника', '78 Kamala Beach Rd', 'Kamala', 7.9534, 98.2801, '+66 76 901 234', ARRAY['Vaccination', 'Sterilization', 'Check-up'], ARRAY['Dogs', 'Cats'], ARRAY['English', 'Thai'], false, false, true, 4.2, 34, 350, true, false, false),
('Phuket Exotic Vet', 'Пхукет Экзотик Вет', 'Specialized in exotic animals', 'Специализация на экзотических животных', '12 Dibuk Rd', 'Phuket Town', 7.8845, 98.3867, '+66 76 012 345', ARRAY['Exotic Care', 'Surgery', 'Boarding'], ARRAY['Reptiles', 'Birds', 'Small Mammals'], ARRAY['English', 'Thai'], false, true, false, 4.6, 89, 900, true, true, false);

-- Seed banks
INSERT INTO banks (name_en, name_ru, description_en, description_ru, bank_type, services, features, languages, accepts_foreigners, online_banking, mobile_app, swift_code, website, phone, min_deposit, rating, review_count, is_active, is_featured) VALUES
('Bangkok Bank', 'Бангкок Банк', 'Thailand''s largest commercial bank', 'Крупнейший коммерческий банк Таиланда', 'commercial', ARRAY['Savings Account', 'Current Account', 'Fixed Deposit', 'Loans', 'Credit Cards'], ARRAY['ATM Network', 'International Transfers', 'Multi-currency'], ARRAY['English', 'Thai', 'Chinese'], true, true, true, 'BKKBTHBK', 'https://www.bangkokbank.com', '1333', 500, 4.5, 234, true, true),
('Kasikornbank', 'Касикорнбанк', 'Leading Thai bank with excellent digital services', 'Ведущий тайский банк с отличными цифровыми услугами', 'commercial', ARRAY['Savings Account', 'Current Account', 'Investment', 'Insurance', 'Credit Cards'], ARRAY['K PLUS App', 'QR Payment', 'International Transfers'], ARRAY['English', 'Thai'], true, true, true, 'KASITHBK', 'https://www.kasikornbank.com', '02-888-8888', 0, 4.6, 312, true, true),
('SCB', 'СКБ', 'Siam Commercial Bank - innovative banking', 'Сиам Коммерческий Банк - инновационный банкинг', 'commercial', ARRAY['Savings Account', 'Digital Banking', 'Wealth Management', 'Loans'], ARRAY['SCB Easy App', 'Contactless Payment', 'Investment Platform'], ARRAY['English', 'Thai'], true, true, true, 'SICOTHBK', 'https://www.scb.co.th', '02-777-7777', 0, 4.5, 278, true, true),
('Krungthai Bank', 'Крунгтай Банк', 'Government-owned bank with wide coverage', 'Государственный банк с широким охватом', 'government', ARRAY['Savings Account', 'Government Services', 'Loans', 'Insurance'], ARRAY['Krungthai NEXT', 'PromptPay', 'Wide ATM Network'], ARRAY['English', 'Thai'], true, true, true, 'KRTHTHBK', 'https://www.ktb.co.th', '02-111-1111', 0, 4.3, 189, true, false),
('UOB Thailand', 'UOB Таиланд', 'Singapore-based international bank', 'Сингапурский международный банк', 'international', ARRAY['Savings Account', 'Wealth Management', 'Business Banking', 'Credit Cards'], ARRAY['UOB TMRW App', 'Regional Network', 'Priority Banking'], ARRAY['English', 'Thai', 'Chinese'], true, true, true, 'UOBOTHBK', 'https://www.uob.co.th', '02-285-1555', 5000, 4.4, 145, true, false),
('CIMB Thai', 'СИМБ Тай', 'Malaysian-based regional bank', 'Малайзийский региональный банк', 'international', ARRAY['Savings Account', 'Fixed Deposit', 'Home Loans', 'Personal Loans'], ARRAY['CIMB Clicks', 'High Interest Savings', 'No-fee ATM'], ARRAY['English', 'Thai'], true, true, true, 'UBOBTHBK', 'https://www.cimbthai.com', '02-626-7777', 0, 4.2, 98, true, false),
('Citibank Thailand', 'Ситибанк Таиланд', 'Global banking for expats', 'Глобальный банкинг для экспатов', 'international', ARRAY['Citigold', 'Credit Cards', 'Investment', 'Insurance'], ARRAY['Global Transfers', 'Priority Banking', 'Airport Lounge'], ARRAY['English', 'Thai'], true, true, true, 'CITITHBX', 'https://www.citibank.co.th', '1588', 50000, 4.5, 167, true, true),
('TMBThanachart', 'ТМБТанахарт', 'Merged bank with digital focus', 'Объединённый банк с цифровым фокусом', 'commercial', ARRAY['Savings Account', 'ttb touch', 'Loans', 'Insurance'], ARRAY['No-fee Banking', 'Digital First', 'Cashback Rewards'], ARRAY['English', 'Thai'], true, true, true, 'TABOROBK', 'https://www.ttbbank.com', '1428', 0, 4.3, 156, true, false),
('Bank of Ayudhya', 'Банк Аюттхая', 'Krungsri - MUFG Group member', 'Крунгсри - член группы MUFG', 'commercial', ARRAY['Savings Account', 'Auto Loans', 'Credit Cards', 'Investment'], ARRAY['Krungsri Mobile', 'Auto Finance Leader', 'Japanese Network'], ARRAY['English', 'Thai', 'Japanese'], true, true, true, 'AYUDTHBK', 'https://www.krungsri.com', '1572', 0, 4.4, 198, true, false),
('Government Savings Bank', 'Государственный сберегательный банк', 'Government bank for savings', 'Государственный банк для сбережений', 'government', ARRAY['Savings Account', 'Fixed Deposit', 'Lottery Savings', 'Home Loans'], ARRAY['Wide Branch Network', 'High Interest', 'Government Backed'], ARRAY['Thai', 'English'], true, true, true, 'GSBATHBK', 'https://www.gsb.or.th', '1115', 0, 4.1, 87, true, false);
