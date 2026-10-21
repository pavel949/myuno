/**
 * Property Complex taxonomy constants
 * Used in chip selectors for complex amenities, services, security, infrastructure
 */

export const COMPLEX_TYPES = [
  { value: 'condo', labelTh: 'คอนโดมิเนียม', labelEn: 'Condominium', labelRu: 'Кондоминиум' },
  { value: 'villa', labelTh: 'หมู่บ้านวิลล่า', labelEn: 'Villa Estate', labelRu: 'Вилловый посёлок' },
  { value: 'mixed', labelTh: 'โครงการผสมผสาน', labelEn: 'Mixed Use', labelRu: 'Смешанный' },
  { value: 'townhouse', labelTh: 'ทาวน์เฮาส์', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
  { value: 'apartment', labelTh: 'อพาร์ตเมนต์', labelEn: 'Apartment', labelRu: 'Апартаменты' },
  { value: 'resort', labelTh: 'รีสอร์ต', labelEn: 'Resort', labelRu: 'Курорт' },
] as const;

export const COMPLEX_AMENITIES = [
  { value: 'swimming_pool', labelTh: 'สระว่ายน้ำ', labelEn: 'Swimming Pool', labelRu: 'Бассейн', icon: '🏊' },
  { value: 'kids_pool', labelTh: 'สระเด็ก', labelEn: 'Kids Pool', labelRu: 'Детский бассейн', icon: '🧒' },
  { value: 'gym', labelTh: 'ศูนย์ออกกำลังกาย', labelEn: 'Fitness Center', labelRu: 'Фитнес-центр', icon: '🏋️' },
  { value: 'sauna', labelTh: 'ซาวน่า', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
  { value: 'steam_room', labelTh: 'ห้องอบไอน้ำ', labelEn: 'Steam Room', labelRu: 'Хамам', icon: '♨️' },
  { value: 'jacuzzi', labelTh: 'อ่างจากุซซี่', labelEn: 'Jacuzzi', labelRu: 'Джакузи', icon: '🛁' },
  { value: 'playground', labelTh: 'สนามเด็กเล่น', labelEn: 'Playground', labelRu: 'Детская площадка', icon: '🛝' },
  { value: 'garden', labelTh: 'สวน', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
  { value: 'rooftop', labelTh: 'ดาดฟ้า', labelEn: 'Rooftop', labelRu: 'Терраса на крыше', icon: '🏙️' },
  { value: 'bbq_area', labelTh: 'พื้นที่บาร์บีคิว', labelEn: 'BBQ Area', labelRu: 'Зона барбекю', icon: '🍖' },
  { value: 'lobby', labelTh: 'ล็อบบี้', labelEn: 'Lobby', labelRu: 'Лобби', icon: '🏢' },
  { value: 'elevator', labelTh: 'ลิฟต์', labelEn: 'Elevator', labelRu: 'Лифт', icon: '🛗' },
  { value: 'tennis_court', labelTh: 'สนามเทนนิส', labelEn: 'Tennis Court', labelRu: 'Теннисный корт', icon: '🎾' },
  { value: 'yoga_room', labelTh: 'ห้องโยคะ', labelEn: 'Yoga Room', labelRu: 'Зал для йоги', icon: '🧘' },
  { value: 'library', labelTh: 'ห้องสมุด', labelEn: 'Library', labelRu: 'Библиотека', icon: '📚' },
  { value: 'beach_access', labelTh: 'ทางเข้าชายหาด', labelEn: 'Beach Access', labelRu: 'Доступ к пляжу', icon: '🏖️' },
  { value: 'communal_kitchen', labelTh: 'ครัวส่วนกลาง', labelEn: 'Communal Kitchen', labelRu: 'Общая кухня', icon: '🍳' },
  { value: 'golf', labelTh: 'สนามกอล์ฟ', labelEn: 'Golf Course', labelRu: 'Гольф', icon: '⛳' },
  { value: 'cinema', labelTh: 'โรงภาพยนตร์', labelEn: 'Cinema', labelRu: 'Кинотеатр', icon: '🎬' },
] as const;

export const COMPLEX_SERVICES = [
  { value: '24h_reception', labelTh: 'แผนกต้อนรับ 24 ชั่วโมง', labelEn: '24h Reception', labelRu: 'Стойка 24/7', icon: '🔔' },
  { value: 'shuttle_to_beach', labelTh: 'รถรับส่งชายหาด', labelEn: 'Shuttle to Beach', labelRu: 'Шаттл до пляжа', icon: '🚌' },
  { value: 'concierge', labelTh: 'บริการคอนเซียร์จ', labelEn: 'Concierge', labelRu: 'Консьерж', icon: '🧑‍💼' },
  { value: 'cleaning_service', labelTh: 'บริการทำความสะอาด', labelEn: 'Cleaning Service', labelRu: 'Клининг', icon: '🧹' },
  { value: 'laundry', labelTh: 'บริการซักรีด', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👕' },
  { value: 'maintenance', labelTh: 'บริการบำรุงรักษา', labelEn: 'Maintenance', labelRu: 'Техобслуживание', icon: '🔧' },
  { value: 'parcel_locker', labelTh: 'ตู้รับพัสดุ', labelEn: 'Parcel Locker', labelRu: 'Постамат', icon: '📦' },
  { value: 'car_wash', labelTh: 'ล้างรถ', labelEn: 'Car Wash', labelRu: 'Автомойка', icon: '🚗' },
  { value: 'shuttle_to_airport', labelTh: 'รถรับส่งสนามบิน', labelEn: 'Airport Shuttle', labelRu: 'Шаттл в аэропорт', icon: '✈️' },
  { value: 'pool_service', labelTh: 'บริการดูแลสระว่ายน้ำ', labelEn: 'Pool Service', labelRu: 'Обслуживание бассейна', icon: '🏊' },
] as const;

export const COMPLEX_SECURITY = [
  { value: 'cctv', labelTh: 'กล้องวงจรปิด', labelEn: 'CCTV', labelRu: 'Видеонаблюдение', icon: '📹' },
  { value: 'gated_community', labelTh: 'โครงการแบบปิด', labelEn: 'Gated Community', labelRu: 'Закрытая территория', icon: '🚧' },
  { value: '24h_security', labelTh: 'รักษาความปลอดภัย 24 ชั่วโมง', labelEn: '24h Security', labelRu: 'Охрана 24/7', icon: '🛡️' },
  { value: 'key_card_access', labelTh: 'ระบบเข้าออกด้วยคีย์การ์ด', labelEn: 'Key Card Access', labelRu: 'Доступ по карте', icon: '🔑' },
  { value: 'intercom', labelTh: 'อินเตอร์คอม', labelEn: 'Intercom', labelRu: 'Домофон', icon: '📞' },
  { value: 'fire_alarm', labelTh: 'สัญญาณเตือนไฟไหม้', labelEn: 'Fire Alarm', labelRu: 'Пожарная сигнализация', icon: '🔥' },
  { value: 'flood_sensors', labelTh: 'เซ็นเซอร์น้ำท่วม', labelEn: 'Flood Sensors', labelRu: 'Датчики затопления', icon: '💧' },
] as const;

export const COMPLEX_INFRASTRUCTURE = [
  { value: 'restaurant', labelTh: 'ร้านอาหาร', labelEn: 'Restaurant', labelRu: 'Ресторан', icon: '🍽️' },
  { value: 'cafe', labelTh: 'คาเฟ่', labelEn: 'Café', labelRu: 'Кафе', icon: '☕' },
  { value: 'minimart', labelTh: 'มินิมาร์ท', labelEn: 'Minimart', labelRu: 'Минимаркет', icon: '🏪' },
  { value: 'coworking', labelTh: 'พื้นที่ทำงานร่วมกัน', labelEn: 'Coworking', labelRu: 'Коворкинг', icon: '💻' },
  { value: 'kids_club', labelTh: 'คิดส์คลับ', labelEn: 'Kids Club', labelRu: 'Детский клуб', icon: '🧒' },
  { value: 'spa', labelTh: 'สปา', labelEn: 'Spa', labelRu: 'Спа', icon: '💆' },
  { value: 'parking_garage', labelTh: 'อาคารจอดรถ', labelEn: 'Parking Garage', labelRu: 'Парковка', icon: '🅿️' },
  { value: 'pharmacy', labelTh: 'ร้านขายยา', labelEn: 'Pharmacy', labelRu: 'Аптека', icon: '💊' },
  { value: 'atm', labelTh: 'ตู้เอทีเอ็ม', labelEn: 'ATM', labelRu: 'Банкомат', icon: '🏧' },
] as const;
