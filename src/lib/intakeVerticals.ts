/**
 * Intake Verticals Configuration
 * Defines all supported verticals for the AI Intake Listing Agent
 */

export interface FieldLabel {
  en: string;
  ru: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'json' | 'date';
  enumValues?: string[];
}

export interface VerticalConfig {
  id: string;
  table: string;
  nameEn: string;
  nameRu: string;
  icon: string;
  keywords: string[];
  requiredFields: string[];
  optionalFields: string[];
  fieldLabels: Record<string, FieldLabel>;
}

export const INTAKE_VERTICALS: VerticalConfig[] = [
  // 🚤 Yachts
  {
    id: 'yachts',
    table: 'yachts',
    nameEn: 'Yachts',
    nameRu: 'Яхты',
    icon: '🚤',
    keywords: ['yacht', 'яхта', 'boat', 'лодка', 'катер', 'charter', 'чартер', 'vessel', 'судно', 'катамаран', 'catamaran', 'sailboat', 'парусник'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price_half_day', 'price_full_day', 'price_sunset', 'price_overnight', 'capacity', 'length_meters', 'year_built', 'yacht_type', 'cover_image', 'images', 'features_en', 'crew_size'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      price_half_day: { en: 'Price Half Day', ru: 'Цена за полдня', type: 'number' },
      price_full_day: { en: 'Price Full Day', ru: 'Цена за день', type: 'number' },
      price_sunset: { en: 'Price Sunset', ru: 'Цена Sunset', type: 'number' },
      price_overnight: { en: 'Price Overnight', ru: 'Цена Overnight', type: 'number' },
      capacity: { en: 'Capacity', ru: 'Вместимость', type: 'number' },
      length_meters: { en: 'Length (m)', ru: 'Длина (м)', type: 'number' },
      year_built: { en: 'Year Built', ru: 'Год постройки', type: 'number' },
      yacht_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['motor', 'sailing', 'catamaran', 'speedboat'] },
      crew_size: { en: 'Crew Size', ru: 'Размер экипажа', type: 'number' },
      features: { en: 'Features', ru: 'Удобства', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🏠 Properties (Rentals)
  {
    id: 'properties',
    table: 'properties',
    nameEn: 'Properties',
    nameRu: 'Недвижимость',
    icon: '🏠',
    keywords: ['property', 'недвижимость', 'квартира', 'apartment', 'villa', 'вилла', 'condo', 'кондо', 'house', 'дом', 'rent', 'аренда', 'studio', 'студия', 'penthouse', 'пентхаус'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price_per_month', 'price_per_day', 'bedrooms', 'bathrooms', 'area_sqm', 'district', 'address', 'property_type', 'cover_image', 'images', 'amenities', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Title (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Title (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      price_per_month: { en: 'Price/Month', ru: 'Цена/месяц', type: 'number' },
      price_per_day: { en: 'Price/Day', ru: 'Цена/день', type: 'number' },
      bedrooms: { en: 'Bedrooms', ru: 'Спален', type: 'number' },
      bathrooms: { en: 'Bathrooms', ru: 'Ванных', type: 'number' },
      area_sqm: { en: 'Area (sqm)', ru: 'Площадь (м²)', type: 'number' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      property_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['apartment', 'villa', 'condo', 'house', 'studio', 'penthouse'] },
      amenities: { en: 'Amenities', ru: 'Удобства', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🏡 Owner Properties
  {
    id: 'owner_properties',
    table: 'properties',
    nameEn: 'Owner Properties',
    nameRu: 'Объекты собственников',
    icon: '🏡',
    keywords: ['owner property', 'собственник', 'владелец', 'сдаю', 'my property', 'моя квартира', 'моя вилла'],
    requiredFields: ['title_en'],
    optionalFields: ['title_ru', 'description_en', 'description_ru', 'monthly_rent', 'daily_rate', 'bedrooms', 'bathrooms', 'area_sqm', 'district', 'address', 'property_type', 'cover_image', 'images', 'amenities'],
    fieldLabels: {
      title_en: { en: 'Title (EN)', ru: 'Название (EN)', type: 'string' },
      title_ru: { en: 'Title (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      monthly_rent: { en: 'Monthly Rent', ru: 'Месячная аренда', type: 'number' },
      daily_rate: { en: 'Daily Rate', ru: 'Дневная ставка', type: 'number' },
      bedrooms: { en: 'Bedrooms', ru: 'Спален', type: 'number' },
      bathrooms: { en: 'Bathrooms', ru: 'Ванных', type: 'number' },
      area_sqm: { en: 'Area (sqm)', ru: 'Площадь (м²)', type: 'number' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      property_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['apartment', 'villa', 'condo', 'house', 'studio'] },
      amenities: { en: 'Amenities', ru: 'Удобства', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🗺️ Tours
  {
    id: 'tours',
    table: 'tours',
    nameEn: 'Tours',
    nameRu: 'Туры',
    icon: '🗺️',
    keywords: ['tour', 'тур', 'excursion', 'экскурсия', 'trip', 'поездка', 'island hopping', 'островной тур', 'sightseeing', 'обзорная'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price', 'duration_hours', 'tour_type', 'max_participants', 'included', 'cover_image', 'images', 'meeting_point', 'schedule'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      price: { en: 'Price', ru: 'Цена', type: 'number' },
      duration_hours: { en: 'Duration (hours)', ru: 'Длительность (часы)', type: 'number' },
      tour_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['island', 'city', 'adventure', 'cultural', 'food', 'nature'] },
      max_participants: { en: 'Max Participants', ru: 'Макс. участников', type: 'number' },
      included: { en: 'Included', ru: 'Включено', type: 'array' },
      meeting_point: { en: 'Meeting Point', ru: 'Место встречи', type: 'string' },
      schedule: { en: 'Schedule', ru: 'Расписание', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🏄 Water Activities
  {
    id: 'water_activities',
    table: 'water_activities',
    nameEn: 'Water Activities',
    nameRu: 'Водные развлечения',
    icon: '🏄',
    keywords: ['diving', 'дайвинг', 'snorkeling', 'сноркелинг', 'jet ski', 'гидроцикл', 'parasailing', 'парасейлинг', 'kayak', 'каяк', 'surfing', 'сёрфинг', 'wakeboard', 'вейкборд', 'water sport', 'водный спорт'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price', 'duration_minutes', 'activity_type', 'difficulty', 'min_age', 'equipment_included', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      price: { en: 'Price', ru: 'Цена', type: 'number' },
      duration_minutes: { en: 'Duration (min)', ru: 'Длительность (мин)', type: 'number' },
      activity_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['diving', 'snorkeling', 'jet_ski', 'parasailing', 'kayak', 'surfing', 'wakeboard'] },
      difficulty: { en: 'Difficulty', ru: 'Сложность', type: 'string', enumValues: ['beginner', 'intermediate', 'advanced'] },
      min_age: { en: 'Min Age', ru: 'Мин. возраст', type: 'number' },
      equipment_included: { en: 'Equipment Included', ru: 'Снаряжение включено', type: 'boolean' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🍽️ Restaurants
  {
    id: 'restaurants',
    table: 'restaurants',
    nameEn: 'Restaurants',
    nameRu: 'Рестораны',
    icon: '🍽️',
    keywords: ['restaurant', 'ресторан', 'cafe', 'кафе', 'bar', 'бар', 'bistro', 'бистро', 'food', 'еда', 'cuisine', 'кухня', 'menu', 'меню', 'dining', 'обед', 'ужин'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cuisine_type', 'price_range', 'address', 'district', 'phone', 'website', 'working_hours', 'features', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      cuisine_type: { en: 'Cuisine', ru: 'Кухня', type: 'array' },
      price_range: { en: 'Price Range', ru: 'Ценовая категория', type: 'string', enumValues: ['$', '$$', '$$$', '$$$$'] },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      features: { en: 'Features', ru: 'Особенности', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 💇 Salons
  {
    id: 'salons',
    table: 'salons',
    nameEn: 'Beauty Salons',
    nameRu: 'Салоны красоты',
    icon: '💇',
    keywords: ['salon', 'салон', 'spa', 'спа', 'beauty', 'красота', 'massage', 'массаж', 'manicure', 'маникюр', 'pedicure', 'педикюр', 'hair', 'волосы', 'nails', 'ногти'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'salon_type', 'services', 'price_from', 'address', 'district', 'phone', 'working_hours', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      salon_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['beauty', 'spa', 'nails', 'hair', 'massage'] },
      services: { en: 'Services', ru: 'Услуги', type: 'array' },
      price_from: { en: 'Price From', ru: 'Цена от', type: 'number' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🏥 Clinics
  {
    id: 'clinics',
    table: 'clinics',
    nameEn: 'Clinics',
    nameRu: 'Клиники',
    icon: '🏥',
    keywords: ['clinic', 'клиника', 'hospital', 'госпиталь', 'doctor', 'доктор', 'врач', 'medical', 'медицинский', 'dental', 'стоматология', 'health', 'здоровье'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'clinic_type', 'specialty', 'consultation_price', 'address', 'district', 'phone', 'email', 'website', 'working_hours', 'languages', 'is_24h', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      clinic_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['general', 'dental', 'dermatology', 'ophthalmology', 'pediatric', 'veterinary'] },
      specialty: { en: 'Specialties', ru: 'Специализации', type: 'array' },
      consultation_price: { en: 'Consultation Price', ru: 'Цена консультации', type: 'number' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      email: { en: 'Email', ru: 'Email', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      languages: { en: 'Languages', ru: 'Языки', type: 'array' },
      is_24h: { en: '24 Hours', ru: 'Круглосуточно', type: 'boolean' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🏋️ Gyms
  {
    id: 'gyms',
    table: 'gyms',
    nameEn: 'Fitness',
    nameRu: 'Фитнес',
    icon: '🏋️',
    keywords: ['gym', 'зал', 'fitness', 'фитнес', 'workout', 'тренировка', 'crossfit', 'кроссфит', 'yoga', 'йога', 'pilates', 'пилатес', 'sport', 'спорт'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'gym_type', 'price_per_day', 'price_per_month', 'amenities', 'address', 'district', 'phone', 'working_hours', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      gym_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['gym', 'crossfit', 'yoga', 'pilates', 'martial_arts', 'swimming'] },
      price_per_day: { en: 'Day Pass', ru: 'Дневной абонемент', type: 'number' },
      price_per_month: { en: 'Monthly', ru: 'Месячный', type: 'number' },
      amenities: { en: 'Amenities', ru: 'Удобства', type: 'array' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🚗 Vehicles
  {
    id: 'vehicles',
    table: 'vehicles',
    nameEn: 'Transport',
    nameRu: 'Транспорт',
    icon: '🚗',
    keywords: ['car', 'машина', 'авто', 'auto', 'motorbike', 'мотобайк', 'scooter', 'скутер', 'bike', 'велосипед', 'rental', 'прокат', 'vehicle', 'транспорт'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'vehicle_type', 'brand', 'model', 'year', 'price_per_day', 'deposit', 'features', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      vehicle_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['car', 'motorbike', 'scooter', 'bicycle', 'atv'] },
      brand: { en: 'Brand', ru: 'Марка', type: 'string' },
      model: { en: 'Model', ru: 'Модель', type: 'string' },
      year: { en: 'Year', ru: 'Год', type: 'number' },
      price_per_day: { en: 'Price/Day', ru: 'Цена/день', type: 'number' },
      deposit: { en: 'Deposit', ru: 'Депозит', type: 'number' },
      features: { en: 'Features', ru: 'Особенности', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🎉 Events
  {
    id: 'events',
    table: 'events',
    nameEn: 'Events',
    nameRu: 'События',
    icon: '🎉',
    keywords: ['event', 'событие', 'party', 'вечеринка', 'concert', 'концерт', 'festival', 'фестиваль', 'show', 'шоу', 'exhibition', 'выставка', 'performance', 'представление'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'event_type', 'event_date', 'start_time', 'end_time', 'venue', 'address', 'price', 'price_from', 'price_to', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      event_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['party', 'concert', 'festival', 'exhibition', 'sports', 'workshop'] },
      event_date: { en: 'Date', ru: 'Дата', type: 'date' },
      start_time: { en: 'Start Time', ru: 'Начало', type: 'string' },
      end_time: { en: 'End Time', ru: 'Окончание', type: 'string' },
      venue: { en: 'Venue', ru: 'Площадка', type: 'string' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      price: { en: 'Price', ru: 'Цена', type: 'number' },
      price_from: { en: 'Price From', ru: 'Цена от', type: 'number' },
      price_to: { en: 'Price To', ru: 'Цена до', type: 'number' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 👶 Babysitters
  {
    id: 'babysitters',
    table: 'babysitters',
    nameEn: 'Babysitters',
    nameRu: 'Няни',
    icon: '👶',
    keywords: ['babysitter', 'няня', 'nanny', 'childcare', 'присмотр за детьми', 'baby', 'ребёнок', 'children', 'дети'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'bio_en', 'bio_ru', 'experience_years', 'age_groups', 'languages', 'price_per_hour', 'price_per_day', 'certifications', 'first_aid_certified', 'can_drive', 'can_cook', 'photo', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Имя (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Имя (RU)', type: 'string' },
      bio_en: { en: 'Bio (EN)', ru: 'О себе (EN)', type: 'string' },
      bio_ru: { en: 'Bio (RU)', ru: 'О себе (RU)', type: 'string' },
      experience_years: { en: 'Experience (years)', ru: 'Опыт (лет)', type: 'number' },
      age_groups: { en: 'Age Groups', ru: 'Возрастные группы', type: 'array' },
      languages: { en: 'Languages', ru: 'Языки', type: 'array' },
      price_per_hour: { en: 'Price/Hour', ru: 'Цена/час', type: 'number' },
      price_per_day: { en: 'Price/Day', ru: 'Цена/день', type: 'number' },
      certifications: { en: 'Certifications', ru: 'Сертификаты', type: 'array' },
      first_aid_certified: { en: 'First Aid', ru: 'Первая помощь', type: 'boolean' },
      can_drive: { en: 'Can Drive', ru: 'Есть права', type: 'boolean' },
      can_cook: { en: 'Can Cook', ru: 'Готовит', type: 'boolean' },
      photo: { en: 'Photo', ru: 'Фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🧹 Cleaning Services
  {
    id: 'cleaning_services',
    table: 'cleaning_services',
    nameEn: 'Cleaning',
    nameRu: 'Уборка',
    icon: '🧹',
    keywords: ['cleaning', 'уборка', 'maid', 'горничная', 'housekeeping', 'клининг', 'deep clean', 'генеральная уборка'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'service_type', 'price_per_hour', 'price_fixed', 'duration_hours', 'areas_served', 'features', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      service_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['regular', 'deep', 'move_in', 'move_out', 'post_construction'] },
      price_per_hour: { en: 'Price/Hour', ru: 'Цена/час', type: 'number' },
      price_fixed: { en: 'Fixed Price', ru: 'Фикс. цена', type: 'number' },
      duration_hours: { en: 'Duration (hours)', ru: 'Длительность (часы)', type: 'number' },
      areas_served: { en: 'Areas Served', ru: 'Районы', type: 'array' },
      features: { en: 'Features', ru: 'Особенности', type: 'array' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // ⚖️ Legal Services
  {
    id: 'legal_services',
    table: 'legal_services',
    nameEn: 'Legal Services',
    nameRu: 'Юридические услуги',
    icon: '⚖️',
    keywords: ['lawyer', 'юрист', 'адвокат', 'legal', 'юридический', 'visa', 'виза', 'immigration', 'иммиграция', 'notary', 'нотариус', 'contract', 'договор'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'service_type', 'specialization', 'price_from', 'consultation_price', 'languages', 'address', 'phone', 'email', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      service_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['visa', 'immigration', 'business', 'real_estate', 'criminal', 'family'] },
      specialization: { en: 'Specialization', ru: 'Специализация', type: 'array' },
      price_from: { en: 'Price From', ru: 'Цена от', type: 'number' },
      consultation_price: { en: 'Consultation', ru: 'Консультация', type: 'number' },
      languages: { en: 'Languages', ru: 'Языки', type: 'array' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      email: { en: 'Email', ru: 'Email', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🐕 Pet Services
  {
    id: 'pet_services',
    table: 'pet_services',
    nameEn: 'Pet Services',
    nameRu: 'Услуги для питомцев',
    icon: '🐕',
    keywords: ['pet', 'питомец', 'dog', 'собака', 'cat', 'кошка', 'vet', 'ветеринар', 'grooming', 'груминг', 'pet sitting', 'передержка', 'walking', 'выгул'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'service_type', 'pet_types', 'price_per_visit', 'price_per_day', 'address', 'phone', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      service_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['veterinary', 'grooming', 'sitting', 'walking', 'training', 'boarding'] },
      pet_types: { en: 'Pet Types', ru: 'Типы питомцев', type: 'array' },
      price_per_visit: { en: 'Price/Visit', ru: 'Цена/визит', type: 'number' },
      price_per_day: { en: 'Price/Day', ru: 'Цена/день', type: 'number' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🎓 Education
  {
    id: 'education_providers',
    table: 'education_providers',
    nameEn: 'Education',
    nameRu: 'Образование',
    icon: '🎓',
    keywords: ['school', 'школа', 'education', 'образование', 'course', 'курс', 'tutor', 'репетитор', 'language', 'язык', 'training', 'обучение', 'lesson', 'урок'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'education_type', 'subjects', 'age_groups', 'price_per_lesson', 'price_per_month', 'languages', 'address', 'phone', 'website', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      education_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['language', 'academic', 'professional', 'arts', 'sports', 'music'] },
      subjects: { en: 'Subjects', ru: 'Предметы', type: 'array' },
      age_groups: { en: 'Age Groups', ru: 'Возрастные группы', type: 'array' },
      price_per_lesson: { en: 'Price/Lesson', ru: 'Цена/урок', type: 'number' },
      price_per_month: { en: 'Price/Month', ru: 'Цена/месяц', type: 'number' },
      languages: { en: 'Languages', ru: 'Языки', type: 'array' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 💊 Pharmacies
  {
    id: 'pharmacies',
    table: 'pharmacies',
    nameEn: 'Pharmacies',
    nameRu: 'Аптеки',
    icon: '💊',
    keywords: ['pharmacy', 'аптека', 'medicine', 'лекарство', 'drug', 'препарат', 'drugstore', 'medical supplies', 'медикаменты'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'is_24h', 'has_delivery', 'address', 'district', 'phone', 'working_hours', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      is_24h: { en: '24 Hours', ru: 'Круглосуточно', type: 'boolean' },
      has_delivery: { en: 'Delivery', ru: 'Доставка', type: 'boolean' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🛡️ Insurance
  {
    id: 'insurance_providers',
    table: 'insurance_providers',
    nameEn: 'Insurance',
    nameRu: 'Страхование',
    icon: '🛡️',
    keywords: ['insurance', 'страховка', 'страхование', 'policy', 'полис', 'health insurance', 'медстраховка', 'travel insurance', 'туристическая страховка'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'insurance_types', 'price_from', 'languages', 'address', 'phone', 'email', 'website', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      insurance_types: { en: 'Types', ru: 'Типы', type: 'array' },
      price_from: { en: 'Price From', ru: 'Цена от', type: 'number' },
      languages: { en: 'Languages', ru: 'Языки', type: 'array' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      email: { en: 'Email', ru: 'Email', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 💐 Flower Shops
  {
    id: 'flower_shops',
    table: 'flower_shops',
    nameEn: 'Flower Shops',
    nameRu: 'Цветочные магазины',
    icon: '💐',
    keywords: ['flowers', 'цветы', 'bouquet', 'букет', 'florist', 'флорист', 'roses', 'розы', 'delivery', 'доставка цветов'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'has_delivery', 'delivery_areas', 'price_from', 'address', 'district', 'phone', 'working_hours', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      has_delivery: { en: 'Delivery', ru: 'Доставка', type: 'boolean' },
      delivery_areas: { en: 'Delivery Areas', ru: 'Зоны доставки', type: 'array' },
      price_from: { en: 'Price From', ru: 'Цена от', type: 'number' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 🏪 Stores
  {
    id: 'stores',
    table: 'stores',
    nameEn: 'Stores',
    nameRu: 'Магазины',
    icon: '🏪',
    keywords: ['store', 'магазин', 'shop', 'shopping', 'retail', 'розница', 'supermarket', 'супермаркет', 'grocery', 'продукты'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'store_type', 'categories', 'has_delivery', 'address', 'district', 'phone', 'working_hours', 'cover_image', 'images', 'lat', 'lng'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      store_type: { en: 'Type', ru: 'Тип', type: 'string', enumValues: ['grocery', 'electronics', 'clothing', 'furniture', 'hardware', 'other'] },
      categories: { en: 'Categories', ru: 'Категории', type: 'array' },
      has_delivery: { en: 'Delivery', ru: 'Доставка', type: 'boolean' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
    }
  },

  // 👔 Providers (Generic)
  {
    id: 'providers',
    table: 'providers',
    nameEn: 'Service Providers',
    nameRu: 'Провайдеры услуг',
    icon: '👔',
    keywords: ['provider', 'провайдер', 'company', 'компания', 'service', 'услуга', 'business', 'бизнес'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'provider_type', 'services', 'address', 'phone', 'email', 'website', 'working_hours', 'logo', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      provider_type: { en: 'Type', ru: 'Тип', type: 'string' },
      services: { en: 'Services', ru: 'Услуги', type: 'array' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      email: { en: 'Email', ru: 'Email', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      logo: { en: 'Logo', ru: 'Логотип', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 📦 Marketplace Products
  {
    id: 'marketplace_products',
    table: 'marketplace_products',
    nameEn: 'Products',
    nameRu: 'Товары',
    icon: '📦',
    keywords: ['product', 'товар', 'item', 'вещь', 'goods', 'buy', 'купить', 'sell', 'продать'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'price', 'category', 'condition', 'brand', 'stock_quantity', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      price: { en: 'Price', ru: 'Цена', type: 'number' },
      category: { en: 'Category', ru: 'Категория', type: 'string' },
      condition: { en: 'Condition', ru: 'Состояние', type: 'string', enumValues: ['new', 'like_new', 'good', 'fair'] },
      brand: { en: 'Brand', ru: 'Бренд', type: 'string' },
      stock_quantity: { en: 'Stock', ru: 'В наличии', type: 'number' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 🛒 Marketplace Vendors
  {
    id: 'marketplace_vendors',
    table: 'marketplace_vendors',
    nameEn: 'Vendors',
    nameRu: 'Продавцы',
    icon: '🛒',
    keywords: ['vendor', 'продавец', 'seller', 'merchant', 'торговец', 'shop', 'магазин'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'vendor_type', 'address', 'phone', 'email', 'website', 'logo', 'cover_image', 'images'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)', type: 'string' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)', type: 'string' },
      vendor_type: { en: 'Type', ru: 'Тип', type: 'string' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      email: { en: 'Email', ru: 'Email', type: 'string' },
      website: { en: 'Website', ru: 'Сайт', type: 'string' },
      logo: { en: 'Logo', ru: 'Логотип', type: 'string' },
      cover_image: { en: 'Cover Image', ru: 'Главное фото', type: 'string' },
      images: { en: 'Gallery', ru: 'Галерея', type: 'array' },
    }
  },

  // 📍 Vendor Locations
  {
    id: 'vendor_locations',
    table: 'vendor_locations',
    nameEn: 'Locations',
    nameRu: 'Локации',
    icon: '📍',
    keywords: ['location', 'локация', 'branch', 'филиал', 'office', 'офис', 'outlet', 'точка'],
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'address', 'district', 'phone', 'working_hours', 'lat', 'lng', 'is_main'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)', type: 'string' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)', type: 'string' },
      address: { en: 'Address', ru: 'Адрес', type: 'string' },
      district: { en: 'District', ru: 'Район', type: 'string' },
      phone: { en: 'Phone', ru: 'Телефон', type: 'string' },
      working_hours: { en: 'Working Hours', ru: 'Часы работы', type: 'json' },
      lat: { en: 'Latitude', ru: 'Широта', type: 'number' },
      lng: { en: 'Longitude', ru: 'Долгота', type: 'number' },
      is_main: { en: 'Main Location', ru: 'Главная локация', type: 'boolean' },
    }
  },
];

/**
 * Get vertical config by ID
 */
export function getVerticalById(id: string): VerticalConfig | undefined {
  return INTAKE_VERTICALS.find(v => v.id === id);
}

/**
 * Get vertical config by table name
 */
export function getVerticalByTable(table: string): VerticalConfig | undefined {
  return INTAKE_VERTICALS.find(v => v.table === table);
}

/**
 * Build AI prompt for vertical detection
 */
export function buildVerticalDetectionPrompt(): string {
  return INTAKE_VERTICALS.map(v => `- ${v.id}: ${v.keywords.slice(0, 5).join(', ')}`).join('\n');
}

/**
 * Get all vertical IDs for quick lookup
 */
export const VERTICAL_IDS = INTAKE_VERTICALS.map(v => v.id);

/**
 * Get all table names for quick lookup
 */
export const VERTICAL_TABLES = INTAKE_VERTICALS.map(v => v.table);
