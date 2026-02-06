
-- Transfers vertical schema extensions
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS booking_flow text DEFAULT 'in_app_request',
ADD COLUMN IF NOT EXISTS marketing_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS operating_hours text DEFAULT '24/7',
ADD COLUMN IF NOT EXISTS night_service boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS wheelchair_access boolean DEFAULT false;

-- Transfer taxonomy in lookup_values
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('transfer_type','airport_transfer','Airport Transfer','Трансфер аэропорт','✈️',1,true),
  ('transfer_type','point_to_point','Point to Point','Точка-точка','📍',2,true),
  ('transfer_type','hourly_charter','Hourly Charter','Почасовой','⏰',3,true),
  ('transfer_type','intercity','Intercity','Междугородний','🛣️',4,true),
  ('transfer_type','group_transfer','Group Transfer','Групповой','👥',5,true),
  ('transfer_vehicle','sedan','Sedan','Седан','🚗',1,true),
  ('transfer_vehicle','suv','SUV','Внедорожник','🚙',2,true),
  ('transfer_vehicle','minivan','Minivan','Минивэн','🚐',3,true),
  ('transfer_vehicle','van','Van (10+ pax)','Вэн (10+ чел)','🚌',4,true),
  ('transfer_vehicle','luxury','Luxury / VIP','Люкс / VIP','🏎️',5,true),
  ('transfer_vehicle','bus','Bus','Автобус','🚎',6,true),
  ('transfer_feature','meet_and_greet','Meet & Greet','Встреча с табличкой','🤝',1,true),
  ('transfer_feature','flight_tracking','Flight Tracking','Отслеживание рейса','📡',2,true),
  ('transfer_feature','luggage_assistance','Luggage Assistance','Помощь с багажом','🧳',3,true),
  ('transfer_feature','child_seat','Child Seat','Детское кресло','👶',4,true),
  ('transfer_feature','night_service','Night Service','Ночной сервис','🌙',5,true),
  ('transfer_feature','wheelchair_access','Wheelchair Access','Доступ для колясок','♿',6,true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
