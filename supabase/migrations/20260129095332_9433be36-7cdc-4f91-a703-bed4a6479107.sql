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