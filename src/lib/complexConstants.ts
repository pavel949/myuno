/**
 * Property Complex taxonomy constants
 * Used in chip selectors for complex amenities, services, security, infrastructure
 */

export const COMPLEX_TYPES = [
  { value: 'condo', labelEn: 'Condominium', labelRu: 'Кондоминиум' },
  { value: 'villa', labelEn: 'Villa Estate', labelRu: 'Вилловый посёлок' },
  { value: 'mixed', labelEn: 'Mixed Use', labelRu: 'Смешанный' },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
  { value: 'apartment', labelEn: 'Apartment', labelRu: 'Апартаменты' },
  { value: 'resort', labelEn: 'Resort', labelRu: 'Курорт' },
] as const;

export const COMPLEX_AMENITIES = [
  { value: 'swimming_pool', labelEn: 'Swimming Pool', labelRu: 'Бассейн', icon: '🏊' },
  { value: 'gym', labelEn: 'Fitness Center', labelRu: 'Фитнес-центр', icon: '🏋️' },
  { value: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна', icon: '🧖' },
  { value: 'steam_room', labelEn: 'Steam Room', labelRu: 'Хамам', icon: '♨️' },
  { value: 'jacuzzi', labelEn: 'Jacuzzi', labelRu: 'Джакузи', icon: '🛁' },
  { value: 'playground', labelEn: 'Playground', labelRu: 'Детская площадка', icon: '🛝' },
  { value: 'garden', labelEn: 'Garden', labelRu: 'Сад', icon: '🌳' },
  { value: 'rooftop', labelEn: 'Rooftop', labelRu: 'Терраса на крыше', icon: '🏙️' },
  { value: 'bbq_area', labelEn: 'BBQ Area', labelRu: 'Зона барбекю', icon: '🍖' },
  { value: 'lobby', labelEn: 'Lobby', labelRu: 'Лобби', icon: '🏢' },
  { value: 'elevator', labelEn: 'Elevator', labelRu: 'Лифт', icon: '🛗' },
  { value: 'tennis_court', labelEn: 'Tennis Court', labelRu: 'Теннисный корт', icon: '🎾' },
  { value: 'yoga_room', labelEn: 'Yoga Room', labelRu: 'Зал для йоги', icon: '🧘' },
  { value: 'library', labelEn: 'Library', labelRu: 'Библиотека', icon: '📚' },
] as const;

export const COMPLEX_SERVICES = [
  { value: '24h_reception', labelEn: '24h Reception', labelRu: 'Стойка 24/7', icon: '🔔' },
  { value: 'shuttle_to_beach', labelEn: 'Shuttle to Beach', labelRu: 'Шаттл до пляжа', icon: '🚌' },
  { value: 'concierge', labelEn: 'Concierge', labelRu: 'Консьерж', icon: '🧑‍💼' },
  { value: 'cleaning_service', labelEn: 'Cleaning Service', labelRu: 'Клининг', icon: '🧹' },
  { value: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная', icon: '👕' },
  { value: 'maintenance', labelEn: 'Maintenance', labelRu: 'Техобслуживание', icon: '🔧' },
  { value: 'parcel_locker', labelEn: 'Parcel Locker', labelRu: 'Постамат', icon: '📦' },
  { value: 'car_wash', labelEn: 'Car Wash', labelRu: 'Автомойка', icon: '🚗' },
  { value: 'shuttle_to_airport', labelEn: 'Airport Shuttle', labelRu: 'Шаттл в аэропорт', icon: '✈️' },
  { value: 'pool_service', labelEn: 'Pool Service', labelRu: 'Обслуживание бассейна', icon: '🏊' },
] as const;

export const COMPLEX_SECURITY = [
  { value: 'cctv', labelEn: 'CCTV', labelRu: 'Видеонаблюдение', icon: '📹' },
  { value: 'gated_community', labelEn: 'Gated Community', labelRu: 'Закрытая территория', icon: '🚧' },
  { value: '24h_security', labelEn: '24h Security', labelRu: 'Охрана 24/7', icon: '🛡️' },
  { value: 'key_card_access', labelEn: 'Key Card Access', labelRu: 'Доступ по карте', icon: '🔑' },
  { value: 'intercom', labelEn: 'Intercom', labelRu: 'Домофон', icon: '📞' },
  { value: 'fire_alarm', labelEn: 'Fire Alarm', labelRu: 'Пожарная сигнализация', icon: '🔥' },
  { value: 'flood_sensors', labelEn: 'Flood Sensors', labelRu: 'Датчики затопления', icon: '💧' },
] as const;

export const COMPLEX_INFRASTRUCTURE = [
  { value: 'restaurant', labelEn: 'Restaurant', labelRu: 'Ресторан', icon: '🍽️' },
  { value: 'cafe', labelEn: 'Café', labelRu: 'Кафе', icon: '☕' },
  { value: 'minimart', labelEn: 'Minimart', labelRu: 'Минимаркет', icon: '🏪' },
  { value: 'coworking', labelEn: 'Coworking', labelRu: 'Коворкинг', icon: '💻' },
  { value: 'kids_club', labelEn: 'Kids Club', labelRu: 'Детский клуб', icon: '🧒' },
  { value: 'spa', labelEn: 'Spa', labelRu: 'Спа', icon: '💆' },
  { value: 'parking_garage', labelEn: 'Parking Garage', labelRu: 'Парковка', icon: '🅿️' },
  { value: 'pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', icon: '💊' },
  { value: 'atm', labelEn: 'ATM', labelRu: 'Банкомат', icon: '🏧' },
] as const;
