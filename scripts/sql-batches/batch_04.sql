-- Batch 4
-- Migration: 20260129095332_9433be36-7cdc-4f91-a703-bed4a6479107.sql
-- =============================================
-- SEED DATA: Restaurants (22 records) - price_range 1-4 only
-- =============================================

INSERT INTO restaurants (
  name_en, name_ru, cuisine, description_en, description_ru,
  address, district, phone, price_range, delivery_available, delivery_fee,
  min_order_amount, rating, review_count, is_active, is_featured, is_verified,
  lat, lng, cover_image
) VALUES
-- Thai Cuisine
('Baan Rim Pa', 'Баан Рим Па', 'Thai', 
 'Award-winning Thai restaurant with ocean views', 'Отмеченный наградами тайский ресторан с видом на океан',
 '223 Prabaramee Road, Patong', 'Patong', '+66 76 340 789', 4, true, 50, 500, 4.8, 234, true, true, true,
 7.8967, 98.2789, 'https://images.unsplash.com/photo-1559314809-0d155014e29e'),

('Kaab Gluay', 'Кааб Глуай', 'Thai',
 'Authentic Southern Thai cuisine in casual setting', 'Аутентичная южная тайская кухня в непринужденной обстановке',
 '58/3 Soi Romanee, Old Town', 'Old Town', '+66 76 211 456', 2, true, 30, 200, 4.6, 189, true, false, true,
 7.8837, 98.3867, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4'),

('Blue Elephant Phuket', 'Голубой Слон Пхукет', 'Thai',
 'Royal Thai cuisine in colonial mansion', 'Королевская тайская кухня в колониальном особняке',
 '96 Krabi Road, Old Town', 'Old Town', '+66 76 354 355', 4, false, 0, 0, 4.9, 312, true, true, true,
 7.8854, 98.3891, 'https://images.unsplash.com/photo-1552566626-52f8b828add9'),

('Raya Restaurant', 'Ресторан Рая', 'Thai',
 'Historic Phuket restaurant since 1974', 'Историческое заведение с 1974 года',
 '48/1 Dibuk Road, Old Town', 'Old Town', '+66 76 218 155', 3, true, 40, 300, 4.7, 278, true, true, true,
 7.8848, 98.3879, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'),

('Thong Dee Brasserie', 'Тонг Ди Брассери', 'Thai',
 'Modern Thai cuisine in stylish setting', 'Современная тайская кухня в стильном интерьере',
 '40/1 Srisoonthorn Road, Cherngtalay', 'Cherngtalay', '+66 76 325 890', 3, true, 60, 400, 4.7, 198, true, false, true,
 7.9834, 98.2967, 'https://images.unsplash.com/photo-1544025162-d76d292cb2e5'),

-- Italian Cuisine
('La Gritta', 'Ла Гритта', 'Italian',
 'Italian fine dining at Amari Resort', 'Итальянский ресторан при Amari Resort',
 'Amari Phuket, Patong Beach', 'Patong', '+66 76 340 106', 4, false, 0, 0, 4.8, 198, true, true, true,
 7.8923, 98.2967, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0'),

('Rossovivo Italian Restaurant', 'Россовиво', 'Italian',
 'Authentic Italian pizzeria and pasta', 'Аутентичная итальянская пиццерия',
 '5/50 Viset Road, Rawai', 'Rawai', '+66 76 288 289', 3, true, 60, 400, 4.5, 156, true, false, true,
 7.7801, 98.3256, 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b'),

('Acqua Restaurant', 'Аква Ресторан', 'Italian',
 'Mediterranean cuisine with sea views', 'Средиземноморская кухня с видом на море',
 '324/15 Prabaramee Road', 'Kalim', '+66 76 618 127', 4, false, 0, 0, 4.9, 245, true, true, true,
 7.9045, 98.2823, 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'),

-- Japanese Cuisine
('Takumi Japanese Restaurant', 'Такуми', 'Japanese',
 'Premium sushi and teppanyaki', 'Премиум суши и теппаняки',
 'JW Marriott Phuket, Mai Khao', 'Mai Khao', '+66 76 338 000', 4, false, 0, 0, 4.8, 167, true, true, true,
 8.1567, 98.2934, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c'),

('Sushi Box Phuket', 'Суши Бокс Пхукет', 'Japanese',
 'Fresh sushi delivery and takeaway', 'Свежие суши с доставкой',
 '12/8 Rat-U-Thit Road, Patong', 'Patong', '+66 76 345 678', 3, true, 40, 350, 4.4, 234, true, false, true,
 7.8912, 98.2934, 'https://images.unsplash.com/photo-1553621042-f6e147245754'),

('Kabuki Japanese Restaurant', 'Кабуки', 'Japanese',
 'Traditional Japanese in modern setting', 'Традиционная японская кухня в современной обстановке',
 'Central Floresta, Kathu', 'Kathu', '+66 76 604 567', 3, true, 50, 500, 4.6, 189, true, false, true,
 7.9123, 98.3345, 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10'),

-- Indian Cuisine
('Tandoori Flames', 'Тандури Флеймс', 'Indian',
 'North Indian and tandoor specialties', 'Северо-индийские блюда из тандыра',
 '84/2 Thaweewong Road, Patong', 'Patong', '+66 76 340 567', 3, true, 45, 350, 4.5, 178, true, false, true,
 7.8945, 98.2956, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe'),

('Royal India Restaurant', 'Роял Индия', 'Indian',
 'Authentic Indian cuisine since 1995', 'Аутентичная индийская кухня с 1995 года',
 '45 Rat-U-Thit 200 Pee Road', 'Patong', '+66 76 292 445', 3, true, 40, 300, 4.6, 234, true, true, true,
 7.8901, 98.2978, 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40'),

-- Seafood
('Kan Eang @ Pier', 'Кан Инг @ Пиер', 'Seafood',
 'Famous seafood restaurant on pier', 'Знаменитый ресторан морепродуктов на пирсе',
 '44/1 Viset Road, Chalong Bay', 'Chalong', '+66 76 381 212', 3, false, 0, 0, 4.7, 456, true, true, true,
 7.8234, 98.3567, 'https://images.unsplash.com/photo-1579631542720-3a87824fff86'),

('Laem Hin Seafood', 'Лаем Хин Сифуд', 'Seafood',
 'Fresh catch of the day with local recipes', 'Свежий улов дня по местным рецептам',
 'Laem Hin Pier, Saphan Hin', 'Phuket Town', '+66 76 239 357', 2, false, 0, 0, 4.5, 312, true, false, true,
 7.8523, 98.4012, 'https://images.unsplash.com/photo-1559339352-11d035aa65de'),

('Bang Pae Seafood', 'Банг Пэ Сифуд', 'Seafood',
 'Local favorite with mountain views', 'Любимое место местных с видом на горы',
 'Bang Pae Waterfall Road', 'Thalang', '+66 76 311 234', 2, false, 0, 0, 4.4, 189, true, false, true,
 8.0234, 98.3789, 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7'),

-- International
('Suay Restaurant', 'Суай Ресторан', 'International',
 'Modern fusion cuisine in Cherngtalay', 'Современная фьюжн кухня',
 '177/99 Moo 4, Cherngtalay', 'Cherngtalay', '+66 76 271 170', 4, true, 70, 600, 4.7, 234, true, true, true,
 7.9789, 98.2934, 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b'),

('The Kitchen Table', 'Кухонный Стол', 'International',
 'Farm to table concept restaurant', 'Ресторан с концепцией "от фермы к столу"',
 '166/24 Rat-U-Thit Road', 'Patong', '+66 76 601 234', 3, true, 55, 450, 4.6, 167, true, false, true,
 7.8934, 98.2967, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17'),

-- Russian Cuisine
('Kalinka Russian Restaurant', 'Калинка', 'Russian',
 'Authentic Russian and Ukrainian cuisine', 'Аутентичная русская и украинская кухня',
 '58/12 Soi Bangla, Patong', 'Patong', '+66 76 296 234', 3, true, 50, 400, 4.3, 145, true, false, true,
 7.8923, 98.2978, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445'),

-- Chinese
('Dim Sum House', 'Дим Сам Хаус', 'Chinese',
 'Traditional dim sum and Cantonese cuisine', 'Традиционные дим самы и кантонская кухня',
 'Central Festival, Wichit', 'Wichit', '+66 76 209 111', 2, true, 40, 300, 4.5, 212, true, false, true,
 7.8767, 98.3845, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624'),

-- Vegetarian
('Taste of Nature', 'Вкус Природы', 'Vegetarian',
 'Organic vegetarian and vegan cafe', 'Органическое вегетарианское кафе',
 '15/7 Phang Nga Road, Old Town', 'Old Town', '+66 76 222 456', 2, true, 35, 200, 4.6, 134, true, false, true,
 7.8845, 98.3889, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'),

-- Mexican
('Taco Casa Phuket', 'Тако Каса Пхукет', 'Mexican',
 'Authentic Mexican street food', 'Аутентичная мексиканская уличная еда',
 '89/1 Rat-U-Thit Road, Patong', 'Patong', '+66 76 512 345', 2, true, 40, 250, 4.4, 156, true, false, true,
 7.8912, 98.2956, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38');

-- =============================================
-- SEED DATA: Vehicles/Transport (10 cars)
-- =============================================

INSERT INTO vehicles (
  name_en, name_ru, description_en, description_ru, vehicle_type,
  capacity, luggage_capacity, doors, transmission, fuel_type,
  price_per_day, price_per_hour, deposit_amount, min_rental_days,
  free_km_per_day, extra_km_price, currency, features,
  rating, review_count, is_available, is_featured, is_verified, is_active,
  cover_image, year_built, color
) VALUES
-- Economy
('Toyota Yaris Ativ', 'Тойота Ярис Атив',
 'Compact and fuel-efficient sedan', 'Компактный и экономичный седан',
 'sedan', 5, 2, 4, 'automatic', 'petrol',
 800, 150, 5000, 1, 150, 5, 'THB',
 ARRAY['Air Conditioning', 'Bluetooth', 'USB Charging', 'GPS Navigation'],
 4.5, 89, true, false, true, true,
 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2', 2023, 'White'),

('Honda City', 'Хонда Сити',
 'Popular compact sedan with great mileage', 'Популярный компактный седан с отличным расходом',
 'sedan', 5, 3, 4, 'automatic', 'petrol',
 900, 170, 5000, 1, 150, 5, 'THB',
 ARRAY['Air Conditioning', 'Bluetooth', 'Cruise Control', 'Backup Camera'],
 4.6, 124, true, false, true, true,
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf', 2023, 'Silver'),

-- Mid-range
('Toyota Camry', 'Тойота Камри',
 'Comfortable mid-size sedan for business', 'Комфортный седан среднего класса для бизнеса',
 'sedan', 5, 3, 4, 'automatic', 'petrol',
 1500, 280, 10000, 1, 200, 7, 'THB',
 ARRAY['Leather Seats', 'Apple CarPlay', 'Android Auto', 'Premium Sound System'],
 4.7, 156, true, true, true, true,
 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb', 2024, 'Black'),

('Honda Accord', 'Хонда Аккорд',
 'Executive sedan with premium features', 'Представительский седан с премиальными функциями',
 'sedan', 5, 4, 4, 'automatic', 'hybrid',
 1600, 300, 10000, 1, 200, 7, 'THB',
 ARRAY['Leather Seats', 'Sunroof', 'Wireless Charging', 'Lane Assist'],
 4.8, 98, true, true, true, true,
 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6', 2024, 'Dark Blue'),

-- SUV
('Toyota Fortuner', 'Тойота Фортунер',
 '7-seater SUV perfect for families', '7-местный внедорожник для семьи',
 'suv', 7, 5, 5, 'automatic', 'diesel',
 2000, 380, 15000, 1, 200, 10, 'THB',
 ARRAY['4WD', 'Third Row Seating', 'Roof Rails', 'Hill Start Assist'],
 4.6, 178, true, true, true, true,
 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b', 2023, 'White'),

('Honda CR-V', 'Хонда СРВ',
 'Versatile compact SUV for any adventure', 'Универсальный компактный внедорожник',
 'suv', 5, 4, 5, 'automatic', 'petrol',
 1800, 340, 12000, 1, 200, 8, 'THB',
 ARRAY['AWD', 'Panoramic Roof', 'Hands-free Tailgate', 'Adaptive Cruise'],
 4.7, 145, true, false, true, true,
 'https://images.unsplash.com/photo-1568844293986-8c2a5b0e4c45', 2024, 'Red'),

-- Premium
('BMW 5 Series', 'БМВ 5 Серия',
 'Luxury executive sedan', 'Люксовый представительский седан',
 'luxury', 5, 4, 4, 'automatic', 'petrol',
 4500, 850, 30000, 1, 250, 15, 'THB',
 ARRAY['Massage Seats', 'Ambient Lighting', 'Harman Kardon', 'Gesture Control'],
 4.9, 67, true, true, true, true,
 'https://images.unsplash.com/photo-1555215695-3004980ad54e', 2024, 'Black'),

('Mercedes E-Class', 'Мерседес Е-Класс',
 'Premium comfort and technology', 'Премиальный комфорт и технологии',
 'luxury', 5, 4, 4, 'automatic', 'petrol',
 4800, 900, 30000, 1, 250, 15, 'THB',
 ARRAY['MBUX System', 'Burmester Sound', 'Heated/Cooled Seats', 'Head-Up Display'],
 4.9, 54, true, true, true, true,
 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068', 2024, 'Silver'),

-- Van
('Toyota Alphard', 'Тойота Альфард',
 'Luxury van for VIP transfers', 'Люксовый минивэн для VIP трансферов',
 'van', 7, 6, 5, 'automatic', 'hybrid',
 5500, 1000, 35000, 1, 200, 20, 'THB',
 ARRAY['Captain Seats', 'Ottoman Function', 'Rear Entertainment', 'Electric Doors'],
 4.9, 89, true, true, true, true,
 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e', 2024, 'Pearl White'),

('Hyundai H1', 'Хёндай H1',
 '11-seater minibus for groups', '11-местный микроавтобус для групп',
 'van', 11, 8, 5, 'automatic', 'diesel',
 2500, 480, 15000, 1, 200, 12, 'THB',
 ARRAY['Dual Air Conditioning', 'Large Luggage Space', 'USB Ports', 'Window Curtains'],
 4.5, 112, true, false, true, true,
 'https://images.unsplash.com/photo-1590088644987-9d9f5b1b8c8c', 2023, 'White');

-- =============================================
-- SEED DATA: Clinics (10 records)
-- =============================================

INSERT INTO clinics (
  name_en, name_ru, clinic_type, specialty, description_en, description_ru,
  address, district, phone, email, website,
  consultation_price, currency, languages, working_hours,
  is_24h, is_active, is_featured, is_verified, rating, review_count,
  cover_image, lat, lng
) VALUES
-- International Hospitals
('Bangkok Hospital Phuket', 'Бангкок Госпиталь Пхукет', 'hospital',
 ARRAY['General', 'Emergency', 'Cardiology', 'Orthopedics', 'Oncology'],
 'Leading international hospital with JCI accreditation', 'Ведущий международный госпиталь с аккредитацией JCI',
 '2/1 Hongyok Utis Road, Phuket Town', 'Phuket Town', '+66 76 254 425', 'info@phukethospital.com', 'https://www.phukethospital.com',
 1500, 'THB', ARRAY['English', 'Thai', 'Russian', 'Chinese', 'Japanese'],
 '{"monday": "24h", "tuesday": "24h", "wednesday": "24h", "thursday": "24h", "friday": "24h", "saturday": "24h", "sunday": "24h"}',
 true, true, true, true, 4.8, 567,
 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3', 7.8734, 98.3923),

('Phuket International Hospital', 'Пхукет Международный Госпиталь', 'hospital',
 ARRAY['General', 'Emergency', 'Surgery', 'Maternity', 'Pediatrics'],
 'Comprehensive healthcare with international standards', 'Комплексная медицинская помощь международного уровня',
 '44 Chalermprakiat Ror 9 Road', 'Phuket Town', '+66 76 249 400', 'info@phuket-inter-hospital.co.th', 'https://www.phuket-inter-hospital.co.th',
 1200, 'THB', ARRAY['English', 'Thai', 'Russian', 'German'],
 '{"monday": "24h", "tuesday": "24h", "wednesday": "24h", "thursday": "24h", "friday": "24h", "saturday": "24h", "sunday": "24h"}',
 true, true, true, true, 4.7, 423,
 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', 7.8845, 98.3889),

('Dibuk Hospital', 'Дибук Госпиталь', 'hospital',
 ARRAY['General', 'Orthopedics', 'Internal Medicine', 'Dermatology'],
 'Modern hospital in Old Town Phuket', 'Современный госпиталь в Старом городе',
 '89 Dibuk Road, Old Town', 'Old Town', '+66 76 211 114', 'contact@dibukhospital.com', 'https://www.dibukhospital.com',
 800, 'THB', ARRAY['English', 'Thai', 'Russian'],
 '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "08:00-18:00", "sunday": "09:00-15:00"}',
 false, true, false, true, 4.5, 234,
 'https://images.unsplash.com/photo-1538108149393-fbbd81895907', 7.8856, 98.3867),

-- Dental Clinics
('Phuket Dental Signature', 'Пхукет Дентал Сигнатуре', 'dental',
 ARRAY['General Dentistry', 'Implants', 'Cosmetic Dentistry', 'Orthodontics'],
 'Premium dental care with latest technology', 'Премиум стоматология с новейшими технологиями',
 '56/8 Rat-U-Thit Road, Patong', 'Patong', '+66 76 344 555', 'smile@phuketdentalsignature.com', 'https://www.phuketdentalsignature.com',
 1000, 'THB', ARRAY['English', 'Thai', 'Russian', 'German'],
 '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "09:00-17:00", "sunday": "closed"}',
 false, true, true, true, 4.9, 312,
 'https://images.unsplash.com/photo-1629909613654-28e377c37b09', 7.8934, 98.2967),

('Sea Smile Dental Clinic', 'Си Смайл Дентал', 'dental',
 ARRAY['General Dentistry', 'Teeth Whitening', 'Veneers', 'Root Canal'],
 'Friendly dental clinic with sea views', 'Дружелюбная клиника с видом на море',
 '42/1 Prachanukhro Road, Patong', 'Patong', '+66 76 345 789', 'info@seasmiledental.com', 'https://www.seasmiledental.com',
 600, 'THB', ARRAY['English', 'Thai', 'Russian'],
 '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-16:00", "sunday": "closed"}',
 false, true, false, true, 4.6, 189,
 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5', 7.8912, 98.2989),

-- Specialty Clinics
('Phuket Plastic Surgery Institute', 'Институт Пластической Хирургии Пхукет', 'clinic',
 ARRAY['Plastic Surgery', 'Cosmetic Surgery', 'Reconstructive Surgery'],
 'Board-certified surgeons for aesthetic procedures', 'Сертифицированные хирурги для эстетических процедур',
 '888 Moo 1, Wichit', 'Wichit', '+66 76 367 399', 'consult@phuketplasticsurgery.com', 'https://www.phuketplasticsurgery.com',
 2500, 'THB', ARRAY['English', 'Thai', 'Korean', 'Chinese'],
 '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00", "sunday": "closed"}',
 false, true, true, true, 4.8, 156,
 'https://images.unsplash.com/photo-1551190822-a9333d879b1f', 7.8678, 98.3734),

('Phuket Eye Hospital', 'Глазной Госпиталь Пхукет', 'clinic',
 ARRAY['Ophthalmology', 'LASIK', 'Cataract Surgery', 'Glaucoma'],
 'Specialized eye care center', 'Специализированный офтальмологический центр',
 '100/417 Chaofa Road, Wichit', 'Wichit', '+66 76 378 899', 'info@phuketeyehospital.com', 'https://www.phuketeyehospital.com',
 1000, 'THB', ARRAY['English', 'Thai', 'Russian'],
 '{"monday": "08:30-17:00", "tuesday": "08:30-17:00", "wednesday": "08:30-17:00", "thursday": "08:30-17:00", "friday": "08:30-17:00", "saturday": "08:30-12:00", "sunday": "closed"}',
 false, true, false, true, 4.7, 198,
 'https://images.unsplash.com/photo-1579684385127-1ef15d508118', 7.8612, 98.3656),

-- Traditional Medicine
('Phuket Wellness Clinic', 'Пхукет Велнес Клиник', 'clinic',
 ARRAY['Traditional Thai Medicine', 'Acupuncture', 'Herbal Medicine', 'Massage Therapy'],
 'Holistic wellness and traditional healing', 'Холистическое оздоровление и традиционное лечение',
 '23/5 Yaowarat Road, Old Town', 'Old Town', '+66 76 219 345', 'wellness@phuketwellness.com', 'https://www.phuketwellness.com',
 800, 'THB', ARRAY['English', 'Thai', 'Russian', 'Chinese'],
 '{"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-20:00", "saturday": "10:00-18:00", "sunday": "12:00-18:00"}',
 false, true, false, true, 4.6, 145,
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874', 7.8834, 98.3878),

-- Pediatric
('Happy Kids Clinic', 'Хэппи Кидс Клиник', 'clinic',
 ARRAY['Pediatrics', 'Vaccinations', 'Child Development', 'Allergy Testing'],
 'Child-friendly healthcare center', 'Детский медицинский центр',
 '45/12 Thepkrasattri Road', 'Thalang', '+66 76 311 567', 'care@happykidsclinic.com', 'https://www.happykidsclinic.com',
 700, 'THB', ARRAY['English', 'Thai', 'Russian'],
 '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-15:00", "sunday": "closed"}',
 false, true, false, true, 4.8, 234,
 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2', 7.9823, 98.3567),

-- Mental Health
('Phuket Mind Care Center', 'Пхукет Центр Заботы о Психике', 'clinic',
 ARRAY['Psychiatry', 'Psychology', 'Counseling', 'Addiction Treatment'],
 'Confidential mental health services', 'Конфиденциальные услуги психического здоровья',
 '88/22 Sakdidet Road, Wichit', 'Wichit', '+66 76 355 789', 'help@phuketmindcare.com', 'https://www.phuketmindcare.com',
 2000, 'THB', ARRAY['English', 'Thai', 'Russian', 'German'],
 '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "10:00-16:00", "sunday": "by appointment"}',
 false, true, true, true, 4.9, 89,
 'https://images.unsplash.com/photo-1576091160550-2173dba999ef', 7.8556, 98.3678);
-- Migration: 20260129100340_41e04dd9-5acb-4acb-aeb5-85e896605839.sql

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

-- Migration: 20260129101754_a5842641-a42b-45c8-8412-74369a2760ed.sql
-- =============================================
-- Add Fresh Food Categories: Seafood, Organic, Meat
-- =============================================

-- 1. Insert new categories
INSERT INTO marketplace_categories (slug, name_en, name_ru, description_en, description_ru, icon, gradient, image_url, sort_order, is_active)
VALUES
  ('seafood', 'Fish & Seafood', 'Рыба и морепродукты', 'Fresh fish, prawns, crabs, and premium seafood', 'Свежая рыба, креветки, крабы и премиум морепродукты', '🐟', 'from-cyan-500 to-blue-600', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80', 2, true),
  ('organic', 'Organic & Farm', 'Органика и фермерские', 'Fresh organic vegetables, fruits, dairy and eggs', 'Свежие органические овощи, фрукты, молочка и яйца', '🌿', 'from-green-500 to-emerald-600', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80', 3, true),
  ('meat', 'Meat & Poultry', 'Мясо и птица', 'Premium beef, pork, lamb, chicken and duck', 'Премиум говядина, свинина, баранина, курица и утка', '🥩', 'from-red-500 to-rose-600', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80', 4, true);

-- 2. Insert subcategories for Seafood
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('seafood', 'fresh-fish', 'Fresh Fish', 'Свежая рыба', '🐠', 1, true),
  ('seafood', 'shellfish', 'Seafood', 'Морепродукты', '🦐', 2, true),
  ('seafood', 'smoked-fish', 'Smoked Fish', 'Копчёная рыба', '🐟', 3, true),
  ('seafood', 'frozen-seafood', 'Frozen Seafood', 'Заморозка', '🧊', 4, true);

-- 3. Insert subcategories for Organic
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('organic', 'vegetables', 'Vegetables', 'Овощи', '🥬', 1, true),
  ('organic', 'fruits', 'Fruits', 'Фрукты', '🍎', 2, true),
  ('organic', 'dairy', 'Dairy', 'Молочка', '🥛', 3, true),
  ('organic', 'eggs', 'Eggs', 'Яйца', '🥚', 4, true),
  ('organic', 'honey-oils', 'Honey & Oils', 'Мёд и масла', '🍯', 5, true);

-- 4. Insert subcategories for Meat
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES
  ('meat', 'beef', 'Beef', 'Говядина', '🥩', 1, true),
  ('meat', 'pork', 'Pork', 'Свинина', '🐷', 2, true),
  ('meat', 'lamb', 'Lamb', 'Баранина', '🐑', 3, true),
  ('meat', 'chicken', 'Chicken', 'Курица', '🍗', 4, true),
  ('meat', 'duck', 'Duck', 'Утка', '🦆', 5, true),
  ('meat', 'minced', 'Minced Meat', 'Фарш', '🍖', 6, true);

-- 5. Insert Seafood products (~12 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('seafood', 'shellfish', 'Tiger Prawns', 'Тигровые креветки', 'Fresh jumbo tiger prawns, perfect for grilling', 'Свежие крупные тигровые креветки, идеальны для гриля', 450, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', true, true, true, true, 1),
  ('seafood', 'fresh-fish', 'Fresh Salmon Fillet', 'Филе лосося свежее', 'Premium Norwegian salmon fillet', 'Премиум филе норвежского лосося', 890, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&q=80', true, true, false, true, 2),
  ('seafood', 'fresh-fish', 'Sea Bass', 'Сибас', 'Whole fresh sea bass', 'Целый свежий сибас', 380, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600&q=80', true, false, false, true, 3),
  ('seafood', 'shellfish', 'Fresh Squid', 'Кальмары свежие', 'Cleaned fresh squid', 'Очищенные свежие кальмары', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=600&q=80', true, false, false, true, 4),
  ('seafood', 'shellfish', 'Mussels', 'Мидии', 'Fresh black mussels', 'Свежие чёрные мидии', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80', true, true, false, true, 5),
  ('seafood', 'shellfish', 'Blue Crab', 'Краб синий', 'Live blue swimming crab', 'Живой синий плавающий краб', 650, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1550747545-c896b5f89ff7?w=600&q=80', true, true, true, true, 6),
  ('seafood', 'shellfish', 'Fresh Oysters', 'Устрицы свежие', 'Premium fresh oysters', 'Премиум свежие устрицы', 150, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1606731219412-56d776cd1f57?w=600&q=80', true, true, false, true, 7),
  ('seafood', 'fresh-fish', 'Fresh Tuna Steak', 'Стейк тунца свежий', 'Sashimi grade fresh tuna', 'Тунец для сашими свежий', 520, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', true, true, false, true, 8),
  ('seafood', 'smoked-fish', 'Smoked Salmon', 'Лосось копчёный', 'Cold smoked Norwegian salmon', 'Холодного копчения норвежский лосось', 450, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80', true, true, false, true, 9),
  ('seafood', 'fresh-fish', 'Red Snapper', 'Красный окунь', 'Whole fresh red snapper', 'Целый свежий красный окунь', 350, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=600&q=80', true, false, false, true, 10),
  ('seafood', 'shellfish', 'Lobster', 'Лобстер', 'Live Boston lobster', 'Живой бостонский лобстер', 1800, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&q=80', true, true, true, true, 11),
  ('seafood', 'shellfish', 'Scallops', 'Гребешки', 'Fresh Hokkaido scallops', 'Свежие гребешки Хоккайдо', 580, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1626645738196-c2a72c1e3d25?w=600&q=80', true, true, false, true, 12);

-- 6. Insert Organic products (~10 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('organic', 'vegetables', 'Organic Tomatoes', 'Томаты органические', 'Farm fresh organic tomatoes', 'Фермерские органические томаты', 85, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1546470427-227c7369a577?w=600&q=80', true, true, false, true, 1),
  ('organic', 'fruits', 'Fresh Avocados', 'Авокадо свежие', 'Ripe ready-to-eat avocados', 'Спелые авокадо готовые к употреблению', 120, 'THB', '3pc', '3шт', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80', true, true, true, true, 2),
  ('organic', 'vegetables', 'Mixed Salad Greens', 'Микс салатов', 'Fresh organic salad mix', 'Свежий органический микс салатов', 95, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80', true, true, false, true, 3),
  ('organic', 'dairy', 'Organic Milk', 'Молоко органическое', 'Fresh organic whole milk', 'Свежее органическое цельное молоко', 75, 'THB', 'L', 'л', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', true, true, false, true, 4),
  ('organic', 'eggs', 'Free Range Eggs', 'Яйца домашние', 'Farm fresh free range eggs', 'Фермерские яйца свободного выгула', 90, 'THB', '10pc', '10шт', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80', true, true, true, true, 5),
  ('organic', 'fruits', 'Fresh Berries Mix', 'Микс ягод свежий', 'Strawberries, blueberries, raspberries', 'Клубника, голубика, малина', 180, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=600&q=80', true, true, false, true, 6),
  ('organic', 'dairy', 'Organic Butter', 'Масло органическое', 'Premium organic butter', 'Премиум органическое масло', 145, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80', true, false, false, true, 7),
  ('organic', 'vegetables', 'Fresh Mushrooms', 'Грибы свежие', 'Organic shiitake and oyster mushrooms', 'Органические шиитаке и вешенки', 120, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80', true, true, false, true, 8),
  ('organic', 'honey-oils', 'Cold Pressed Coconut Oil', 'Кокосовое масло холодного отжима', 'Virgin cold pressed coconut oil', 'Кокосовое масло первого холодного отжима', 280, 'THB', 'bottle', 'бут', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&q=80', true, true, false, true, 9),
  ('organic', 'honey-oils', 'Organic Honey', 'Мёд органический', 'Pure organic wildflower honey', 'Чистый органический цветочный мёд', 350, 'THB', 'jar', 'банка', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80', true, true, true, true, 10);

-- 7. Insert Meat & Poultry products (~15 items)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, sort_order)
VALUES
  ('meat', 'beef', 'Beef Ribeye Steak', 'Рибай стейк говяжий', 'Premium marbled beef ribeye', 'Премиум мраморный рибай', 890, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80', true, true, true, true, 1),
  ('meat', 'beef', 'Beef Tenderloin', 'Говяжья вырезка', 'Prime cut beef tenderloin', 'Отборная говяжья вырезка', 950, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1588347818036-558601350947?w=600&q=80', true, true, false, true, 2),
  ('meat', 'minced', 'Ground Beef', 'Говяжий фарш', 'Fresh ground beef, 80/20', 'Свежий говяжий фарш 80/20', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80', true, true, false, true, 3),
  ('meat', 'pork', 'Pork Loin', 'Свиная корейка', 'Boneless pork loin', 'Свиная корейка без кости', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=600&q=80', true, true, false, true, 4),
  ('meat', 'pork', 'Pork Belly', 'Свиная грудинка', 'Fresh pork belly with skin', 'Свежая свиная грудинка со шкуркой', 250, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1623047589613-1bd70f92f8c1?w=600&q=80', true, true, false, true, 5),
  ('meat', 'pork', 'Premium Bacon', 'Бекон премиум', 'Smoked streaky bacon', 'Копчёный бекон с прослойками', 195, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1606851091851-e8a5153b0f93?w=600&q=80', true, true, true, true, 6),
  ('meat', 'lamb', 'Lamb Rack', 'Каре ягнёнка', 'French trimmed lamb rack', 'Каре ягнёнка французская нарезка', 1200, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600&q=80', true, true, false, true, 7),
  ('meat', 'lamb', 'Lamb Leg', 'Нога ягнёнка', 'Bone-in lamb leg', 'Нога ягнёнка на кости', 680, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1608039858788-667850f129f6?w=600&q=80', true, false, false, true, 8),
  ('meat', 'chicken', 'Whole Chicken', 'Курица целая', 'Fresh whole chicken', 'Свежая целая курица', 160, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 9),
  ('meat', 'chicken', 'Chicken Breast', 'Куриная грудка', 'Boneless skinless chicken breast', 'Куриная грудка без кости и кожи', 180, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 10),
  ('meat', 'chicken', 'Chicken Thighs', 'Куриные бёдра', 'Bone-in chicken thighs', 'Куриные бёдра на кости', 140, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', true, true, false, true, 11),
  ('meat', 'chicken', 'Black Chicken', 'Чёрная курица', 'Silkie black chicken, whole', 'Шёлковая чёрная курица целая', 320, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=600&q=80', true, true, true, true, 12),
  ('meat', 'duck', 'Duck Breast', 'Утиная грудка', 'Premium duck breast', 'Премиум утиная грудка', 450, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&q=80', true, true, false, true, 13),
  ('meat', 'pork', 'Pork Sausages', 'Колбаски свиные', 'Gourmet pork sausages', 'Гурманские свиные колбаски', 220, 'THB', 'pack', 'уп', 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80', true, true, false, true, 14),
  ('meat', 'minced', 'Mixed Minced Meat', 'Смешанный фарш', 'Beef and pork mix', 'Микс говядины и свинины', 280, 'THB', 'kg', 'кг', 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&q=80', true, false, false, true, 15);
-- Migration: 20260129105318_5a83b680-577b-4fb6-a56c-7015f0ed760e.sql

-- Add recipe column to marketplace_products
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS recipe jsonb DEFAULT NULL;

-- Recipe structure: { "dish": "Tom Yum", "dish_ru": "Том Ям", "time_mins": 20, "difficulty": "easy", "image": "url", "tip": "Add at the end" }

COMMENT ON COLUMN marketplace_products.recipe IS 'Optional recipe info: dish name, cooking time, difficulty (easy/medium/hard), tip';

-- Migration: 20260129105823_d959bbdb-1bc7-4b65-806e-df8505bfa3d1.sql

-- Add category_group for food/non-food separation
ALTER TABLE marketplace_categories 
ADD COLUMN IF NOT EXISTS category_group text DEFAULT 'food';

-- Update categories with proper groups and sort order
-- FOOD GROUP (продовольственные)
UPDATE marketplace_categories SET category_group = 'food', sort_order = 1 WHERE slug = 'organic';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 2 WHERE slug = 'seafood';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 3 WHERE slug = 'meat';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 4 WHERE slug = 'groceries';
UPDATE marketplace_categories SET category_group = 'food', sort_order = 5 WHERE slug = 'drinks';

-- NON-FOOD GROUP (непродовольственные)
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 10 WHERE slug = 'thai-fashion';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 11 WHERE slug = 'cosmetics';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 12 WHERE slug = 'souvenirs';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 13 WHERE slug = 'home-decor';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 14 WHERE slug = 'baby-kids';
UPDATE marketplace_categories SET category_group = 'non-food', sort_order = 15 WHERE slug = 'health-pharmacy';

COMMENT ON COLUMN marketplace_categories.category_group IS 'Category group: food or non-food';

-- Migration: 20260129110719_b3018d16-afc3-4f67-b75d-1a7d74f5afbc.sql
-- Add international shipping fields to products
ALTER TABLE public.marketplace_products
ADD COLUMN IF NOT EXISTS is_shippable_international boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2) DEFAULT 0.3;

-- Create international shipping zones table
CREATE TABLE IF NOT EXISTS public.marketplace_international_shipping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_code text NOT NULL UNIQUE,
  zone_name_en text NOT NULL,
  zone_name_ru text NOT NULL,
  base_fee numeric(10,2) NOT NULL DEFAULT 500,
  per_kg_fee numeric(10,2) NOT NULL DEFAULT 100,
  estimated_days_min integer NOT NULL DEFAULT 7,
  estimated_days_max integer NOT NULL DEFAULT 14,
  min_order_amount numeric(10,2) NOT NULL DEFAULT 500,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_international_shipping ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_international_shipping' AND policyname = 'Anyone can view shipping zones') THEN
    CREATE POLICY "Anyone can view shipping zones"
    ON public.marketplace_international_shipping
    FOR SELECT USING (true);
  END IF;
END $$;

-- Seed shipping zones
INSERT INTO public.marketplace_international_shipping (zone_code, zone_name_en, zone_name_ru, base_fee, per_kg_fee, estimated_days_min, estimated_days_max, min_order_amount, sort_order) VALUES
('russia_cis', 'Russia & CIS', 'Россия и СНГ', 800, 150, 7, 14, 1000, 1),
('europe', 'Europe', 'Европа', 1200, 200, 10, 18, 1500, 2),
('asia', 'Asia', 'Азия', 500, 100, 5, 10, 800, 3),
('usa_canada', 'USA & Canada', 'США и Канада', 1500, 250, 12, 21, 2000, 4),
('other', 'Other Countries', 'Другие страны', 1800, 300, 14, 28, 2500, 5)
ON CONFLICT (zone_code) DO NOTHING;

-- Create new category: Thai Delicacies (for shippable food)
INSERT INTO public.marketplace_categories (slug, name_en, name_ru, icon, sort_order, is_active, category_group)
VALUES ('thai-delicacies', 'Thai Delicacies', 'Тайские деликатесы', 'Gift', 9, true, 'food')
ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en, name_ru = EXCLUDED.name_ru, category_group = EXCLUDED.category_group;

-- SEED DATA: Thai Delicacies (Shippable Food) - 12 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('thai-delicacies', 'Premium Dried Mango', 'Сушёное манго премиум', 'Sweet and chewy dried Thai mango, vacuum sealed', 'Сладкое тайское манго, вакуумная упаковка', 350, 'pack', 'уп.', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400', true, true, true, true, 0.25, 1),
('thai-delicacies', 'Coconut Rolls', 'Кокосовые роллы', 'Crispy coconut rolls with sesame', 'Хрустящие кокосовые роллы с кунжутом', 180, 'box', 'коробка', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', true, true, false, true, 0.3, 2),
('thai-delicacies', 'Cassava Chips', 'Чипсы из кассавы', 'Traditional Thai cassava chips, various flavors', 'Традиционные тайские чипсы из кассавы', 120, 'pack', 'уп.', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', true, false, true, true, 0.2, 3),
('thai-delicacies', 'Freeze-Dried Durian', 'Вяленый дуриан', 'Premium freeze-dried durian chips', 'Премиальный сублимированный дуриан', 450, 'pack', 'уп.', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400', true, true, true, true, 0.15, 4),
('thai-delicacies', 'Premium Fish Sauce', 'Рыбный соус премиум', 'Authentic Thai fish sauce, aged 2 years', 'Аутентичный тайский рыбный соус, 2 года выдержки', 280, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400', true, false, false, true, 0.75, 5),
('thai-delicacies', 'Coconut Milk Powder', 'Сухое кокосовое молоко', 'Instant coconut milk powder for cooking', 'Растворимый порошок кокосового молока', 220, 'pack', 'уп.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', true, false, false, true, 0.5, 6),
('thai-delicacies', 'Jasmine Rice Premium', 'Рис Жасмин премиум', 'Vacuum-packed Thai Hom Mali jasmine rice', 'Тайский рис Хом Мали в вакуумной упаковке', 380, 'kg', 'кг', 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400', true, true, false, true, 1.0, 7),
('thai-delicacies', 'Tom Yum Paste Set', 'Набор пасты Том Ям', 'Complete Tom Yum cooking paste kit', 'Полный набор пасты для Том Яма', 320, 'set', 'набор', 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=400', true, true, true, true, 0.4, 8),
('thai-delicacies', 'Green Curry Paste', 'Паста зелёный карри', 'Authentic Thai green curry paste', 'Аутентичная тайская паста зелёный карри', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, false, false, true, 0.35, 9),
('thai-delicacies', 'Red Curry Paste', 'Паста красный карри', 'Traditional Thai red curry paste', 'Традиционная тайская паста красный карри', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', true, false, false, true, 0.35, 10),
('thai-delicacies', 'Banana Chips', 'Банановые чипсы', 'Crispy fried banana chips', 'Хрустящие жареные банановые чипсы', 95, 'pack', 'уп.', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400', true, false, true, true, 0.2, 11),
('thai-delicacies', 'Tamarind Candy', 'Конфеты из тамаринда', 'Sweet and sour tamarind candies', 'Кисло-сладкие конфеты из тамаринда', 85, 'pack', 'уп.', 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400', true, true, false, true, 0.15, 12);

-- SEED DATA: Souvenirs (expand with shippable items) - 15 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('souvenirs', 'Doi Chaang Coffee', 'Кофе Дой Чаанг', 'Premium Thai arabica coffee beans from Chiang Rai', 'Премиальный тайский кофе арабика из Чианг Рая', 550, 'pack', 'уп.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400', true, true, true, true, 0.5, 20),
('souvenirs', 'Doi Tung Coffee', 'Кофе Дой Тунг', 'Royal project arabica coffee, medium roast', 'Кофе арабика королевского проекта, средняя обжарка', 480, 'pack', 'уп.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true, true, false, true, 0.5, 21),
('souvenirs', 'Cha Tra Mue Thai Tea', 'Тайский чай Ча Тра Мью', 'Original Thai milk tea mix, the famous orange tea', 'Оригинальный тайский чай, знаменитый оранжевый', 280, 'pack', 'уп.', 'https://images.unsplash.com/photo-1556679343-c1917e0d625c?w=400', true, true, true, true, 0.4, 22),
('souvenirs', 'Blue Butterfly Pea Tea', 'Синий чай Анчан', 'Organic butterfly pea flower tea', 'Органический чай из цветов анчана', 320, 'pack', 'уп.', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', true, true, true, true, 0.1, 23),
('souvenirs', 'Thai Spice Set', 'Набор тайских специй', 'Complete set of Thai cooking spices', 'Полный набор тайских специй для готовки', 750, 'set', 'набор', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', true, true, true, true, 0.6, 24),
('souvenirs', 'Celadon Ceramic Bowl', 'Керамика Селадон чаша', 'Traditional Thai celadon ceramic bowl', 'Традиционная тайская керамика Селадон', 890, 'pc', 'шт.', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', true, false, true, true, 0.8, 25),
('souvenirs', 'Benjarong Porcelain Cup', 'Фарфор Бенджаронг чашка', 'Hand-painted royal Thai porcelain', 'Расписной королевский тайский фарфор', 1200, 'pc', 'шт.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', true, false, true, true, 0.4, 26),
('souvenirs', 'Thai Triangle Pillow Mini', 'Тайская подушка-треугольник мини', 'Small decorative Thai triangle pillow', 'Маленькая декоративная тайская подушка', 650, 'pc', 'шт.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', true, true, false, true, 0.8, 27),
('souvenirs', 'Muay Thai Shorts', 'Шорты Муай Тай', 'Authentic Thai boxing shorts', 'Аутентичные шорты для тайского бокса', 450, 'pc', 'шт.', 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400', true, true, true, true, 0.25, 28),
('souvenirs', 'Thai Silver Bracelet 925', 'Серебряный браслет 925', 'Handmade Thai silver bracelet', 'Браслет из тайского серебра ручной работы', 1850, 'pc', 'шт.', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', true, false, true, true, 0.05, 29),
('souvenirs', 'Thai Silk Scarf', 'Шёлковый шарф тайский', 'Genuine Thai silk scarf, hand-woven', 'Настоящий тайский шёлк, ручное плетение', 1200, 'pc', 'шт.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', true, true, true, true, 0.15, 30),
('souvenirs', 'Aroma Candles Set', 'Набор ароматических свечей', 'Thai spa aromatherapy candles', 'Ароматерапевтические свечи тайского спа', 480, 'set', 'набор', 'https://images.unsplash.com/photo-1602607612066-d8ae38a54d19?w=400', true, true, false, true, 0.6, 31),
('souvenirs', 'Thai Incense Sticks', 'Тайские благовония', 'Traditional Thai temple incense', 'Традиционные тайские храмовые благовония', 150, 'box', 'коробка', 'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=400', true, false, false, true, 0.2, 32),
('souvenirs', 'Elephant Wood Carving', 'Деревянный слон резной', 'Hand-carved teak elephant figurine', 'Резной слон из тикового дерева', 750, 'pc', 'шт.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, true, true, true, 0.5, 33),
('souvenirs', 'Buddha Statue Bronze', 'Статуя Будды бронза', 'Small bronze Buddha statue', 'Маленькая бронзовая статуя Будды', 1500, 'pc', 'шт.', 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400', true, false, true, true, 1.2, 34);

-- SEED DATA: Cosmetics (expand with shippable items) - 12 items
INSERT INTO public.marketplace_products (category_slug, name_en, name_ru, description_en, description_ru, price, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_shippable_international, weight_kg, sort_order) VALUES
('cosmetics', 'Tiger Balm Original', 'Тигровый бальзам оригинал', 'Classic Tiger Balm red, pain relief', 'Классический красный Тигровый бальзам', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', true, true, true, true, 0.1, 50),
('cosmetics', 'Tiger Balm White', 'Тигровый бальзам белый', 'Tiger Balm white, headache relief', 'Белый Тигровый бальзам от головной боли', 180, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', true, true, false, true, 0.1, 51),
('cosmetics', 'Green Herb Balm', 'Зелёный травяной бальзам', 'Thai green herb balm for muscles', 'Тайский зелёный бальзам для мышц', 120, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, true, true, true, 0.08, 52),
('cosmetics', 'White Monkey Balm', 'Бальзам Белая обезьяна', 'Cooling white balm, Thai formula', 'Охлаждающий белый бальзам, тайская формула', 150, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, false, false, true, 0.08, 53),
('cosmetics', 'Snake Venom Balm', 'Змеиный бальзам', 'Thai snake venom pain relief balm', 'Тайский змеиный бальзам от боли', 250, 'jar', 'бан.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, true, true, true, 0.1, 54),
('cosmetics', 'Tamarind Face Scrub', 'Скраб для лица с тамариндом', 'Natural tamarind exfoliating scrub', 'Натуральный скраб-пилинг с тамариндом', 320, 'jar', 'бан.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', true, true, true, true, 0.15, 55),
('cosmetics', 'Rice Milk Face Mask', 'Маска с рисовым молоком', 'Whitening rice milk sheet mask', 'Отбеливающая маска с рисовым молоком', 85, 'pc', 'шт.', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', true, false, true, true, 0.03, 56),
('cosmetics', 'Coconut Oil Shampoo', 'Шампунь с кокосовым маслом', 'Natural coconut oil hair shampoo', 'Натуральный шампунь с кокосовым маслом', 280, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400', true, true, false, true, 0.4, 57),
('cosmetics', 'Mangosteen Soap', 'Мыло с мангостином', 'Handmade mangosteen antibacterial soap', 'Мыло с мангостином ручной работы', 120, 'bar', 'бр.', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', true, true, true, true, 0.12, 58),
('cosmetics', 'Papaya Soap', 'Папайя мыло', 'Natural papaya whitening soap', 'Натуральное отбеливающее мыло с папайей', 95, 'bar', 'бр.', 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', true, false, false, true, 0.1, 59),
('cosmetics', 'Aloe Vera Gel', 'Гель Алоэ Вера', 'Pure Thai aloe vera soothing gel', 'Чистый тайский гель алоэ вера', 180, 'tube', 'тюб.', 'https://images.unsplash.com/photo-1596755389578-c0b0e9a0e34e?w=400', true, true, false, true, 0.25, 60),
('cosmetics', 'Lemongrass Oil', 'Масло лемонграсса', 'Essential lemongrass aromatherapy oil', 'Эфирное масло лемонграсса для ароматерапии', 350, 'bottle', 'бут.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', true, false, true, true, 0.1, 61);

-- Mark existing souvenirs and cosmetics items as shippable
UPDATE public.marketplace_products 
SET is_shippable_international = true, weight_kg = COALESCE(weight_kg, 0.3)
WHERE category_slug IN ('souvenirs', 'cosmetics') 
AND (is_shippable_international IS NULL OR is_shippable_international = false);
-- Migration: 20260129111911_ec32ec38-5509-4ad8-a432-876357e1578c.sql

-- =====================================================
-- FULL SEED DATA FOR ALL MARKETPLACE CATEGORIES
-- =====================================================

-- Baby & Kids (0 -> 15 products)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, original_price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, vendor_name, vendor_name_ru, sort_order, is_shippable_international, weight_kg) VALUES
('baby-kids', 'diapers', 'Pampers Premium Care Diapers Size 4', 'Подгузники Pampers Premium Care Размер 4', 'Ultra-soft diapers with up to 12 hours of protection. Dermatologically tested, hypoallergenic.', 'Ультрамягкие подгузники с защитой до 12 часов. Дерматологически протестированы, гипоаллергенны.', 890, 1050, 'THB', 'pack/52pcs', 'упак/52шт', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', true, true, false, true, 'Pampers Thailand', 'Pampers Таиланд', 1, false, 1.2),
('baby-kids', 'diapers', 'Huggies Ultra Soft Diapers Size 3', 'Подгузники Huggies Ultra Soft Размер 3', 'Breathable diapers with wetness indicator. Gentle on baby skin.', 'Дышащие подгузники с индикатором влажности. Нежные к коже малыша.', 750, null, 'THB', 'pack/44pcs', 'упак/44шт', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400', true, false, false, true, 'Huggies', 'Huggies', 2, false, 1.0),
('baby-kids', 'food', 'Gerber Organic Baby Cereal Rice', 'Детская каша Gerber Органик Рисовая', 'USDA Organic certified rice cereal for babies 4+ months. No artificial flavors.', 'Рисовая каша с сертификатом USDA Organic для детей от 4 месяцев. Без искусственных добавок.', 320, null, 'THB', '227g', '227г', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400', true, true, false, true, 'Gerber', 'Gerber', 3, true, 0.3),
('baby-kids', 'food', 'Hipp Organic Baby Formula Stage 2', 'Смесь Hipp Organic Этап 2', 'Organic follow-on formula for babies 6-12 months. With DHA and prebiotics.', 'Органическая смесь для детей 6-12 месяцев. С DHA и пребиотиками.', 1450, 1600, 'THB', '800g', '800г', 'https://images.unsplash.com/photo-1584839404042-8bc22a0a6b6f?w=400', true, true, false, true, 'Hipp', 'Hipp', 4, true, 0.9),
('baby-kids', 'toys', 'Fisher-Price Laugh & Learn Smart Phone', 'Телефон Fisher-Price Смейся и Учись', 'Interactive toy phone with songs, phrases and light-up buttons. Ages 6-36 months.', 'Интерактивный телефон с песнями, фразами и светящимися кнопками. Возраст 6-36 месяцев.', 650, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400', true, true, true, true, 'Fisher-Price', 'Fisher-Price', 5, true, 0.3),
('baby-kids', 'toys', 'Lego Duplo My First Animal Brick Box', 'Lego Duplo Мои первые животные', 'Colorful animal building blocks for toddlers 18+ months. 34 pieces.', 'Цветные кубики с животными для малышей от 18 месяцев. 34 детали.', 1290, null, 'THB', 'set', 'набор', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400', true, true, false, true, 'LEGO', 'LEGO', 6, true, 0.5),
('baby-kids', 'care', 'Mustela Gentle Cleansing Gel', 'Mustela Мягкий очищающий гель', 'Plant-based cleansing gel for hair and body. Safe from birth. 500ml.', 'Очищающий гель на растительной основе для волос и тела. Безопасен с рождения. 500мл.', 890, null, 'THB', '500ml', '500мл', 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=400', true, false, false, true, 'Mustela', 'Mustela', 7, true, 0.6),
('baby-kids', 'care', 'Aveeno Baby Daily Moisture Lotion', 'Aveeno Baby Ежедневный увлажняющий лосьон', 'Colloidal oatmeal formula for 24-hour moisture. Fragrance-free.', 'Формула с коллоидной овсянкой для 24-часового увлажнения. Без отдушек.', 520, null, 'THB', '227ml', '227мл', 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400', true, false, false, true, 'Aveeno', 'Aveeno', 8, true, 0.3),
('baby-kids', 'clothing', 'Carters Organic Cotton Bodysuit 3-Pack', 'Carters Боди из органического хлопка 3шт', 'Soft organic cotton bodysuits in neutral colors. Snap buttons for easy changes.', 'Мягкие боди из органического хлопка в нейтральных цветах. Кнопки для удобной смены.', 890, 1100, 'THB', '3pcs', '3шт', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', true, true, true, true, 'Carters', 'Carters', 9, true, 0.2),
('baby-kids', 'clothing', 'H&M Baby Sleeping Bag', 'H&M Детский спальный мешок', 'Cozy sleeping bag with zipper. 100% cotton lining. TOG 2.5.', 'Уютный спальный мешок на молнии. Подкладка 100% хлопок. TOG 2.5.', 750, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400', true, false, false, true, 'H&M', 'H&M', 10, true, 0.4),
('baby-kids', 'gear', 'Baby Bjorn Bouncer Bliss', 'Baby Bjorn Шезлонг Bliss', 'Ergonomic baby bouncer with natural rocking. Machine washable fabric.', 'Эргономичный шезлонг с естественным покачиванием. Ткань можно стирать в машине.', 6500, 7200, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400', true, true, false, true, 'BabyBjorn', 'BabyBjorn', 11, true, 2.5),
('baby-kids', 'gear', 'Philips Avent Natural Bottles Set', 'Philips Avent Набор бутылочек Natural', 'Anti-colic bottles with soft nipple. BPA-free. 4oz/9oz combo pack.', 'Антиколиковые бутылочки с мягкой соской. Без BPA. Комбо-набор 125мл/260мл.', 1350, null, 'THB', 'set/4pcs', 'набор/4шт', 'https://images.unsplash.com/photo-1540479859555-17af45c78602?w=400', true, true, false, true, 'Philips Avent', 'Philips Avent', 12, true, 0.5),
('baby-kids', 'safety', 'Summer Infant Baby Monitor 2.0', 'Summer Infant Видеоняня 2.0', 'Digital video monitor with 2.4 inch color LCD screen. Night vision, two-way talk.', 'Цифровая видеоняня с 2.4 дюймовым цветным LCD экраном. Ночное видение, двусторонняя связь.', 3200, 3800, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1584839404042-8bc22a0a6b6f?w=400', true, true, true, true, 'Summer Infant', 'Summer Infant', 13, true, 0.4),
('baby-kids', 'safety', 'Safety 1st Cabinet Locks 12-Pack', 'Safety 1st Замки для шкафов 12шт', 'Child-proof magnetic cabinet locks. Easy installation, no tools needed.', 'Детские магнитные замки для шкафов. Простая установка без инструментов.', 650, null, 'THB', '12pcs', '12шт', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400', true, false, false, true, 'Safety 1st', 'Safety 1st', 14, true, 0.3),
('baby-kids', 'toys', 'Sophie la Girafe Teether', 'Жираф Софи Прорезыватель', 'Iconic natural rubber teething toy from France. 100% natural rubber.', 'Культовый прорезыватель из Франции. 100% натуральный каучук.', 890, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400', true, true, false, true, 'Sophie la Girafe', 'Sophie la Girafe', 15, true, 0.1);

-- Health & Pharmacy (0 -> 18 products)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, original_price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, vendor_name, vendor_name_ru, sort_order, is_shippable_international, weight_kg) VALUES
('health-pharmacy', 'vitamins', 'Blackmores Vitamin C 1000mg', 'Blackmores Витамин C 1000мг', 'High-potency vitamin C for immune support. 60 tablets.', 'Высокодозный витамин С для поддержки иммунитета. 60 таблеток.', 650, null, 'THB', '60 tablets', '60 таблеток', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', true, true, false, true, 'Blackmores', 'Blackmores', 1, true, 0.15),
('health-pharmacy', 'vitamins', 'Centrum Silver Adults 50+', 'Centrum Silver Взрослые 50+', 'Complete multivitamin for adults 50 and older. 100 tablets.', 'Полный комплекс витаминов для взрослых от 50 лет. 100 таблеток.', 890, 1050, 'THB', '100 tablets', '100 таблеток', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400', true, true, false, true, 'Centrum', 'Centrum', 2, true, 0.2),
('health-pharmacy', 'vitamins', 'Natures Bounty Fish Oil Omega-3', 'Natures Bounty Рыбий жир Омега-3', 'Triple strength fish oil 1400mg. Supports heart health. 130 softgels.', 'Тройная сила рыбьего жира 1400мг. Поддержка сердца. 130 капсул.', 1250, null, 'THB', '130 softgels', '130 капсул', 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400', true, true, false, true, 'Natures Bounty', 'Natures Bounty', 3, true, 0.25),
('health-pharmacy', 'pain-relief', 'Tylenol Extra Strength 500mg', 'Tylenol Extra Strength 500мг', 'Fast-acting pain relief and fever reducer. 100 caplets.', 'Быстродействующее обезболивающее и жаропонижающее. 100 капсул.', 420, null, 'THB', '100 caplets', '100 капсул', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', true, true, false, true, 'Tylenol', 'Tylenol', 4, false, 0.12),
('health-pharmacy', 'pain-relief', 'Salonpas Pain Relief Patches', 'Salonpas Обезболивающие пластыри', 'Effective muscle and joint pain relief. Box of 40 patches.', 'Эффективное обезболивание мышц и суставов. Упаковка 40 пластырей.', 380, null, 'THB', '40 patches', '40 пластырей', 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400', true, true, true, true, 'Salonpas', 'Salonpas', 5, true, 0.1),
('health-pharmacy', 'digestive', 'Probiotics Lactobacillus Complex', 'Пробиотики Лактобактерии Комплекс', '10 billion CFU probiotic blend. Supports digestive health. 30 capsules.', '10 миллиардов КОЕ пробиотиков. Поддержка пищеварения. 30 капсул.', 750, null, 'THB', '30 capsules', '30 капсул', 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400', true, false, false, true, 'Pharmacy Brand', 'Аптечный бренд', 6, true, 0.08),
('health-pharmacy', 'digestive', 'Gaviscon Double Action Liquid', 'Gaviscon Двойное действие жидкость', 'Fast relief from heartburn and acid reflux. 300ml bottle.', 'Быстрое облегчение изжоги и кислотного рефлюкса. Флакон 300мл.', 450, null, 'THB', '300ml', '300мл', 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400', true, true, false, true, 'Gaviscon', 'Gaviscon', 7, false, 0.35),
('health-pharmacy', 'first-aid', 'Johnson First Aid Kit Complete', 'Johnson Аптечка первой помощи полная', 'Complete first aid kit with 140 items. Perfect for home and travel.', 'Полная аптечка с 140 предметами. Идеально для дома и путешествий.', 890, 1100, 'THB', 'kit', 'набор', 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400', true, true, false, true, 'Johnson', 'Johnson', 8, true, 0.5),
('health-pharmacy', 'first-aid', 'Band-Aid Flexible Fabric 100 Count', 'Band-Aid Гибкий пластырь 100шт', 'Breathable fabric bandages for all wound types. Variety pack.', 'Дышащие тканевые пластыри для всех типов ран. Набор разных размеров.', 320, null, 'THB', '100pcs', '100шт', 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400', true, false, false, true, 'Band-Aid', 'Band-Aid', 9, true, 0.08),
('health-pharmacy', 'cold-flu', 'Strepsils Honey Lemon Lozenges', 'Strepsils Мёд и Лимон Леденцы', 'Sore throat relief with antibacterial action. 24 lozenges.', 'Облегчение боли в горле с антибактериальным действием. 24 леденца.', 180, null, 'THB', '24 lozenges', '24 леденца', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', true, true, false, true, 'Strepsils', 'Strepsils', 10, true, 0.05),
('health-pharmacy', 'cold-flu', 'Vicks VapoRub Ointment', 'Vicks VapoRub Мазь', 'Topical cough suppressant. Relieves cough and congestion. 50g.', 'Местное средство от кашля. Облегчает кашель и заложенность. 50г.', 220, null, 'THB', '50g', '50г', 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', true, true, false, true, 'Vicks', 'Vicks', 11, true, 0.08),
('health-pharmacy', 'allergy', 'Zyrtec Cetirizine 10mg', 'Zyrtec Цетиризин 10мг', '24-hour allergy relief. Non-drowsy formula. 30 tablets.', '24-часовое облегчение аллергии. Не вызывает сонливости. 30 таблеток.', 380, null, 'THB', '30 tablets', '30 таблеток', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', true, true, false, true, 'Zyrtec', 'Zyrtec', 12, false, 0.05),
('health-pharmacy', 'eye-care', 'Systane Ultra Lubricant Eye Drops', 'Systane Ultra Увлажняющие капли', 'Long-lasting dry eye relief. Preservative-free. 10ml.', 'Длительное облегчение сухости глаз. Без консервантов. 10мл.', 450, null, 'THB', '10ml', '10мл', 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400', true, false, false, true, 'Systane', 'Systane', 13, true, 0.05),
('health-pharmacy', 'dental', 'Sensodyne Repair Protect Toothpaste', 'Sensodyne Восстановление и Защита', 'Clinically proven relief for sensitive teeth. 100g tube.', 'Клинически доказанное облегчение чувствительности зубов. Тюбик 100г.', 280, null, 'THB', '100g', '100г', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', true, true, false, true, 'Sensodyne', 'Sensodyne', 14, true, 0.12),
('health-pharmacy', 'dental', 'Listerine Cool Mint Mouthwash', 'Listerine Прохладная Мята', 'Kills 99.9% of germs. Fresh breath for 24 hours. 500ml.', 'Убивает 99.9% бактерий. Свежее дыхание на 24 часа. 500мл.', 220, null, 'THB', '500ml', '500мл', 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400', true, false, false, true, 'Listerine', 'Listerine', 15, false, 0.55),
('health-pharmacy', 'skin-care', 'Bepanthen Wound Healing Cream', 'Bepanthen Заживляющий крем', 'Promotes natural healing of minor wounds. 30g tube.', 'Способствует естественному заживлению мелких ран. Тюбик 30г.', 320, null, 'THB', '30g', '30г', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', true, true, false, true, 'Bepanthen', 'Bepanthen', 16, true, 0.05),
('health-pharmacy', 'skin-care', 'Eucerin Original Healing Cream', 'Eucerin Оригинальный заживляющий крем', 'Intense moisturizer for very dry skin. Fragrance-free. 454g.', 'Интенсивное увлажнение для очень сухой кожи. Без отдушек. 454г.', 890, null, 'THB', '454g', '454г', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', true, false, false, true, 'Eucerin', 'Eucerin', 17, true, 0.5),
('health-pharmacy', 'supplements', 'Melatonin 5mg Sleep Support', 'Мелатонин 5мг Поддержка сна', 'Natural sleep aid. Fast dissolve tablets. 60 tablets.', 'Натуральное средство для сна. Быстрорастворимые таблетки. 60 таблеток.', 480, null, 'THB', '60 tablets', '60 таблеток', 'https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=400', true, true, true, true, 'Pharmacy Brand', 'Аптечный бренд', 18, true, 0.08);

-- Additional Home & Living products (4 -> 16 products)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, original_price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, vendor_name, vendor_name_ru, sort_order, is_shippable_international, weight_kg) VALUES
('home-decor', 'bedding', 'Egyptian Cotton Sheet Set 400TC', 'Комплект простыней из египетского хлопка 400TC', 'Luxurious 400 thread count sheets. Silky smooth finish. King size.', 'Роскошные простыни плотностью 400 нитей. Шелковистая гладкость. Размер King.', 3500, 4200, 'THB', 'set', 'комплект', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', true, true, false, true, 'Premium Home', 'Premium Home', 5, true, 1.5),
('home-decor', 'bedding', 'Memory Foam Pillow Contour', 'Ортопедическая подушка Memory Foam', 'Ergonomic contour pillow for neck support. Cooling gel layer.', 'Эргономичная контурная подушка для поддержки шеи. Охлаждающий гелевый слой.', 1450, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400', true, true, true, true, 'Sleep Well', 'Sleep Well', 6, true, 1.2),
('home-decor', 'kitchen', 'Le Creuset Cast Iron Dutch Oven', 'Le Creuset Чугунный горшок', 'Premium enameled cast iron. 5.5 qt capacity. Flame color.', 'Премиальный эмалированный чугун. Объём 5.2л. Цвет пламя.', 12500, 14000, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', true, true, false, true, 'Le Creuset', 'Le Creuset', 7, true, 5.5),
('home-decor', 'kitchen', 'Japanese Knife Set 5-Piece', 'Японские ножи набор 5шт', 'Damascus steel blades. Ergonomic handles. Chef, Santoku, Utility, Paring, Bread.', 'Лезвия из дамасской стали. Эргономичные ручки. Шеф, Сантоку, Универсальный, Для овощей, Хлебный.', 8900, 10500, 'THB', 'set', 'набор', 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400', true, true, false, true, 'Tojiro', 'Tojiro', 8, true, 1.8),
('home-decor', 'kitchen', 'Nespresso Vertuo Coffee Machine', 'Кофемашина Nespresso Vertuo', 'Centrifusion technology for perfect crema. 5 cup sizes. With 12 capsules.', 'Технология Centrifusion для идеальной крема. 5 размеров чашек. С 12 капсулами.', 7500, 8500, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', true, true, true, true, 'Nespresso', 'Nespresso', 9, true, 4.0),
('home-decor', 'bathroom', 'Dyson Supersonic Hair Dryer', 'Фен Dyson Supersonic', 'Intelligent heat control. Powerful digital motor. 4 magnetic attachments.', 'Интеллектуальный контроль температуры. Мощный цифровой мотор. 4 магнитные насадки.', 16500, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400', true, true, false, true, 'Dyson', 'Dyson', 10, true, 0.7),
('home-decor', 'bathroom', 'Luxury Turkish Cotton Towel Set', 'Набор турецких полотенец Люкс', 'Premium 700 GSM cotton. Set of 6: 2 bath, 2 hand, 2 face.', 'Премиальный хлопок 700 GSM. Набор 6шт: 2 банных, 2 для рук, 2 для лица.', 2800, 3400, 'THB', 'set/6pcs', 'набор/6шт', 'https://images.unsplash.com/photo-1600369671854-8b61a0c96d48?w=400', true, true, false, true, 'Turkish Home', 'Turkish Home', 11, true, 2.0),
('home-decor', 'storage', 'Minimalist Wooden Shelf Unit', 'Минималистичная деревянная полка', 'Solid oak construction. 5 tiers. Scandinavian design.', 'Конструкция из массива дуба. 5 уровней. Скандинавский дизайн.', 4500, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400', true, false, true, true, 'Nordic Design', 'Nordic Design', 12, false, 12.0),
('home-decor', 'lighting', 'Philips Hue Starter Kit', 'Philips Hue Стартовый набор', 'Smart LED bulbs with bridge. 4 bulbs, 16 million colors. Voice control ready.', 'Умные LED лампы с мостом. 4 лампы, 16 миллионов цветов. Готово к голосовому управлению.', 5500, 6200, 'THB', 'set', 'набор', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, true, true, true, 'Philips', 'Philips', 13, true, 1.0),
('home-decor', 'lighting', 'Industrial Pendant Lamp', 'Промышленный подвесной светильник', 'Vintage Edison style. Adjustable height. Matte black finish.', 'Стиль винтаж Эдисон. Регулируемая высота. Матовый чёрный.', 1800, null, 'THB', 'pc', 'шт', 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400', true, false, false, true, 'Loft Style', 'Loft Style', 14, true, 1.5),
('home-decor', 'decor', 'Handcrafted Ceramic Vase Set', 'Набор керамических ваз ручной работы', 'Set of 3 minimalist vases. Different sizes. Natural clay finish.', 'Набор из 3 минималистичных ваз. Разные размеры. Натуральная глина.', 2200, null, 'THB', 'set/3pcs', 'набор/3шт', 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400', true, true, false, true, 'Artisan Studio', 'Artisan Studio', 15, true, 2.5),
('home-decor', 'decor', 'Botanical Print Frames Set', 'Набор ботанических принтов в рамах', 'Gallery wall set of 6 prints. Gold frames. Ready to hang.', 'Галерейный набор из 6 принтов. Золотые рамы. Готовы к подвешиванию.', 3200, 3800, 'THB', 'set/6pcs', 'набор/6шт', 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400', true, false, true, true, 'Art Frame', 'Art Frame', 16, true, 3.0);

-- Additional Drinks products (5 -> 15 products)
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, description_en, description_ru, price, original_price, currency, unit, unit_ru, cover_image, in_stock, is_popular, is_new, is_active, vendor_name, vendor_name_ru, sort_order, is_shippable_international, weight_kg) VALUES
('drinks', 'water', 'Evian Natural Spring Water 1.5L', 'Evian Природная родниковая вода 1.5л', 'Premium mineral water from French Alps. Pack of 6 bottles.', 'Премиальная минеральная вода из французских Альп. Упаковка 6 бутылок.', 420, null, 'THB', '6x1.5L', '6x1.5л', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', true, true, false, true, 'Evian', 'Evian', 6, false, 9.0),
('drinks', 'water', 'San Pellegrino Sparkling Water', 'San Pellegrino Газированная вода', 'Italian sparkling mineral water. Perfect with meals. Pack of 6.', 'Итальянская газированная минеральная вода. Идеальна к еде. Упаковка 6.', 380, null, 'THB', '6x500ml', '6x500мл', 'https://images.unsplash.com/photo-1606168094336-48f205276929?w=400', true, true, false, true, 'San Pellegrino', 'San Pellegrino', 7, false, 3.5),
('drinks', 'juice', 'Fresh Orange Juice Premium', 'Свежевыжатый апельсиновый сок Премиум', '100% freshly squeezed oranges. No added sugar. Cold-pressed.', '100% свежевыжатые апельсины. Без добавления сахара. Холодного отжима.', 180, null, 'THB', '1L', '1л', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', true, true, false, true, 'Fresh Factory', 'Fresh Factory', 8, false, 1.1),
('drinks', 'juice', 'Pomegranate Juice Organic', 'Гранатовый сок Органик', 'Pure organic pomegranate juice. Rich in antioxidants.', 'Чистый органический гранатовый сок. Богат антиоксидантами.', 320, null, 'THB', '500ml', '500мл', 'https://images.unsplash.com/photo-1553177597-40eabbd1f5b8?w=400', true, false, true, true, 'Organic Farm', 'Органик Ферма', 9, false, 0.6),
('drinks', 'coffee', 'Lavazza Qualita Oro Ground Coffee', 'Lavazza Qualita Oro Молотый кофе', 'Premium Arabica blend. Medium roast. Floral and fruity notes.', 'Премиальная смесь Арабики. Средняя обжарка. Цветочные и фруктовые ноты.', 580, null, 'THB', '250g', '250г', 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400', true, true, false, true, 'Lavazza', 'Lavazza', 10, true, 0.3),
('drinks', 'coffee', 'Nescafe Gold Blend Instant', 'Nescafe Gold Растворимый', 'Premium instant coffee with fine aroma. 200g jar.', 'Премиальный растворимый кофе с тонким ароматом. Банка 200г.', 450, null, 'THB', '200g', '200г', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', true, true, false, true, 'Nescafe', 'Nescafe', 11, true, 0.25),
('drinks', 'tea', 'TWG Singapore Breakfast Tea', 'TWG Сингапурский завтрак', 'Luxury tea blend. Robust and full-bodied. 100g tin.', 'Люксовый чайный купаж. Крепкий и насыщенный. Банка 100г.', 890, null, 'THB', '100g', '100г', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', true, true, false, true, 'TWG Tea', 'TWG Tea', 12, true, 0.15),
('drinks', 'tea', 'Twinings Earl Grey Classic', 'Twinings Эрл Грей Классик', 'Classic bergamot-flavored black tea. Box of 100 tea bags.', 'Классический чёрный чай с бергамотом. Упаковка 100 пакетиков.', 350, null, 'THB', '100 bags', '100 пакетиков', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true, true, false, true, 'Twinings', 'Twinings', 13, true, 0.2),
('drinks', 'soda', 'Coca-Cola Original 24-Pack', 'Coca-Cola Оригинальная 24шт', 'Classic Coca-Cola in 330ml cans. Perfect for parties.', 'Классическая Coca-Cola в банках 330мл. Идеально для вечеринок.', 520, null, 'THB', '24x330ml', '24x330мл', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', true, true, false, true, 'Coca-Cola', 'Coca-Cola', 14, false, 8.5),
('drinks', 'energy', 'Red Bull Energy Drink 12-Pack', 'Red Bull Энергетик 12шт', 'Gives you wings. Original formula. 250ml cans.', 'Окрыляет. Оригинальная формула. Банки 250мл.', 680, null, 'THB', '12x250ml', '12x250мл', 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400', true, true, false, true, 'Red Bull', 'Red Bull', 15, false, 3.5);

-- Add subcategories for categories that don't have them yet
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active) 
SELECT * FROM (VALUES
  ('baby-kids', 'diapers', 'Diapers & Wipes', 'Подгузники и салфетки', '🧷', 1, true),
  ('baby-kids', 'food', 'Baby Food', 'Детское питание', '🍼', 2, true),
  ('baby-kids', 'toys', 'Toys', 'Игрушки', '🧸', 3, true),
  ('baby-kids', 'care', 'Baby Care', 'Уход за малышом', '🧴', 4, true),
  ('baby-kids', 'clothing', 'Clothing', 'Одежда', '👶', 5, true),
  ('baby-kids', 'gear', 'Gear & Equipment', 'Аксессуары', '🪑', 6, true),
  ('baby-kids', 'safety', 'Safety', 'Безопасность', '🔒', 7, true),
  ('health-pharmacy', 'vitamins', 'Vitamins & Supplements', 'Витамины и добавки', '💊', 1, true),
  ('health-pharmacy', 'pain-relief', 'Pain Relief', 'Обезболивающие', '🩹', 2, true),
  ('health-pharmacy', 'digestive', 'Digestive Health', 'Пищеварение', '🫄', 3, true),
  ('health-pharmacy', 'first-aid', 'First Aid', 'Первая помощь', '🏥', 4, true),
  ('health-pharmacy', 'cold-flu', 'Cold & Flu', 'Простуда и грипп', '🤧', 5, true),
  ('health-pharmacy', 'allergy', 'Allergy', 'Аллергия', '🌸', 6, true),
  ('health-pharmacy', 'eye-care', 'Eye Care', 'Уход за глазами', '👁️', 7, true),
  ('health-pharmacy', 'dental', 'Dental Care', 'Уход за зубами', '🦷', 8, true),
  ('health-pharmacy', 'skin-care', 'Skin Care', 'Уход за кожей', '🧴', 9, true),
  ('health-pharmacy', 'supplements', 'Sleep & Stress', 'Сон и стресс', '😴', 10, true),
  ('home-decor', 'bedding', 'Bedding', 'Постельное бельё', '🛏️', 1, true),
  ('home-decor', 'kitchen', 'Kitchen', 'Кухня', '🍳', 2, true),
  ('home-decor', 'bathroom', 'Bathroom', 'Ванная', '🚿', 3, true),
  ('home-decor', 'storage', 'Storage', 'Хранение', '📦', 4, true),
  ('home-decor', 'lighting', 'Lighting', 'Освещение', '💡', 5, true),
  ('home-decor', 'decor', 'Decor', 'Декор', '🖼️', 6, true),
  ('drinks', 'water', 'Water', 'Вода', '💧', 1, true),
  ('drinks', 'juice', 'Juice', 'Соки', '🍊', 2, true),
  ('drinks', 'coffee', 'Coffee', 'Кофе', '☕', 3, true),
  ('drinks', 'tea', 'Tea', 'Чай', '🍵', 4, true),
  ('drinks', 'soda', 'Soda', 'Газировка', '🥤', 5, true),
  ('drinks', 'energy', 'Energy Drinks', 'Энергетики', '⚡', 6, true)
) AS t(category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_subcategories ms 
  WHERE ms.category_slug = t.category_slug AND ms.slug = t.slug
);

-- Migration: 20260129115652_6b666dd1-9fc1-4f72-9762-8e76283974fd.sql
-- =============================================
-- PART 1: Create marketplace_vendors table
-- =============================================

CREATE TABLE public.marketplace_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo_url TEXT,
  cover_image TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  address_ru TEXT,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_vendors ENABLE ROW LEVEL SECURITY;

-- Public read access for vendors
CREATE POLICY "Vendors are viewable by everyone" 
ON public.marketplace_vendors 
FOR SELECT 
USING (is_active = true);

-- Create index for slug lookups
CREATE INDEX idx_marketplace_vendors_slug ON public.marketplace_vendors(slug);
CREATE INDEX idx_marketplace_vendors_active ON public.marketplace_vendors(is_active);

-- Add updated_at trigger
CREATE TRIGGER update_marketplace_vendors_updated_at
BEFORE UPDATE ON public.marketplace_vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PART 2: Add vendor_id to marketplace_products
-- =============================================

ALTER TABLE public.marketplace_products 
ADD COLUMN vendor_id UUID REFERENCES public.marketplace_vendors(id);

-- Create index for vendor lookups
CREATE INDEX idx_marketplace_products_vendor ON public.marketplace_products(vendor_id);

-- =============================================
-- PART 3: Seed vendor data
-- =============================================

INSERT INTO public.marketplace_vendors (slug, name_en, name_ru, description_en, description_ru, rating, review_count, verified) VALUES
('thai-rice-co', 'Thai Rice Co.', 'Тай Райс Ко.', 'Premium Thai rice supplier with over 20 years of experience', 'Поставщик премиального тайского риса с более чем 20-летним опытом', 4.8, 156, true),
('organic-farm', 'Organic Farm', 'Органик Фарм', 'Certified organic produce from local farms', 'Сертифицированная органическая продукция с местных ферм', 4.6, 89, true),
('coca-cola', 'Coca-Cola', 'Кока-Кола', 'World''s leading beverage company', 'Ведущая мировая компания по производству напитков', 4.9, 1250, true),
('red-bull', 'Red Bull', 'Ред Булл', 'Energy drink manufacturer', 'Производитель энергетических напитков', 4.7, 890, true),
('pepsi', 'PepsiCo', 'ПепсиКо', 'Global food and beverage company', 'Глобальная продовольственная компания', 4.8, 1100, true),
('nestle', 'Nestlé', 'Нестле', 'World''s largest food company', 'Крупнейшая продовольственная компания мира', 4.7, 2340, true),
('unilever', 'Unilever', 'Юнилевер', 'Consumer goods multinational', 'Международная компания потребительских товаров', 4.5, 1890, true),
('local-bakery', 'Local Bakery', 'Местная Пекарня', 'Fresh artisan bread and pastries daily', 'Свежий ремесленный хлеб и выпечка каждый день', 4.9, 234, true),
('asian-foods', 'Asian Foods Import', 'Азиатские Продукты', 'Authentic Asian ingredients and snacks', 'Аутентичные азиатские ингредиенты и закуски', 4.4, 178, true),
('dairy-fresh', 'Dairy Fresh', 'Дейри Фреш', 'Premium dairy products from happy cows', 'Премиальные молочные продукты от счастливых коров', 4.6, 567, true),
('meat-masters', 'Meat Masters', 'Мит Мастерс', 'Quality meats and poultry', 'Качественное мясо и птица', 4.5, 445, true),
('seafood-direct', 'Seafood Direct', 'Морепродукты Директ', 'Fresh seafood delivered daily', 'Свежие морепродукты с ежедневной доставкой', 4.7, 312, true),
('green-valley', 'Green Valley', 'Грин Вэлли', 'Fresh vegetables and fruits', 'Свежие овощи и фрукты', 4.8, 678, true),
('snack-world', 'Snack World', 'Снэк Ворлд', 'International snacks and treats', 'Международные закуски и сладости', 4.3, 445, false),
('beverage-plus', 'Beverage Plus', 'Бевериджи Плюс', 'Wide selection of drinks', 'Широкий выбор напитков', 4.4, 234, false),
('frozen-goods', 'Frozen Goods Co', 'Фрозен Гудс', 'Quality frozen products', 'Качественные замороженные продукты', 4.2, 189, false),
('health-foods', 'Health Foods', 'Хелс Фудс', 'Healthy and organic options', 'Здоровые и органические продукты', 4.6, 345, true),
('thai-spices', 'Thai Spices', 'Тайские Специи', 'Authentic Thai spices and sauces', 'Аутентичные тайские специи и соусы', 4.7, 267, true),
('european-deli', 'European Deli', 'Европейский Деликатесы', 'Premium European foods', 'Премиальные европейские продукты', 4.5, 189, true),
('russian-foods', 'Russian Foods', 'Русские Продукты', 'Traditional Russian groceries', 'Традиционные русские продукты', 4.8, 567, true);

-- =============================================
-- PART 4: Link existing products to vendors
-- =============================================

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'thai-rice-co'
) WHERE vendor_name ILIKE '%Thai Rice%' OR vendor_name ILIKE '%rice%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'organic-farm'
) WHERE vendor_name ILIKE '%Organic%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'coca-cola'
) WHERE vendor_name ILIKE '%Coca%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'red-bull'
) WHERE vendor_name ILIKE '%Red Bull%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'pepsi'
) WHERE vendor_name ILIKE '%Pepsi%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'nestle'
) WHERE vendor_name ILIKE '%Nestl%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'local-bakery'
) WHERE vendor_name ILIKE '%Bakery%' OR vendor_name ILIKE '%Baker%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'asian-foods'
) WHERE vendor_name ILIKE '%Asian%' OR vendor_name ILIKE '%Thai%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'dairy-fresh'
) WHERE vendor_name ILIKE '%Dairy%' OR vendor_name ILIKE '%Milk%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'meat-masters'
) WHERE vendor_name ILIKE '%Meat%' OR vendor_name ILIKE '%Butcher%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'seafood-direct'
) WHERE vendor_name ILIKE '%Seafood%' OR vendor_name ILIKE '%Fish%';

UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'green-valley'
) WHERE vendor_name ILIKE '%Green%' OR vendor_name ILIKE '%Farm%' OR vendor_name ILIKE '%Fresh%';

-- Assign remaining products without vendor to a default vendor
UPDATE public.marketplace_products SET vendor_id = (
  SELECT id FROM public.marketplace_vendors WHERE slug = 'asian-foods'
) WHERE vendor_id IS NULL;
-- Migration: 20260129120402_a4f33a5c-33bc-4e17-8a7e-c506dd1dc186.sql
-- ================================================
-- MARKETPLACE OZON-PARITY FEATURES (FIXED)
-- ================================================

-- 1. REVIEWS SYSTEM
CREATE TABLE public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  pros TEXT,
  cons TEXT,
  photos TEXT[],
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_reviews_product ON public.marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_user ON public.marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_reviews_rating ON public.marketplace_reviews(rating);

-- 2. WISHLIST
CREATE TABLE public.marketplace_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_marketplace_wishlist_user ON public.marketplace_wishlist(user_id);

-- 3. PROMO CODES
CREATE TABLE public.marketplace_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ru TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_promo_codes_code ON public.marketplace_promo_codes(code);

-- 4. ORDER STATUS HISTORY (for tracking) - using customer_user_id
CREATE TABLE public.marketplace_order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_ru TEXT,
  notes TEXT,
  location TEXT,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON public.marketplace_order_status_history(order_id);

-- 5. PROMO CODE USAGE TRACKING
CREATE TABLE public.marketplace_promo_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.marketplace_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promo_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for REVIEWS
CREATE POLICY "Anyone can view approved reviews"
  ON public.marketplace_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create reviews"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.marketplace_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.marketplace_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for WISHLIST
CREATE POLICY "Users can view own wishlist"
  ON public.marketplace_wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
  ON public.marketplace_wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
  ON public.marketplace_wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for PROMO CODES (public read for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON public.marketplace_promo_codes FOR SELECT
  USING (is_active = true);

-- RLS Policies for ORDER STATUS HISTORY (using customer_user_id)
CREATE POLICY "Users can view own order history"
  ON public.marketplace_order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_id AND orders.customer_user_id = auth.uid()
    )
  );

-- RLS for PROMO USAGE
CREATE POLICY "Users can view own promo usage"
  ON public.marketplace_promo_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record promo usage"
  ON public.marketplace_promo_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed some promo codes
INSERT INTO public.marketplace_promo_codes (code, description_en, description_ru, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until) VALUES
('WELCOME10', '10% off your first order', '10% скидка на первый заказ', 'percentage', 10, 500, 500, now() + interval '1 year'),
('SAVE100', '฿100 off orders over ฿1000', '฿100 скидка на заказы от ฿1000', 'fixed', 100, 1000, NULL, now() + interval '6 months'),
('VIP20', '20% off for VIP customers', '20% скидка для VIP клиентов', 'percentage', 20, 2000, 1000, now() + interval '3 months'),
('FREESHIP', 'Free shipping on orders over ฿500', 'Бесплатная доставка от ฿500', 'fixed', 100, 500, 100, now() + interval '1 year');
-- Migration: 20260129121614_535fa0f6-c142-4774-bde5-a967884e1b4c.sql

-- =====================================================
-- FIX MARKETPLACE TAXONOMY - Add missing subcategories
-- =====================================================

-- 1. Add missing subcategories for 'groceries' (Russian Products)
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('groceries', 'russian', 'Russian Food', 'Русские продукты', '🇷🇺', 1, true),
  ('groceries', 'asian', 'Asian Food', 'Азиатские продукты', '🍜', 2, true),
  ('groceries', 'farm', 'Farm Products', 'Фермерские продукты', '🌾', 3, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 2. Add missing subcategories for 'souvenirs'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('souvenirs', 'gifts', 'Gifts', 'Подарки', '🎁', 2, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 3. Add missing subcategories for 'thai-fashion'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('thai-fashion', 'thai-silk', 'Thai Silk', 'Тайский шёлк', '🎀', 4, true),
  ('thai-fashion', 'thai-jewelry', 'Thai Jewelry', 'Тайские украшения', '💎', 5, true),
  ('thai-fashion', 'designer-bags', 'Designer Bags', 'Дизайнерские сумки', '👜', 6, true),
  ('thai-fashion', 'beach-accessories', 'Beach Accessories', 'Пляжные аксессуары', '🕶️', 7, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 4. Add missing subcategories for 'thai-delicacies' (currently has no subcategories)
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('thai-delicacies', 'snacks', 'Snacks & Chips', 'Снеки и чипсы', '🍿', 1, true),
  ('thai-delicacies', 'sweets', 'Sweets & Desserts', 'Сладости', '🍬', 2, true),
  ('thai-delicacies', 'sauces', 'Sauces & Pastes', 'Соусы и пасты', '🥫', 3, true),
  ('thai-delicacies', 'dried', 'Dried Fruits & Nuts', 'Сухофрукты и орехи', '🥜', 4, true),
  ('thai-delicacies', 'spices', 'Spices & Herbs', 'Специи и травы', '🌿', 5, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 5. Expand 'organic' subcategories for professional taxonomy
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('organic', 'greens', 'Greens & Herbs', 'Зелень и травы', '🥬', 6, true),
  ('organic', 'mushrooms', 'Mushrooms', 'Грибы', '🍄', 7, true),
  ('organic', 'berries', 'Berries', 'Ягоды', '🍓', 8, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 6. Add more professional subcategories for 'seafood'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('seafood', 'prepared', 'Prepared Seafood', 'Готовые морепродукты', '🍣', 5, true),
  ('seafood', 'caviar', 'Caviar & Roe', 'Икра', '🥚', 6, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 7. Add more subcategories for 'meat'
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('meat', 'sausages', 'Sausages & Deli', 'Колбасы и деликатесы', '🌭', 7, true),
  ('meat', 'offal', 'Offal & Specialty', 'Субпродукты', '🫀', 8, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 8. Expand 'health-pharmacy' with more categories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('health-pharmacy', 'medical-devices', 'Medical Devices', 'Медицинские приборы', '🩺', 11, true),
  ('health-pharmacy', 'baby-health', 'Baby Health', 'Детское здоровье', '👶', 12, true),
  ('health-pharmacy', 'womens-health', 'Women''s Health', 'Женское здоровье', '💊', 13, true),
  ('health-pharmacy', 'mens-health', 'Men''s Health', 'Мужское здоровье', '💪', 14, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 9. Expand 'cosmetics' subcategories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('cosmetics', 'makeup', 'Makeup', 'Макияж', '💄', 6, true),
  ('cosmetics', 'perfume', 'Perfume', 'Парфюмерия', '🌸', 7, true),
  ('cosmetics', 'nail-care', 'Nail Care', 'Уход за ногтями', '💅', 8, true),
  ('cosmetics', 'sun-care', 'Sun Care', 'Защита от солнца', '☀️', 9, true),
  ('cosmetics', 'mens-care', 'Men''s Care', 'Мужской уход', '🧔', 10, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 10. Expand 'home-decor' subcategories
INSERT INTO marketplace_subcategories (category_slug, slug, name_en, name_ru, icon, sort_order, is_active)
VALUES 
  ('home-decor', 'furniture', 'Furniture', 'Мебель', '🛋️', 8, true),
  ('home-decor', 'garden', 'Garden & Outdoor', 'Сад и улица', '🌿', 9, true),
  ('home-decor', 'cleaning', 'Cleaning Supplies', 'Средства для уборки', '🧹', 10, true)
ON CONFLICT (category_slug, slug) DO NOTHING;

-- 11. Assign subcategories to thai-delicacies products that have NULL subcategory
UPDATE marketplace_products 
SET subcategory = 'snacks'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%chip%' OR name_en ILIKE '%snack%' OR name_en ILIKE '%crispy%');

UPDATE marketplace_products 
SET subcategory = 'sauces'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%sauce%' OR name_en ILIKE '%paste%' OR name_en ILIKE '%curry%');

UPDATE marketplace_products 
SET subcategory = 'dried'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%dried%' OR name_en ILIKE '%mango%' OR name_en ILIKE '%fruit%');

UPDATE marketplace_products 
SET subcategory = 'sweets'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL
  AND (name_en ILIKE '%sweet%' OR name_en ILIKE '%candy%' OR name_en ILIKE '%chocolate%' OR name_en ILIKE '%dessert%');

-- Remaining thai-delicacies products go to snacks
UPDATE marketplace_products 
SET subcategory = 'snacks'
WHERE category_slug = 'thai-delicacies' AND subcategory IS NULL;

-- 12. Assign subcategories to souvenirs products that have NULL
UPDATE marketplace_products 
SET subcategory = 'crafts'
WHERE category_slug = 'souvenirs' AND subcategory IS NULL
  AND (name_en ILIKE '%handmade%' OR name_en ILIKE '%carved%' OR name_en ILIKE '%craft%');

UPDATE marketplace_products 
SET subcategory = 'gifts'
WHERE category_slug = 'souvenirs' AND subcategory IS NULL;

-- 13. Assign subcategories to cosmetics products that have NULL
UPDATE marketplace_products 
SET subcategory = 'skincare'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL
  AND (name_en ILIKE '%cream%' OR name_en ILIKE '%serum%' OR name_en ILIKE '%mask%' OR name_en ILIKE '%lotion%');

UPDATE marketplace_products 
SET subcategory = 'oils'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL
  AND (name_en ILIKE '%oil%' OR name_en ILIKE '%balm%');

UPDATE marketplace_products 
SET subcategory = 'herbal'
WHERE category_slug = 'cosmetics' AND subcategory IS NULL;

-- 14. Create index for faster subcategory lookups
CREATE INDEX IF NOT EXISTS idx_mp_products_subcategory ON marketplace_products(subcategory);
CREATE INDEX IF NOT EXISTS idx_mp_subcategories_category ON marketplace_subcategories(category_slug);

-- 15. Add product attributes table for professional filtering (like Ozon)
CREATE TABLE IF NOT EXISTS marketplace_product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES marketplace_products(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value text NOT NULL,
  attribute_value_ru text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_key)
);

-- Enable RLS
ALTER TABLE marketplace_product_attributes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read product attributes"
  ON marketplace_product_attributes FOR SELECT
  USING (true);

-- Create index for attribute filtering
CREATE INDEX IF NOT EXISTS idx_mp_attrs_product ON marketplace_product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_mp_attrs_key_value ON marketplace_product_attributes(attribute_key, attribute_value);

-- 16. Add sample attributes to products for demonstration
INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'origin',
  'Thailand',
  'Таиланд',
  1
FROM marketplace_products p
WHERE p.category_slug IN ('thai-delicacies', 'thai-fashion', 'cosmetics')
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'organic',
  'Yes',
  'Да',
  2
FROM marketplace_products p
WHERE p.category_slug = 'organic'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'storage',
  CASE 
    WHEN p.category_slug IN ('meat', 'seafood') THEN 'Refrigerated'
    WHEN p.category_slug = 'organic' AND p.subcategory IN ('dairy', 'eggs') THEN 'Refrigerated'
    ELSE 'Room Temperature'
  END,
  CASE 
    WHEN p.category_slug IN ('meat', 'seafood') THEN 'Охлаждённый'
    WHEN p.category_slug = 'organic' AND p.subcategory IN ('dairy', 'eggs') THEN 'Охлаждённый'
    ELSE 'Комнатная температура'
  END,
  3
FROM marketplace_products p
WHERE p.category_slug IN ('meat', 'seafood', 'organic', 'drinks')
ON CONFLICT DO NOTHING;

-- 17. Add brand info to products via attributes
INSERT INTO marketplace_product_attributes (product_id, attribute_key, attribute_value, attribute_value_ru, sort_order)
SELECT 
  p.id,
  'brand',
  COALESCE(v.name_en, p.vendor_name, 'Local Producer'),
  COALESCE(v.name_ru, p.vendor_name_ru, 'Местный производитель'),
  0
FROM marketplace_products p
LEFT JOIN marketplace_vendors v ON p.vendor_id = v.id
ON CONFLICT DO NOTHING;

-- Migration: 20260129160156_7d7f8e51-faf4-4e9b-8ddd-23bf3503848d.sql
-- Add marketplace_vendor_id to providers table to unify vendor systems
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS marketplace_vendor_id UUID REFERENCES marketplace_vendors(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_providers_marketplace_vendor 
ON providers(marketplace_vendor_id);

-- RLS policy: Vendors can insert their own products via the provider-marketplace_vendor link
CREATE POLICY "Vendors can insert own products" 
ON marketplace_products
FOR INSERT 
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can update their own products
CREATE POLICY "Vendors can update own products" 
ON marketplace_products
FOR UPDATE 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can delete their own products
CREATE POLICY "Vendors can delete own products" 
ON marketplace_products
FOR DELETE 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
);

-- RLS policy: Vendors can view their own products
CREATE POLICY "Vendors can view own products" 
ON marketplace_products
FOR SELECT 
TO authenticated
USING (
  vendor_id IN (
    SELECT mv.id FROM marketplace_vendors mv
    JOIN providers p ON p.marketplace_vendor_id = mv.id
    WHERE p.user_id = auth.uid()
  )
  OR is_active = true
);
-- Migration: 20260129171926_b4ad4a79-4bb3-4811-a3b5-cd884e92a9e7.sql
-- Add precise unit fields to marketplace_products
ALTER TABLE marketplace_products 
  ADD COLUMN IF NOT EXISTS unit_value NUMERIC,
  ADD COLUMN IF NOT EXISTS unit_measure TEXT,
  ADD COLUMN IF NOT EXISTS pack_quantity INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN marketplace_products.unit_value IS 'Numeric value for unit (e.g., 500 for 500g)';
COMMENT ON COLUMN marketplace_products.unit_measure IS 'Unit type: g, kg, ml, L, pc';
COMMENT ON COLUMN marketplace_products.pack_quantity IS 'Number of items in pack (e.g., 6 eggs)';
-- Migration: 20260130012609_c15474e1-7d7c-470b-ab64-1b5a37c7b4d2.sql
-- Create user_addresses table for saved delivery addresses
CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_text TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Thailand',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast user lookups
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_user_addresses_default ON public.user_addresses(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own addresses
CREATE POLICY "Users can view own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();
-- Migration: 20260130051047_27dfc61b-0e22-4b09-8bac-5da5016a63c2.sql
-- Create location_knowledge table for the Knowledge Hub
CREATE TABLE public.location_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- overview, culture, dos-donts, government, nature, practical, emergency
  slug TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  content_en TEXT, -- Markdown content
  content_ru TEXT, -- Markdown content
  summary_en TEXT, -- Short description for cards
  summary_ru TEXT,
  icon TEXT, -- Lucide icon name or emoji
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for city + section + slug combination
  UNIQUE(city_id, section, slug)
);

-- Create index for efficient queries
CREATE INDEX idx_location_knowledge_city_section ON public.location_knowledge(city_id, section);
CREATE INDEX idx_location_knowledge_published ON public.location_knowledge(is_published) WHERE is_published = true;

-- Enable Row Level Security
ALTER TABLE public.location_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access for published content
CREATE POLICY "Anyone can view published knowledge content" 
ON public.location_knowledge 
FOR SELECT 
USING (is_published = true);

-- Admin can manage all content (using user_roles)
CREATE POLICY "Admins can manage knowledge content" 
ON public.location_knowledge 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'uno_team', 'staff')
  )
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_location_knowledge_updated_at
BEFORE UPDATE ON public.location_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.location_knowledge IS 'Stores localized knowledge content for each city location';
-- Migration: 20260130065626_909e424c-b060-44f7-8d2f-95dfcf61be8a.sql
-- Allow admins to update restaurants for content moderation
CREATE POLICY "Admins can update restaurants"
ON public.restaurants
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));
-- Migration: 20260130065703_953ffe86-55ed-4e58-89be-b2d1ac2ed7ba.sql
-- Add admin UPDATE policies for all content moderation tables

-- Tours
CREATE POLICY "Admins can update tours"
ON public.tours
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Water Activities
CREATE POLICY "Admins can update water_activities"
ON public.water_activities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Salons
CREATE POLICY "Admins can update salons"
ON public.salons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Clinics
CREATE POLICY "Admins can update clinics"
ON public.clinics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Gyms
CREATE POLICY "Admins can update gyms"
ON public.gyms
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Vehicles
CREATE POLICY "Admins can update vehicles"
ON public.vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Properties
CREATE POLICY "Admins can update properties"
ON public.properties
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Yachts
CREATE POLICY "Admins can update yachts"
ON public.yachts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Events
CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Babysitters
CREATE POLICY "Admins can update babysitters"
ON public.babysitters
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Cleaning Services
CREATE POLICY "Admins can update cleaning_services"
ON public.cleaning_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Legal Services
CREATE POLICY "Admins can update legal_services"
ON public.legal_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Pet Services
CREATE POLICY "Admins can update pet_services"
ON public.pet_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Education Providers
CREATE POLICY "Admins can update education_providers"
ON public.education_providers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Pharmacies
CREATE POLICY "Admins can update pharmacies"
ON public.pharmacies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Insurance Providers
CREATE POLICY "Admins can update insurance_providers"
ON public.insurance_providers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Flower Shops
CREATE POLICY "Admins can update flower_shops"
ON public.flower_shops
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Stores
CREATE POLICY "Admins can update stores"
ON public.stores
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));

-- Vendor Locations
CREATE POLICY "Admins can update vendor_locations"
ON public.vendor_locations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'uno_team'::app_role));
-- Migration: 20260130083823_405b8086-2f66-41f6-b326-457f9b8eedf6.sql
-- Create table for tracking PWA installations
CREATE TABLE public.pwa_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  browser TEXT,
  device_info JSONB,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT,
  ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.pwa_installs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking)
CREATE POLICY "Anyone can log installs"
  ON public.pwa_installs FOR INSERT
  WITH CHECK (true);

-- Admins can view via user_roles
CREATE POLICY "Admins can view installs"
  ON public.pwa_installs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'uno_team')
    )
  );

-- Create indexes
CREATE INDEX idx_pwa_installs_date ON public.pwa_installs(installed_at);
CREATE INDEX idx_pwa_installs_platform ON public.pwa_installs(platform);
-- Migration: 20260130093345_b5dd1e4c-6ac3-462a-ab5d-f1178f3a970a.sql
-- =============================================
-- RELIABLE BOOKING SYSTEM MIGRATION
-- Adds extended statuses, cancellation policies, and booking reliability fields
-- =============================================

-- 1. Add extended booking status enum if not exists
DO $$ 
BEGIN
  -- Add new status values to property_bookings
  -- Current: pending, confirmed, completed, cancelled
  -- New: pending_deposit, deposit_paid, checked_in, checked_out, cancelled_by_guest, cancelled_by_host, no_show
  
  -- We'll use text field as it already is, just document the allowed values
  COMMENT ON COLUMN property_bookings.status IS 'Booking status: pending, pending_deposit, deposit_paid, confirmed, checked_in, checked_out, completed, cancelled, cancelled_by_guest, cancelled_by_host, no_show';
END $$;

-- 2. Add booking reliability fields to property_bookings
ALTER TABLE property_bookings 
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS deposit_payment_method text,
ADD COLUMN IF NOT EXISTS deposit_stripe_session_id text,
ADD COLUMN IF NOT EXISTS cancellation_policy text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_amount numeric,
ADD COLUMN IF NOT EXISTS refund_status text,
ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz,
ADD COLUMN IF NOT EXISTS service_fee numeric,
ADD COLUMN IF NOT EXISTS cleaning_fee numeric,
ADD COLUMN IF NOT EXISTS platform_commission numeric,
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id);

-- 3. Add comment for cancellation policy values
COMMENT ON COLUMN property_bookings.cancellation_policy IS 'Cancellation policy: flexible, moderate, strict, super_strict, non_refundable';
COMMENT ON COLUMN property_bookings.refund_status IS 'Refund status: pending, processed, declined, partial';

-- 4. Create cancellation_policy_rules table for policy definitions
CREATE TABLE IF NOT EXISTS cancellation_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text,
  description_ru text,
  -- Before check-in cutoffs (in hours)
  full_refund_hours integer, -- Hours before check-in for full refund
  partial_refund_hours integer, -- Hours before check-in for partial refund
  partial_refund_percent integer, -- Percentage refunded in partial window
  no_refund_hours integer DEFAULT 0, -- Hours before check-in when no refund applies
  -- Deposit handling
  deposit_refundable boolean DEFAULT false,
  -- Discount for non-refundable
  non_refundable_discount integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Insert standard Airbnb-style policies
INSERT INTO cancellation_policy_rules (policy_code, name_en, name_ru, description_en, description_ru, full_refund_hours, partial_refund_hours, partial_refund_percent, deposit_refundable, sort_order)
VALUES 
  ('flexible', 'Flexible', 'Гибкая', 
   'Full refund up to 24 hours before check-in. After that, the first night is non-refundable.',
   'Полный возврат до 24 часов перед заездом. После этого первая ночь не возвращается.',
   24, 0, 0, false, 1),
   
  ('moderate', 'Moderate', 'Умеренная',
   'Full refund up to 5 days before check-in. After that, 50% refund up to 24 hours before check-in.',
   'Полный возврат до 5 дней перед заездом. После этого 50% возврат до 24 часов перед заездом.',
   120, 24, 50, false, 2),
   
  ('strict', 'Strict', 'Строгая',
   '50% refund up to 7 days before check-in. No refund after that.',
   '50% возврат до 7 дней перед заездом. После этого возврат невозможен.',
   168, 0, 0, false, 3),
   
  ('super_strict', 'Super Strict', 'Очень строгая',
   '50% refund up to 30 days before check-in. No refund after that.',
   '50% возврат до 30 дней перед заездом. После этого возврат невозможен.',
   720, 0, 0, false, 4),
   
  ('non_refundable', 'Non-refundable', 'Невозвратная',
   'No refund under any circumstances. 10% discount on booking.',
   'Возврат невозможен ни при каких обстоятельствах. Скидка 10% на бронирование.',
   0, 0, 0, false, 5)
ON CONFLICT (policy_code) DO NOTHING;

-- 6. Enable RLS on new table
ALTER TABLE cancellation_policy_rules ENABLE ROW LEVEL SECURITY;

-- 7. Public read access for policies
CREATE POLICY "Anyone can view cancellation policies"
  ON cancellation_policy_rules FOR SELECT
  USING (true);

-- 8. Create booking_status_log for audit trail (if not exists)
CREATE TABLE IF NOT EXISTS property_booking_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES property_bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 9. Enable RLS on status log
ALTER TABLE property_booking_status_log ENABLE ROW LEVEL SECURITY;

-- 10. Owners can view their booking status logs
CREATE POLICY "Owners can view their booking status logs"
  ON property_booking_status_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_bookings pb
      WHERE pb.id = booking_id AND pb.owner_id = auth.uid()
    )
  );

-- 11. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_bookings_status ON property_bookings(status);
CREATE INDEX IF NOT EXISTS idx_property_bookings_deposit_paid_at ON property_bookings(deposit_paid_at);
CREATE INDEX IF NOT EXISTS idx_property_booking_status_log_booking ON property_booking_status_log(booking_id);
-- Migration: 20260130100723_96871fa8-6a64-45bb-82f8-ab865d4ccf0c.sql
-- ==========================================
-- CHAT DELEGATION & MODERATION SYSTEM (Fixed)
-- ==========================================

-- 1. Add chat_delegated_to_platform field to owner_properties
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS chat_delegated_to_platform boolean DEFAULT false;

-- 2. Create chat moderation table for flagged messages and violations
CREATE TABLE IF NOT EXISTS public.chat_message_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.property_chat_messages(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE SET NULL,
  
  -- Flag details
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'contact_sharing',      -- phone, email, telegram, whatsapp
    'off_platform_payment', -- mentions of cash, direct transfer
    'offensive_language',   -- insults, profanity
    'spam',                 -- repetitive/promotional content
    'suspicious_link',      -- external URLs
    'policy_violation',     -- general policy violation
    'manual_flag'           -- flagged by staff
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Detection details
  detected_pattern TEXT,           -- what triggered the flag
  confidence_score DECIMAL(3,2),   -- 0.00-1.00 confidence
  auto_detected BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,               -- e.g., 'warning_shown', 'message_hidden', 'user_warned'
  
  -- User warning tracking
  warning_shown_to_sender BOOLEAN DEFAULT false,
  warning_acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user violation history table
CREATE TABLE IF NOT EXISTS public.chat_violation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_count INTEGER NOT NULL DEFAULT 1,
  last_violation_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  warning_level INTEGER NOT NULL DEFAULT 1 CHECK (warning_level BETWEEN 1 AND 5),
  -- Level 1: First warning, Level 5: Account restriction
  is_restricted BOOLEAN DEFAULT false,
  restricted_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add hidden flag to messages for moderation
ALTER TABLE property_chat_messages 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_metadata JSONB;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_flags_message_id ON chat_message_flags(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_flags_property_id ON chat_message_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_chat_flags_status ON chat_message_flags(status);
CREATE INDEX IF NOT EXISTS idx_chat_flags_created_at ON chat_message_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_history_user ON chat_violation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_hidden ON property_chat_messages(is_hidden) WHERE is_hidden = true;

-- 6. Enable RLS
ALTER TABLE public.chat_message_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_violation_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for chat_message_flags
-- Property owners can view flags for their properties
CREATE POLICY "Owners can view flags for their properties"
ON public.chat_message_flags
FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT id FROM owner_properties WHERE owner_id = auth.uid()
  )
);

-- Platform staff can manage all flags (using correct roles: admin, uno_team, support, staff)
CREATE POLICY "Staff can manage all flags"
ON public.chat_message_flags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
);

-- 8. RLS Policies for chat_violation_history
-- Users can view their own violations
CREATE POLICY "Users can view own violations"
ON public.chat_violation_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can manage all violations
CREATE POLICY "Staff can manage violations"
ON public.chat_violation_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
);

-- 9. Comments
COMMENT ON TABLE chat_message_flags IS 'Tracks flagged chat messages for policy violations (contact sharing, off-platform payments, etc.)';
COMMENT ON TABLE chat_violation_history IS 'Tracks user violation history and warning levels';

-- 10. Enable realtime for moderation updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_flags;
-- Migration: 20260130102837_88e072c2-e3a5-4436-91fd-88fee01033e6.sql
-- Create provider payout methods table
CREATE TABLE public.provider_payout_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'bank_account',
  bank_code TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_payout_methods ENABLE ROW LEVEL SECURITY;

-- Providers can view their own payout methods
CREATE POLICY "Providers can view own payout methods"
ON public.provider_payout_methods
FOR SELECT
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can create their own payout methods
CREATE POLICY "Providers can create own payout methods"
ON public.provider_payout_methods
FOR INSERT
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can update their own payout methods
CREATE POLICY "Providers can update own payout methods"
ON public.provider_payout_methods
FOR UPDATE
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can delete their own payout methods
CREATE POLICY "Providers can delete own payout methods"
ON public.provider_payout_methods
FOR DELETE
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Admin access
CREATE POLICY "Admins can manage payout methods"
ON public.provider_payout_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_provider_payout_methods_updated_at
BEFORE UPDATE ON public.provider_payout_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_provider_payout_methods_provider ON public.provider_payout_methods(provider_id);
-- Migration: 20260130110108_2177dc5b-5877-4afc-b5c2-190f408c0f5d.sql
-- Create enum for user personas (personalization preferences, not access roles)
CREATE TYPE public.user_persona AS ENUM ('tourist', 'resident', 'property_owner');

-- Create table for storing user persona preferences
CREATE TABLE public.user_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona user_persona NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, persona)
);

-- Enable RLS
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

-- Users can view their own personas
CREATE POLICY "Users can view own personas"
  ON public.user_personas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own personas
CREATE POLICY "Users can insert own personas"
  ON public.user_personas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own personas
CREATE POLICY "Users can update own personas"
  ON public.user_personas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own personas
CREATE POLICY "Users can delete own personas"
  ON public.user_personas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_user_personas_user_id ON public.user_personas(user_id);
CREATE INDEX idx_user_personas_active ON public.user_personas(user_id, is_active) WHERE is_active = true;
-- Migration: 20260130121627_92cf531f-63e0-4a06-8e24-636b1132c8b0.sql
-- ============================================
-- AI AGENT FARM: Core Tables
-- ============================================

-- Table: AI Agents (main registry)
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'Bot',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 2000,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  target_audience TEXT[] DEFAULT ARRAY[]::TEXT[],
  tone TEXT DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: AI Agent Knowledge (versioned prompts and knowledge base)
CREATE TABLE public.ai_agent_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  knowledge_base TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, version)
);

-- Table: AI Agent Logs (usage tracking)
CREATE TABLE public.ai_agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Public agents are viewable by everyone" 
ON public.ai_agents FOR SELECT 
USING (is_active = true AND is_public = true);

CREATE POLICY "Admins can manage all agents" 
ON public.ai_agents FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

-- RLS Policies for ai_agent_knowledge
CREATE POLICY "Published knowledge is viewable for active agents" 
ON public.ai_agent_knowledge FOR SELECT 
USING (
  is_published = true AND 
  EXISTS (
    SELECT 1 FROM public.ai_agents 
    WHERE id = agent_id AND is_active = true
  )
);

CREATE POLICY "Admins can manage all knowledge" 
ON public.ai_agent_knowledge FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

-- RLS Policies for ai_agent_logs
CREATE POLICY "Users can view their own logs" 
ON public.ai_agent_logs FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all logs" 
ON public.ai_agent_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team')
  )
);

CREATE POLICY "Anyone can insert logs" 
ON public.ai_agent_logs FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_ai_agents_slug ON public.ai_agents(slug);
CREATE INDEX idx_ai_agents_active ON public.ai_agents(is_active);
CREATE INDEX idx_ai_agent_knowledge_agent ON public.ai_agent_knowledge(agent_id);
CREATE INDEX idx_ai_agent_knowledge_published ON public.ai_agent_knowledge(agent_id, is_published);
CREATE INDEX idx_ai_agent_logs_agent ON public.ai_agent_logs(agent_id);
CREATE INDEX idx_ai_agent_logs_user ON public.ai_agent_logs(user_id);
CREATE INDEX idx_ai_agent_logs_created ON public.ai_agent_logs(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing agents (migrate hardcoded agents to DB)
INSERT INTO public.ai_agents (slug, name_en, name_ru, description_en, description_ru, icon, is_active, target_audience, tone) VALUES
('owner-assistant', 'Owner Assistant', 'Ассистент владельца', 'AI assistant for property owners - system guidance, market insights, Thai real estate law', 'AI-ассистент для владельцев недвижимости - помощь по системе, рынок, законодательство', 'Building2', true, ARRAY['owner'], 'professional'),
('property-search', 'Property Search', 'Поиск недвижимости', 'AI assistant helping guests find perfect rental properties in Phuket', 'AI-ассистент для поиска идеальной аренды на Пхукете', 'Search', true, ARRAY['guest', 'user'], 'friendly'),
('support-chat', 'Support Chat', 'Чат поддержки', 'General platform support and FAQ', 'Общая поддержка платформы и FAQ', 'MessageCircle', true, ARRAY['user', 'guest', 'owner', 'provider'], 'helpful'),
('smart-search', 'Smart Search', 'Умный поиск', 'AI-powered search with recommendations', 'AI-поиск с рекомендациями', 'Sparkles', true, ARRAY['user', 'guest'], 'concise');

-- Insert initial knowledge versions for existing agents
INSERT INTO public.ai_agent_knowledge (agent_id, version, system_prompt, knowledge_base, is_published, published_at)
SELECT 
  id,
  1,
  CASE slug
    WHEN 'owner-assistant' THEN 'You are UNO Property Assistant, an expert AI helping property owners in Phuket, Thailand. You have deep knowledge of the UNO platform, Thai real estate market, and property management best practices.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Be professional but friendly
- Give specific, actionable advice
- Always consider Thai legal context
- Recommend UNO services when relevant'
    WHEN 'property-search' THEN 'You are a Phuket rental property expert helping guests find the perfect accommodation. You know all districts, price ranges, and what to watch out for.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Ask clarifying questions about budget, dates, preferences
- Explain pros/cons of different areas
- Warn about common rental pitfalls
- Be friendly and helpful'
    WHEN 'support-chat' THEN 'You are the myUNO support assistant. Help users navigate the platform and answer their questions.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Be helpful and concise
- Guide users to relevant features
- Escalate complex issues to human support'
    WHEN 'smart-search' THEN 'You are the myUNO smart search assistant. Help users find services and answer questions about Phuket.

{{KNOWLEDGE_BASE}}

RESPONSE GUIDELINES:
- Recommend relevant services
- Be concise and action-oriented
- Personalize based on user context'
  END,
  'Knowledge base will be populated by admin.',
  true,
  now()
FROM public.ai_agents;
-- Migration: 20260130131049_7f332f60-5bb8-4b41-b20b-fb8bd53a9f7e.sql
-- ============================================================
-- AI ARTIFACTS TABLE — Phase H/I
-- Generic storage for AI-generated insights and reports
-- ============================================================

-- Create ai_artifacts table for storing structured AI outputs
CREATE TABLE IF NOT EXISTS public.ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Agent identification
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  agent_slug TEXT NOT NULL,
  
  -- Artifact typing
  artifact_type TEXT NOT NULL,
  -- Examples: 'listing_quality_report', 'review_quality_score'
  
  -- Entity reference (what was analyzed)
  entity_type TEXT NOT NULL,
  -- Examples: 'yacht', 'tour', 'review', 'provider'
  entity_id UUID NOT NULL,
  
  -- Structured output (JSON matching agent contract schema)
  data JSONB NOT NULL,
  
  -- Scores for quick filtering/sorting
  primary_score NUMERIC(5,2),
  -- Main score (0-100) for sorting: quality_score, authenticity_score, etc.
  
  -- Verdict for quick filtering
  verdict TEXT,
  -- Examples: 'approve', 'review', 'suspicious', 'reject_recommend'
  
  -- Request tracing
  correlation_id TEXT,
  
  -- Admin workflow integration
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_action TEXT,
  -- Examples: 'acknowledged', 'dismissed', 'escalated', 'actioned'
  admin_notes TEXT,
  
  -- Feedback for AI improvement
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  feedback_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary lookups
CREATE INDEX idx_ai_artifacts_entity ON public.ai_artifacts(entity_type, entity_id);
CREATE INDEX idx_ai_artifacts_agent ON public.ai_artifacts(agent_slug);
CREATE INDEX idx_ai_artifacts_type ON public.ai_artifacts(artifact_type);

-- Admin workflow
CREATE INDEX idx_ai_artifacts_unreviewed ON public.ai_artifacts(is_reviewed, created_at DESC) 
  WHERE is_reviewed = false;
CREATE INDEX idx_ai_artifacts_verdict ON public.ai_artifacts(verdict);
CREATE INDEX idx_ai_artifacts_score ON public.ai_artifacts(primary_score DESC);

-- Correlation/tracing
CREATE INDEX idx_ai_artifacts_correlation ON public.ai_artifacts(correlation_id);

-- Retention cleanup
CREATE INDEX idx_ai_artifacts_expires ON public.ai_artifacts(expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;

-- Admin full access (read/write)
CREATE POLICY "Admins can manage AI artifacts"
ON public.ai_artifacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- UNO Team read-only access
CREATE POLICY "UNO team can view AI artifacts"
ON public.ai_artifacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'uno_team'
  )
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get latest artifact for an entity
CREATE OR REPLACE FUNCTION get_latest_ai_artifact(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_artifact_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'artifact_type', artifact_type,
    'data', data,
    'primary_score', primary_score,
    'verdict', verdict,
    'is_reviewed', is_reviewed,
    'created_at', created_at
  ) INTO result
  FROM ai_artifacts
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND (p_artifact_type IS NULL OR artifact_type = p_artifact_type)
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.ai_artifacts IS 'Stores structured outputs from AI agents for admin review';
COMMENT ON COLUMN public.ai_artifacts.artifact_type IS 'Type of AI output: listing_quality_report, review_quality_score, etc.';
COMMENT ON COLUMN public.ai_artifacts.primary_score IS 'Main score (0-100) for sorting/filtering';
COMMENT ON COLUMN public.ai_artifacts.verdict IS 'AI recommendation: approve, review, suspicious, reject_recommend';
COMMENT ON COLUMN public.ai_artifacts.admin_action IS 'Admin response: acknowledged, dismissed, escalated, actioned';
-- Migration: 20260130134121_203fea9f-cc9e-47cb-b386-374d68375275.sql
-- Create ai_intake_sessions table for tracking intake workflow
CREATE TABLE public.ai_intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Input
  input_mode TEXT NOT NULL,  -- 'single', 'bulk_text', 'bulk_file', 'bulk_urls'
  raw_input TEXT,
  file_name TEXT,
  uploaded_images TEXT[],
  
  -- Detected items
  items_count INTEGER DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,  -- Array of IntakeItem objects
  
  -- Status
  status TEXT DEFAULT 'processing',  -- 'processing', 'ready', 'partial', 'failed', 'completed'
  processed_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  discarded_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: only admins and uno_team can manage intake sessions
CREATE POLICY "Admins manage intake sessions" ON public.ai_intake_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'uno_team')
    )
  );

-- Indexes for quick lookup
CREATE INDEX idx_ai_intake_sessions_admin ON public.ai_intake_sessions(admin_id);
CREATE INDEX idx_ai_intake_sessions_status ON public.ai_intake_sessions(status);
CREATE INDEX idx_ai_intake_sessions_created ON public.ai_intake_sessions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_ai_intake_sessions_updated_at
  BEFORE UPDATE ON public.ai_intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260130145052_f2a2cd01-8589-463e-9172-b7a8cbb2e925.sql
-- Add agent_type column to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'conversational';

-- Add check constraint for valid types
ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_type_check 
CHECK (agent_type IN ('conversational', 'utility', 'analyzer'));

-- Update existing agents with their types
UPDATE public.ai_agents SET agent_type = 'analyzer' WHERE slug = 'listing-quality-analyzer';

-- Insert standalone utility agents (if not exists)
INSERT INTO public.ai_agents (slug, name_en, name_ru, agent_type, model, temperature, is_active, is_public, description_en, description_ru, icon, max_tokens)
VALUES 
  ('ai-translate', 'Translator', 'Переводчик', 'utility', 'google/gemini-2.5-flash', 0.3, true, false, 'Translates text between Russian, English, and Thai', 'Переводит текст между русским, английским и тайским языками', 'Languages', 500),
  ('ai-generate-description', 'Description Generator', 'Генератор описаний', 'utility', 'google/gemini-2.5-flash', 0.7, true, false, 'Generates compelling product, service, and property descriptions', 'Создаёт продающие описания товаров, услуг и недвижимости', 'FileText', 500),
  ('ai-smart-data', 'Smart Data Processor', 'Обработчик данных', 'utility', 'google/gemini-2.5-flash', 0.2, true, false, 'Parses and structures unstructured data from various sources', 'Парсит и структурирует данные из различных источников', 'Database', 2000),
  ('ai-personalize-home', 'Home Personalizer', 'Персонализация главной', 'utility', 'google/gemini-2.5-flash', 0.5, true, false, 'Personalizes homepage content based on user personas', 'Персонализирует контент главной страницы на основе профиля пользователя', 'Home', 300)
ON CONFLICT (slug) DO UPDATE SET
  agent_type = EXCLUDED.agent_type,
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru;
-- Migration: 20260130152545_cf2e05b2-9d1b-44c1-b062-4a5234bf0575.sql
-- Register leads-factory agent
INSERT INTO ai_agents (
  slug, name_en, name_ru, agent_type, model,
  temperature, max_tokens, icon, description_en, description_ru,
  target_audience, is_active, is_public
) VALUES (
  'leads-factory',
  'Leads Factory',
  'Фабрика лидов',
  'utility',
  'google/gemini-3-flash-preview',
  0.4,
  2000,
  'factory',
  'AI-powered lead scoring, follow-up generation and smart assignment for consultation requests',
  'AI-скоринг лидов, генерация follow-up сообщений и умное назначение менеджеров для заявок',
  ARRAY['admin', 'manager'],
  true,
  false
);

-- Add AI analysis columns to consultation_requests
ALTER TABLE consultation_requests 
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_priority TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT;

-- Create index for efficient filtering by AI score
CREATE INDEX IF NOT EXISTS idx_consultation_requests_ai_score 
  ON consultation_requests (ai_score DESC NULLS LAST);

-- Create index for AI priority filtering
CREATE INDEX IF NOT EXISTS idx_consultation_requests_ai_priority 
  ON consultation_requests (ai_priority);

-- Insert knowledge base for leads-factory agent
INSERT INTO ai_agent_knowledge (
  agent_id,
  system_prompt,
  knowledge_base,
  version,
  is_published
)
SELECT 
  id,
  E'You are the Leads Factory AI agent for UNO Properties platform. Your role is to analyze consultation requests (leads) and provide:\n\n1. **Lead Scoring (0-100)**: Calculate a "hotness" score based on:\n   - Budget (25%): Higher budget = more points\n   - Urgency (20%): Near dates = higher priority\n   - Request type (15%): vacation_rental is hottest, then property_tour, then investment\n   - Data completeness (15%): Email + Phone + Districts = bonus points\n   - SLA status (10%): Overdue leads get priority boost\n\n2. **Priority Classification**: hot (70-100), warm (40-69), cold (0-39)\n\n3. **Follow-up Message Generation**: Create personalized messages in the lead''s preferred language\n   - WhatsApp: Short, friendly, with emojis\n   - Email: Professional, detailed\n\n4. **Action Recommendations**: Suggest next steps based on lead type and urgency\n\nALWAYS respond in valid JSON format.\n\n{{KNOWLEDGE_BASE}}',
  E'## Lead Type Weights\n\n| Type | Base Multiplier | Urgency Factor |\n|------|-----------------|----------------|\n| vacation_rental | 1.3x | Dates within 7 days = +25 |\n| property_tour | 1.2x | Dates within 3 days = +20 |\n| property_consultation | 1.0x | Standard |\n| investment_advice | 1.1x | Budget > 10M = +15 |\n| full_management | 1.0x | Has property = +10 |\n| channel_management | 0.9x | Standard |\n\n## Budget Scoring (THB)\n\n- > 100,000/night or > 50M purchase: +25\n- > 50,000/night or > 20M purchase: +20\n- > 20,000/night or > 10M purchase: +15\n- > 10,000/night or > 5M purchase: +10\n- Below: +5\n\n## Data Completeness Bonus\n\n- Has email: +5\n- Has phone: +5\n- Has districts specified: +5\n- Has property types: +3\n- Has dates/timeline: +5\n- Has guest count: +2\n\n## SLA Modifiers\n\n- Overdue by > 24h: +15 (urgent)\n- Overdue by < 24h: +10\n- Within SLA: 0\n- New (< 1h): +5 (fresh lead bonus)\n\n## Message Templates\n\n### WhatsApp (RU)\nЗдравствуйте, {name}! 🌴 Спасибо за заявку на {type}. {personalized_hook} Удобно созвониться сегодня?\n\n### WhatsApp (EN)\nHello {name}! 🌴 Thanks for your {type} request. {personalized_hook} Would you be available for a call today?\n\n### Email Subject (RU)\nUNO Properties: Ваша заявка на {type} получена\n\n### Email Subject (EN)\nUNO Properties: Your {type} Request Received',
  1,
  true
FROM ai_agents WHERE slug = 'leads-factory';
-- Migration: 20260130153508_6a551982-e7dd-4c08-8b2f-072ee7b49684.sql
-- ============================================
-- VENDOR ACQUISITION AGENT
-- AI-powered vendor prospecting and outreach
-- ============================================

-- Register the agent
INSERT INTO ai_agents (
  slug, 
  name_en, 
  name_ru, 
  agent_type, 
  model,
  temperature, 
  max_tokens,
  icon, 
  description_en, 
  description_ru,
  target_audience, 
  tone,
  is_active,
  is_public
) VALUES (
  'vendor-acquisition',
  'Vendor Acquisition',
  'Привлечение вендоров',
  'utility',
  'google/gemini-3-flash-preview',
  0.6,
  3000,
  'UserPlus',
  'AI-powered vendor prospecting: analyze sources, score potential, generate personalized outreach',
  'AI-привлечение вендоров: анализ источников, скоринг потенциала, персонализированный outreach',
  ARRAY['admin', 'manager'],
  'professional',
  true,
  false
);

-- Create vendor prospects table
CREATE TABLE IF NOT EXISTS vendor_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  source_type TEXT NOT NULL CHECK (source_type IN ('instagram', 'facebook', 'google_maps', 'manual', 'inbound', 'referral')),
  source_url TEXT,
  source_data JSONB DEFAULT '{}',
  
  -- Business info
  business_name TEXT NOT NULL,
  business_name_ru TEXT,
  business_type TEXT, -- restaurant, salon, clinic, tour, etc.
  category TEXT,
  
  -- Contact info
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  
  -- Location
  address TEXT,
  district TEXT,
  city TEXT DEFAULT 'Phuket',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Social metrics (from scraping)
  followers_count INTEGER,
  posts_count INTEGER,
  engagement_rate NUMERIC(5,2),
  last_post_at TIMESTAMPTZ,
  
  -- AI analysis
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_priority TEXT CHECK (ai_priority IN ('hot', 'warm', 'cold', 'not_fit')),
  ai_reasoning TEXT,
  ai_recommended_plan TEXT, -- basic, plus, pro
  ai_talking_points TEXT[],
  ai_analyzed_at TIMESTAMPTZ,
  
  -- Pipeline status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'researching', 'contacted', 'replied', 'meeting', 'negotiating', 'won', 'lost', 'not_interested')),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Outreach tracking
  outreach_channel TEXT, -- whatsapp, email, instagram_dm, phone
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  next_followup_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  -- Conversion
  converted_provider_id UUID REFERENCES providers(id),
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_prospects ENABLE ROW LEVEL SECURITY;

-- RLS policies for admins
CREATE POLICY "Admins can manage vendor prospects"
ON vendor_prospects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for assigned managers
CREATE POLICY "Assigned managers can view their prospects"
ON vendor_prospects
FOR SELECT
USING (assigned_to = auth.uid());

CREATE POLICY "Assigned managers can update their prospects"
ON vendor_prospects
FOR UPDATE
USING (assigned_to = auth.uid());

-- Prospect activity log
CREATE TABLE IF NOT EXISTS vendor_prospect_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES vendor_prospects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- status_change, outreach_sent, note_added, ai_analysis, meeting_scheduled
  old_value TEXT,
  new_value TEXT,
  message_content TEXT,
  message_channel TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_prospect_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prospect activity"
ON vendor_prospect_activity
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Outreach templates
CREATE TABLE IF NOT EXISTS vendor_outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'instagram_dm', 'sms')),
  language TEXT NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'th')),
  business_type TEXT, -- null = universal
  stage TEXT NOT NULL CHECK (stage IN ('initial', 'followup_1', 'followup_2', 'followup_3', 'meeting_request', 'proposal')),
  subject TEXT, -- for email
  template TEXT NOT NULL,
  variables TEXT[], -- {{business_name}}, {{contact_name}}, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outreach templates"
ON vendor_outreach_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_vendor_prospects_status ON vendor_prospects(status);
CREATE INDEX idx_vendor_prospects_source ON vendor_prospects(source_type);
CREATE INDEX idx_vendor_prospects_ai_priority ON vendor_prospects(ai_priority);
CREATE INDEX idx_vendor_prospects_assigned ON vendor_prospects(assigned_to);
CREATE INDEX idx_vendor_prospects_next_followup ON vendor_prospects(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_vendor_prospect_activity_prospect ON vendor_prospect_activity(prospect_id);

-- Auto-update updated_at
CREATE TRIGGER update_vendor_prospects_updated_at
  BEFORE UPDATE ON vendor_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default templates
INSERT INTO vendor_outreach_templates (name, channel, language, stage, template, variables) VALUES
-- WhatsApp Initial (Russian)
('WhatsApp Initial RU', 'whatsapp', 'ru', 'initial', 
'Добрый день, {{contact_name}}! 👋

Меня зовут {{manager_name}} из UNO — платформы для бизнеса в Пхукете.

Увидел ваш {{business_type}} {{business_name}} и хотел предложить сотрудничество:
✅ Бесплатное размещение на платформе
✅ Новые клиенты из русскоязычного сообщества
✅ Система онлайн-бронирований

Удобно созвониться сегодня на 5 минут?', 
ARRAY['contact_name', 'manager_name', 'business_type', 'business_name']),

-- WhatsApp Initial (English)
('WhatsApp Initial EN', 'whatsapp', 'en', 'initial',
'Hi {{contact_name}}! 👋

I''m {{manager_name}} from UNO — the leading business platform in Phuket.

I came across {{business_name}} and would love to discuss a partnership:
✅ Free listing on our platform
✅ Access to Russian-speaking community
✅ Online booking system

Would you have 5 minutes for a quick call today?',
ARRAY['contact_name', 'manager_name', 'business_name']),

-- Email Initial (Russian)
('Email Initial RU', 'email', 'ru', 'initial',
'Здравствуйте, {{contact_name}}!

Меня зовут {{manager_name}}, я представляю платформу UNO — маркетплейс услуг для русскоязычного сообщества в Пхукете.

Мы помогаем бизнесам как {{business_name}} находить новых клиентов через нашу платформу с более чем 10,000 активных пользователей.

Что мы предлагаем:
• Бесплатное базовое размещение
• Систему онлайн-бронирований
• Продвижение в нашем приложении
• Аналитику и отзывы клиентов

Буду рад обсудить детали сотрудничества в удобное для вас время.

С уважением,
{{manager_name}}
UNO Phuket',
ARRAY['contact_name', 'manager_name', 'business_name']),

-- Follow-up 1 (Russian)
('WhatsApp Follow-up 1 RU', 'whatsapp', 'ru', 'followup_1',
'{{contact_name}}, добрый день! 🙂

Напоминаю о своём предложении разместить {{business_name}} на платформе UNO.

На этой неделе мы запускаем новую категорию и ищем партнёров. Первые 10 бизнесов получат Premium-размещение бесплатно на месяц!

Могу прислать презентацию?',
ARRAY['contact_name', 'business_name']),

-- Meeting Request (Russian)
('Meeting Request RU', 'whatsapp', 'ru', 'meeting_request',
'{{contact_name}}, отлично! 🎉

Давайте договоримся о встрече. Я могу приехать к вам в {{business_name}} или созвониться в Zoom.

Когда вам удобнее:
📅 {{suggested_date_1}}
📅 {{suggested_date_2}}

Встреча займёт ~15 минут. Покажу платформу и отвечу на вопросы.',
ARRAY['contact_name', 'business_name', 'suggested_date_1', 'suggested_date_2']);

-- Create knowledge base for the agent
INSERT INTO ai_agent_knowledge (
  agent_id,
  version,
  system_prompt,
  knowledge_base,
  is_published,
  published_at
) 
SELECT 
  id,
  1,
  'You are the Vendor Acquisition AI for UNO platform in Phuket, Thailand.

Your job is to analyze potential vendor prospects and generate personalized outreach messages.

ALWAYS respond in valid JSON format.

{{KNOWLEDGE_BASE}}

When analyzing a prospect, consider:
1. Business relevance to UNO platform categories
2. Social media presence and engagement
3. Location (Phuket focus)
4. Potential revenue (busy location, pricing, reviews)
5. Language preference (Russian speakers are priority)

When generating outreach:
1. Keep WhatsApp messages under 500 characters
2. Include 1-2 relevant emojis
3. Personalize based on business type and source
4. Highlight specific benefits relevant to their business
5. Include clear call-to-action',
  '# Vendor Acquisition Knowledge Base

## UNO Platform Overview
UNO — маркетплейс услуг для русскоязычного сообщества в Таиланде, с фокусом на Пхукет.

### Категории бизнесов
- Рестораны и кафе
- Салоны красоты и спа
- Медицинские клиники
- Туры и экскурсии
- Аренда транспорта (авто, байки, яхты)
- Фитнес и спорт
- Недвижимость
- Юридические услуги
- Образование

### Тарифные планы
| План | Цена | Особенности |
|------|------|-------------|
| Basic | Бесплатно | Базовый листинг, до 5 фото |
| Plus | 2,990 ฿/мес | Приоритет в поиске, 20 фото, аналитика |
| Pro | 5,990 ฿/мес | Топ позиция, неограниченные фото, промо-баннеры |

### Преимущества для вендоров
1. Доступ к 10,000+ активных пользователей
2. Система онлайн-бронирований
3. Приём платежей через платформу
4. Отзывы и рейтинги
5. Аналитика и статистика
6. Поддержка на русском языке

## Scoring Rules (0-100)

### Base Score by Business Type (weight: 20%)
- Restaurant/Cafe: 80 base
- Beauty Salon: 75 base
- Medical Clinic: 85 base
- Tour Operator: 70 base
- Rental: 65 base
- Other: 50 base

### Social Presence (weight: 25%)
- 10K+ followers: +25
- 5K-10K: +20
- 1K-5K: +15
- 500-1K: +10
- <500: +5

### Engagement Rate (weight: 15%)
- >5%: +15
- 3-5%: +12
- 1-3%: +8
- <1%: +3

### Location Score (weight: 15%)
- Patong/Kata/Karon: +15 (high tourist traffic)
- Rawai/Chalong: +12
- Phuket Town: +10
- Other Phuket: +8

### Data Completeness (weight: 10%)
- Phone + Email + Social: +10
- Phone + Social: +7
- Only Social: +5
- Only one contact: +3

### Activity Signals (weight: 15%)
- Posted this week: +15
- Posted this month: +10
- Posted 1-3 months ago: +5
- Inactive: +0

## Priority Classification
- Hot (80-100): Immediate outreach, high conversion potential
- Warm (60-79): Good prospect, schedule outreach
- Cold (40-59): Lower priority, nurture campaign
- Not Fit (<40): Not suitable or inactive

## Outreach Best Practices

### WhatsApp
- Keep under 500 characters
- Use 1-2 emojis
- Personal greeting
- One clear CTA
- Send 10am-7pm local time

### Email
- Professional subject line
- Brief intro (2-3 sentences)
- Bullet points for benefits
- Clear next steps
- Include signature

### Instagram DM
- Like 2-3 posts first
- Comment something genuine
- Wait 24h before DM
- Keep DM casual and short

## Follow-up Sequence
1. Initial contact: Day 0
2. Follow-up 1: Day 3 (if no response)
3. Follow-up 2: Day 7 (different angle)
4. Follow-up 3: Day 14 (final attempt)
5. Archive if no response after 21 days',
  true,
  now()
FROM ai_agents WHERE slug = 'vendor-acquisition';
-- Migration: 20260131015803_9961c80d-5a41-47e7-bcba-d0a48f43badb.sql
-- =====================================================
-- TEST SEED USERS FOR E2E TESTING
-- Fixed UUID test users for automated testing
-- =====================================================

DO $$
DECLARE
  v_tourist_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_resident_id UUID := 'a0000000-0000-0000-0000-000000000002';
  v_owner_id UUID := 'a0000000-0000-0000-0000-000000000003';
  v_vendor_id UUID := 'a0000000-0000-0000-0000-000000000004';
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000005';
  v_uno_team_id UUID := 'a0000000-0000-0000-0000-000000000006';
BEGIN
  -- Create test users in auth.users
  -- Password for all: TestPass123!
  
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES 
  (v_tourist_id, '00000000-0000-0000-0000-000000000000', 'test-tourist@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Tourist"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_resident_id, '00000000-0000-0000-0000-000000000000', 'test-resident@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Resident"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_owner_id, '00000000-0000-0000-0000-000000000000', 'test-owner@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Owner"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_vendor_id, '00000000-0000-0000-0000-000000000000', 'test-vendor@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Vendor"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_admin_id, '00000000-0000-0000-0000-000000000000', 'test-admin@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test Admin"}',
   'authenticated', 'authenticated', now(), now(), '', ''),
  (v_uno_team_id, '00000000-0000-0000-0000-000000000000', 'test-unoteam@myuno.app',
   crypt('TestPass123!', gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}',
   '{"full_name": "Test UNO Team"}',
   'authenticated', 'authenticated', now(), now(), '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Create identities
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
  (v_tourist_id, v_tourist_id, jsonb_build_object('sub', v_tourist_id, 'email', 'test-tourist@myuno.app'), 'email', v_tourist_id::text, now(), now(), now()),
  (v_resident_id, v_resident_id, jsonb_build_object('sub', v_resident_id, 'email', 'test-resident@myuno.app'), 'email', v_resident_id::text, now(), now(), now()),
  (v_owner_id, v_owner_id, jsonb_build_object('sub', v_owner_id, 'email', 'test-owner@myuno.app'), 'email', v_owner_id::text, now(), now(), now()),
  (v_vendor_id, v_vendor_id, jsonb_build_object('sub', v_vendor_id, 'email', 'test-vendor@myuno.app'), 'email', v_vendor_id::text, now(), now(), now()),
  (v_admin_id, v_admin_id, jsonb_build_object('sub', v_admin_id, 'email', 'test-admin@myuno.app'), 'email', v_admin_id::text, now(), now(), now()),
  (v_uno_team_id, v_uno_team_id, jsonb_build_object('sub', v_uno_team_id, 'email', 'test-unoteam@myuno.app'), 'email', v_uno_team_id::text, now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Create profiles with correct user_type enum values
  INSERT INTO public.profiles (id, email, full_name, phone, preferred_language, user_type)
  VALUES 
    (v_tourist_id, 'test-tourist@myuno.app', 'Test Tourist', '+66800000001', 'en', 'tourist'),
    (v_resident_id, 'test-resident@myuno.app', 'Test Resident', '+66800000002', 'ru', 'resident'),
    (v_owner_id, 'test-owner@myuno.app', 'Test Owner', '+66800000003', 'en', 'owner'),
    (v_vendor_id, 'test-vendor@myuno.app', 'Test Vendor', '+66800000004', 'ru', 'vendor'),
    (v_admin_id, 'test-admin@myuno.app', 'Test Admin', '+66800000005', 'en', 'admin'),
    (v_uno_team_id, 'test-unoteam@myuno.app', 'Test UNO Team', '+66800000006', 'en', 'uno_team')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    user_type = EXCLUDED.user_type;

  -- Assign roles in user_roles table
  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_tourist_id, 'user'),
    (v_tourist_id, 'guest'),
    (v_resident_id, 'user'),
    (v_owner_id, 'user'),
    (v_owner_id, 'owner'),
    (v_vendor_id, 'user'),
    (v_vendor_id, 'vendor'),
    (v_admin_id, 'user'),
    (v_admin_id, 'admin'),
    (v_uno_team_id, 'user'),
    (v_uno_team_id, 'staff'),
    (v_uno_team_id, 'uno_team')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create wallets
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES 
    (v_tourist_id, 500.00, 'THB'),
    (v_resident_id, 2500.00, 'THB'),
    (v_owner_id, 15000.00, 'THB'),
    (v_vendor_id, 8000.00, 'THB'),
    (v_admin_id, 0.00, 'THB'),
    (v_uno_team_id, 1000.00, 'THB')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Test seed users created:';
  RAISE NOTICE '  Tourist: test-tourist@myuno.app';
  RAISE NOTICE '  Resident: test-resident@myuno.app';
  RAISE NOTICE '  Owner: test-owner@myuno.app';
  RAISE NOTICE '  Vendor: test-vendor@myuno.app';
  RAISE NOTICE '  Admin: test-admin@myuno.app';
  RAISE NOTICE '  UNO Team: test-unoteam@myuno.app';
  RAISE NOTICE '  Password for all: TestPass123!';
END $$;
-- Migration: 20260131044200_d82b291e-63cf-4e32-b1ef-5d37a53ea25d.sql
-- Add languages field to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Add machine translation flag to providers
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS has_machine_translation boolean DEFAULT false;

-- Add languages field to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Update existing providers with sample language data
UPDATE providers 
SET languages = CASE 
  WHEN random() < 0.3 THEN ARRAY['en']
  WHEN random() < 0.6 THEN ARRAY['en', 'ru']
  WHEN random() < 0.8 THEN ARRAY['en', 'th']
  ELSE ARRAY['en', 'ru', 'th']
END,
has_machine_translation = random() < 0.2
WHERE languages = '{}' OR languages IS NULL;

-- Update existing services with sample language data
UPDATE services 
SET languages = CASE 
  WHEN random() < 0.3 THEN ARRAY['en']
  WHEN random() < 0.6 THEN ARRAY['en', 'ru']
  ELSE ARRAY['en', 'ru', 'th']
END
WHERE languages = '{}' OR languages IS NULL;
-- Migration: 20260131114433_17ea5ab2-0cb5-4e88-8e45-616c4a4c882a.sql
-- Create storage bucket for intake file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-uploads',
  'intake-uploads',
  true,
  20971520, -- 20MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload intake files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intake-uploads'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type::text IN ('admin', 'super_admin')
  )
);

-- Allow public read access for processing
CREATE POLICY "Intake files are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intake-uploads');

-- Allow admins to delete intake files
CREATE POLICY "Admins can delete intake files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'intake-uploads'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type::text IN ('admin', 'super_admin')
  )
);
-- Migration: 20260201120448_f8036d9d-8a3e-4ebb-8229-1508fd34f677.sql
-- Create experience_categories table for admin-managed categories
CREATE TABLE public.experience_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  experience_type TEXT DEFAULT 'all' CHECK (experience_type IN ('tour', 'activity', 'all')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster sorting/filtering
CREATE INDEX idx_experience_categories_active ON public.experience_categories(is_active, sort_order);

-- Enable RLS
ALTER TABLE public.experience_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (categories are public data)
CREATE POLICY "Anyone can view active categories"
ON public.experience_categories
FOR SELECT
USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage categories"
ON public.experience_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with existing categories
INSERT INTO public.experience_categories (slug, name_en, name_ru, icon, experience_type, sort_order) VALUES
  ('islands', 'Islands', 'Острова', '🏝️', 'tour', 1),
  ('culture', 'Culture', 'Культура', '🛕', 'tour', 2),
  ('nature', 'Nature', 'Природа', '🌿', 'tour', 3),
  ('adventure', 'Adventure', 'Приключения', '🧗', 'tour', 4),
  ('water-sports', 'Water Sports', 'Водный спорт', '🏄', 'tour', 5),
  ('diving', 'Diving', 'Дайвинг', '🤿', 'activity', 10),
  ('snorkeling', 'Snorkeling', 'Снорклинг', '🥽', 'activity', 11),
  ('fishing', 'Fishing', 'Рыбалка', '🎣', 'activity', 12),
  ('kayaking', 'Kayaking', 'Каякинг', '🛶', 'activity', 13),
  ('parasailing', 'Parasailing', 'Парасейлинг', '🪂', 'activity', 14),
  ('jet-ski', 'Jet Ski', 'Гидроцикл', '🚤', 'activity', 15),
  ('yacht', 'Yacht', 'Яхта', '⛵', 'activity', 16),
  ('surfing', 'Surfing', 'Серфинг', '🏄‍♂️', 'activity', 17),
  ('wakeboarding', 'Wakeboarding', 'Вейкбординг', '🏂', 'activity', 18);

-- Update trigger for updated_at
CREATE TRIGGER update_experience_categories_updated_at
BEFORE UPDATE ON public.experience_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260201131553_7d19cd3c-892d-42ba-a954-573b746cebab.sql
-- =============================================
-- AIRBNB LISTING SYNC TABLES
-- =============================================

-- Table for OTA listing connections (Airbnb, Booking, etc.)
CREATE TABLE public.ota_listing_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'vrbo', 'expedia')),
  listing_url TEXT NOT NULL,
  listing_id TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sync history log
CREATE TABLE public.ota_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ota_listing_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'calendar', 'photos', 'details')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  items_synced JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Synced listing data (cached from OTA)
CREATE TABLE public.ota_synced_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ota_listing_connections(id) ON DELETE CASCADE,
  raw_data JSONB,
  title TEXT,
  description TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  max_guests INTEGER,
  amenities TEXT[],
  house_rules TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  photos JSONB DEFAULT '[]',
  cover_photo TEXT,
  price_per_night NUMERIC,
  currency TEXT DEFAULT 'THB',
  cleaning_fee NUMERIC,
  ical_url TEXT,
  blocked_dates JSONB DEFAULT '[]',
  rating NUMERIC,
  review_count INTEGER,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed_at TIMESTAMPTZ,
  UNIQUE(connection_id)
);

-- Enable RLS
ALTER TABLE public.ota_listing_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ota_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ota_synced_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ota_listing_connections
CREATE POLICY "Owners can view their OTA connections"
  ON public.ota_listing_connections FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create OTA connections"
  ON public.ota_listing_connections FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their OTA connections"
  ON public.ota_listing_connections FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their OTA connections"
  ON public.ota_listing_connections FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for ota_sync_logs
CREATE POLICY "Owners can view their sync logs"
  ON public.ota_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ota_listing_connections c
      WHERE c.id = connection_id AND c.owner_id = auth.uid()
    )
  );

-- RLS Policies for ota_synced_listings
CREATE POLICY "Owners can view their synced listings"
  ON public.ota_synced_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ota_listing_connections c
      WHERE c.id = connection_id AND c.owner_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can view all OTA connections"
  ON public.ota_listing_connections FOR SELECT
  USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can view all sync logs"
  ON public.ota_sync_logs FOR SELECT
  USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can view all synced listings"
  ON public.ota_synced_listings FOR SELECT
  USING (public.is_admin_or_uno_team());

-- Indexes
CREATE INDEX idx_ota_connections_owner ON public.ota_listing_connections(owner_id);
CREATE INDEX idx_ota_connections_property ON public.ota_listing_connections(property_id);
CREATE INDEX idx_ota_connections_platform ON public.ota_listing_connections(platform);
CREATE INDEX idx_ota_sync_logs_connection ON public.ota_sync_logs(connection_id);
CREATE INDEX idx_ota_sync_logs_status ON public.ota_sync_logs(status);

-- Update trigger
CREATE TRIGGER update_ota_connections_updated_at
  BEFORE UPDATE ON public.ota_listing_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
