-- Create tours table
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.providers(id),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  duration_hours NUMERIC,
  max_participants INTEGER DEFAULT 10,
  meeting_point TEXT,
  meeting_point_lat NUMERIC,
  meeting_point_lng NUMERIC,
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  itinerary JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'easy',
  category TEXT DEFAULT 'sightseeing',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  available_days TEXT[] DEFAULT '{"mon","tue","wed","thu","fri","sat","sun"}',
  start_times TEXT[] DEFAULT '{"09:00"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active tours" 
ON public.tours 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all tours" 
ON public.tours 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers can manage their own tours" 
ON public.tours 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM providers
  WHERE providers.id = tours.provider_id 
  AND providers.user_id = auth.uid()
));

-- Create tour bookings table
CREATE TABLE public.tour_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id),
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'pending',
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_bookings
CREATE POLICY "Users can view their own tour bookings" 
ON public.tour_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tour bookings" 
ON public.tour_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour bookings" 
ON public.tour_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tour bookings" 
ON public.tour_bookings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert demo tours
INSERT INTO public.tours (title_en, title_ru, description_en, description_ru, cover_image, price, duration_hours, category, difficulty, highlights, includes, itinerary, rating, review_count, is_featured) VALUES
('Phi Phi Islands Day Trip', 'Острова Пхи-Пхи на целый день', 'Explore the stunning Phi Phi Islands with snorkeling, swimming, and beach time at Maya Bay.', 'Исследуйте потрясающие острова Пхи-Пхи со снорклингом, плаванием и отдыхом на пляже Майя Бэй.', 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800', 2500, 10, 'islands', 'easy', '{"Maya Bay","Phi Phi Viewpoint","Snorkeling","Lunch included"}', '{"Speedboat transfer","Lunch","Snorkeling equipment","National park fee","Hotel pickup"}', '[{"time":"07:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"08:30","title_en":"Departure from pier","title_ru":"Отправление с пирса"},{"time":"10:00","title_en":"Maya Bay visit","title_ru":"Посещение бухты Майя"},{"time":"12:00","title_en":"Lunch at Phi Phi Don","title_ru":"Обед на Пхи-Пхи Дон"},{"time":"14:00","title_en":"Snorkeling","title_ru":"Снорклинг"},{"time":"17:00","title_en":"Return to Phuket","title_ru":"Возвращение на Пхукет"}]', 4.8, 324, true),
('James Bond Island Tour', 'Тур на остров Джеймса Бонда', 'Visit the famous James Bond Island and explore Phang Nga Bay by longtail boat.', 'Посетите знаменитый остров Джеймса Бонда и исследуйте залив Пханг Нга на лодке.', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800', 1800, 8, 'islands', 'easy', '{"James Bond Island","Kayaking","Cave exploration","Floating village"}', '{"Longtail boat","Lunch","Kayak rental","National park fee","Guide"}', '[{"time":"08:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"09:30","title_en":"Arrive at pier","title_ru":"Прибытие на пирс"},{"time":"10:30","title_en":"James Bond Island","title_ru":"Остров Джеймса Бонда"},{"time":"12:30","title_en":"Lunch","title_ru":"Обед"},{"time":"14:00","title_en":"Kayaking in caves","title_ru":"Каякинг в пещерах"},{"time":"16:00","title_en":"Return","title_ru":"Возвращение"}]', 4.7, 256, true),
('Big Buddha & Temples Tour', 'Тур Большой Будда и Храмы', 'Cultural tour visiting Big Buddha, Wat Chalong, and other sacred temples of Phuket.', 'Культурный тур с посещением Большого Будды, храма Ват Чалонг и других святынь Пхукета.', 'https://images.unsplash.com/photo-1569824086367-0ce8f00ae80e?w=800', 1200, 5, 'culture', 'easy', '{"Big Buddha","Wat Chalong","Old Phuket Town","Local market"}', '{"Air-conditioned van","English guide","Entrance fees","Water"}', '[{"time":"09:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"10:00","title_en":"Big Buddha","title_ru":"Большой Будда"},{"time":"11:30","title_en":"Wat Chalong","title_ru":"Ват Чалонг"},{"time":"13:00","title_en":"Old Town walk","title_ru":"Прогулка по старому городу"},{"time":"14:00","title_en":"Return","title_ru":"Возвращение"}]', 4.6, 189, false),
('Elephant Sanctuary Visit', 'Посещение слоновьего заповедника', 'Ethical elephant experience with feeding, bathing, and learning about elephant conservation.', 'Этичное общение со слонами: кормление, купание и изучение охраны слонов.', 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800', 3500, 6, 'nature', 'easy', '{"Feed elephants","Mud bath","River bathing","Conservation talk"}', '{"Transport","Lunch","Change of clothes","Guide","Photos"}', '[{"time":"08:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"09:30","title_en":"Arrive at sanctuary","title_ru":"Прибытие в заповедник"},{"time":"10:00","title_en":"Meet the elephants","title_ru":"Знакомство со слонами"},{"time":"11:00","title_en":"Feeding time","title_ru":"Кормление"},{"time":"12:00","title_en":"Lunch","title_ru":"Обед"},{"time":"13:00","title_en":"Mud bath & river","title_ru":"Грязевая ванна и река"},{"time":"14:30","title_en":"Return","title_ru":"Возвращение"}]', 4.9, 412, true),
('Phuket City Night Tour', 'Ночной тур по Пхукету', 'Experience Phuket nightlife with street food, night markets, and entertainment.', 'Познайте ночную жизнь Пхукета: уличная еда, ночные рынки и развлечения.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 1500, 4, 'nightlife', 'easy', '{"Night market","Street food tasting","Bangla Road","Local bars"}', '{"Transport","Food tastings (5 dishes)","Drinks","Guide"}', '[{"time":"18:00","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"18:30","title_en":"Night market","title_ru":"Ночной рынок"},{"time":"20:00","title_en":"Street food tour","title_ru":"Тур по уличной еде"},{"time":"21:30","title_en":"Bangla Road","title_ru":"Бангла Роуд"},{"time":"22:30","title_en":"Return","title_ru":"Возвращение"}]', 4.5, 167, false),
('Snorkeling & Diving Trip', 'Снорклинг и дайвинг', 'Discover underwater world at Racha Islands with professional diving instructors.', 'Откройте подводный мир островов Рача с профессиональными инструкторами.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 4500, 8, 'water-sports', 'medium', '{"2 dive sites","Equipment included","Underwater photos","Marine life"}', '{"Boat transfer","Diving equipment","Instructor","Lunch","Insurance"}', '[{"time":"07:30","title_en":"Hotel pickup","title_ru":"Забор из отеля"},{"time":"08:30","title_en":"Briefing at pier","title_ru":"Инструктаж на пирсе"},{"time":"09:30","title_en":"First dive","title_ru":"Первое погружение"},{"time":"12:00","title_en":"Lunch on boat","title_ru":"Обед на лодке"},{"time":"13:30","title_en":"Second dive","title_ru":"Второе погружение"},{"time":"16:00","title_en":"Return","title_ru":"Возвращение"}]', 4.8, 298, true);

-- Create updated_at trigger
CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tour_bookings_updated_at
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();