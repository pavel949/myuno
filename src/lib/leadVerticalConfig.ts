/**
 * Lead Vertical Configuration
 * Defines form fields and request types per vertical for the Universal Lead Form
 */

import { INTAKE_VERTICALS, VerticalConfig } from './intakeVerticals';

export type LeadSource = 'fab' | 'cta' | 'chat' | 'external' | 'organic';

export interface LeadFormField {
  key: string;
  type: 'text' | 'number' | 'date' | 'daterange' | 'select' | 'multiselect' | 'guests' | 'textarea' | 'budget';
  labelEn: string;
  labelRu: string;
  placeholderEn?: string;
  placeholderRu?: string;
  required?: boolean;
  options?: { value: string; labelEn: string; labelRu: string }[];
  min?: number;
  max?: number;
}

export interface LeadVerticalConfig {
  id: string;
  icon: string;
  nameEn: string;
  nameRu: string;
  shortDescEn: string;
  shortDescRu: string;
  requestTypes: { value: string; labelEn: string; labelRu: string }[];
  fields: LeadFormField[];
  ctaTextEn: string;
  ctaTextRu: string;
  popularityScore: number; // For sorting in FAB
}

// Common fields used across multiple verticals
const COMMON_FIELDS = {
  dates: {
    key: 'dates',
    type: 'daterange' as const,
    labelEn: 'Dates',
    labelRu: 'Даты',
    required: true,
  },
  guests: {
    key: 'guests',
    type: 'guests' as const,
    labelEn: 'Guests',
    labelRu: 'Гости',
    required: true,
  },
  budget: {
    key: 'budget',
    type: 'budget' as const,
    labelEn: 'Budget',
    labelRu: 'Бюджет',
    required: false,
  },
  notes: {
    key: 'notes',
    type: 'textarea' as const,
    labelEn: 'Additional wishes',
    labelRu: 'Дополнительные пожелания',
    placeholderEn: 'Tell us about your preferences...',
    placeholderRu: 'Расскажите о ваших пожеланиях...',
    required: false,
  },
};

import { PHUKET_DISTRICTS as TAXONOMY_DISTRICTS } from './propertyTaxonomy';

// Map taxonomy to lead form options
const PHUKET_DISTRICTS = TAXONOMY_DISTRICTS.map(d => ({
  value: d.id,
  labelEn: d.labelEn,
  labelRu: d.labelRu,
}));

export const LEAD_VERTICALS: LeadVerticalConfig[] = [
  // 🏠 Properties - Most popular
  {
    id: 'properties',
    icon: '🏠',
    nameEn: 'Property',
    nameRu: 'Недвижимость',
    shortDescEn: 'Rent or buy property',
    shortDescRu: 'Аренда или покупка',
    ctaTextEn: 'Find Property',
    ctaTextRu: 'Найти жильё',
    popularityScore: 100,
    requestTypes: [
      { value: 'vacation_rental', labelEn: 'Vacation Rental', labelRu: 'Аренда на отпуск' },
      { value: 'long_term_rental', labelEn: 'Long-term Rental', labelRu: 'Долгосрочная аренда' },
      { value: 'property_purchase', labelEn: 'Purchase', labelRu: 'Покупка' },
      { value: 'property_tour', labelEn: 'Property Tour', labelRu: 'Тур по объектам' },
      { value: 'investment_advice', labelEn: 'Investment Advice', labelRu: 'Инвестиции' },
    ],
    fields: [
      COMMON_FIELDS.dates,
      COMMON_FIELDS.guests,
      {
        key: 'property_type',
        type: 'multiselect',
        labelEn: 'Property Type',
        labelRu: 'Тип недвижимости',
        options: [
          { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
          { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
          { value: 'apartment', labelEn: 'Apartment', labelRu: 'Апартаменты' },
          { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
        ],
      },
      {
        key: 'districts',
        type: 'multiselect',
        labelEn: 'Preferred Areas',
        labelRu: 'Предпочтительные районы',
        options: PHUKET_DISTRICTS,
      },
      COMMON_FIELDS.budget,
      COMMON_FIELDS.notes,
    ],
  },

  // 🚤 Yachts
  {
    id: 'yachts',
    icon: '🚤',
    nameEn: 'Yachts',
    nameRu: 'Яхты',
    shortDescEn: 'Charter a yacht',
    shortDescRu: 'Арендовать яхту',
    ctaTextEn: 'Charter Yacht',
    ctaTextRu: 'Арендовать яхту',
    popularityScore: 90,
    requestTypes: [
      { value: 'yacht_charter', labelEn: 'Day Charter', labelRu: 'Дневной чартер' },
      { value: 'yacht_multiday', labelEn: 'Multi-day Charter', labelRu: 'Многодневный чартер' },
      { value: 'yacht_party', labelEn: 'Yacht Party', labelRu: 'Вечеринка на яхте' },
      { value: 'yacht_purchase', labelEn: 'Purchase Yacht', labelRu: 'Покупка яхты' },
    ],
    fields: [
      {
        key: 'charter_date',
        type: 'date',
        labelEn: 'Charter Date',
        labelRu: 'Дата аренды',
        required: true,
      },
      {
        key: 'duration',
        type: 'select',
        labelEn: 'Duration',
        labelRu: 'Продолжительность',
        options: [
          { value: 'half_day', labelEn: 'Half Day (4h)', labelRu: 'Полдня (4ч)' },
          { value: 'full_day', labelEn: 'Full Day (8h)', labelRu: 'Целый день (8ч)' },
          { value: 'sunset', labelEn: 'Sunset Cruise (3h)', labelRu: 'Закатный круиз (3ч)' },
          { value: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой' },
          { value: 'multiday', labelEn: 'Multi-day', labelRu: 'Несколько дней' },
        ],
        required: true,
      },
      COMMON_FIELDS.guests,
      {
        key: 'yacht_type',
        type: 'select',
        labelEn: 'Yacht Type',
        labelRu: 'Тип яхты',
        options: [
          { value: 'any', labelEn: 'Any', labelRu: 'Любой' },
          { value: 'motor', labelEn: 'Motor Yacht', labelRu: 'Моторная яхта' },
          { value: 'sailing', labelEn: 'Sailing Yacht', labelRu: 'Парусная яхта' },
          { value: 'catamaran', labelEn: 'Catamaran', labelRu: 'Катамаран' },
          { value: 'speedboat', labelEn: 'Speedboat', labelRu: 'Спидбот' },
        ],
      },
      COMMON_FIELDS.budget,
      COMMON_FIELDS.notes,
    ],
  },

  // 🗺️ Tours
  {
    id: 'tours',
    icon: '🗺️',
    nameEn: 'Tours',
    nameRu: 'Туры',
    shortDescEn: 'Book an excursion',
    shortDescRu: 'Забронировать экскурсию',
    ctaTextEn: 'Book Tour',
    ctaTextRu: 'Забронировать тур',
    popularityScore: 85,
    requestTypes: [
      { value: 'island_tour', labelEn: 'Island Tour', labelRu: 'Островной тур' },
      { value: 'city_tour', labelEn: 'City Tour', labelRu: 'Обзорная экскурсия' },
      { value: 'adventure_tour', labelEn: 'Adventure', labelRu: 'Приключения' },
      { value: 'custom_tour', labelEn: 'Custom Tour', labelRu: 'Индивидуальный тур' },
    ],
    fields: [
      {
        key: 'tour_date',
        type: 'date',
        labelEn: 'Tour Date',
        labelRu: 'Дата тура',
        required: true,
      },
      COMMON_FIELDS.guests,
      {
        key: 'tour_type',
        type: 'select',
        labelEn: 'Tour Type',
        labelRu: 'Тип тура',
        options: [
          { value: 'phi_phi', labelEn: 'Phi Phi Islands', labelRu: 'Острова Пхи-Пхи' },
          { value: 'james_bond', labelEn: 'James Bond Island', labelRu: 'Остров Джеймса Бонда' },
          { value: 'similan', labelEn: 'Similan Islands', labelRu: 'Симиланские острова' },
          { value: 'racha', labelEn: 'Racha Islands', labelRu: 'Острова Рача' },
          { value: 'city', labelEn: 'Phuket City Tour', labelRu: 'Обзорный тур по Пхукету' },
          { value: 'other', labelEn: 'Other', labelRu: 'Другой' },
        ],
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 🚗 Transport
  {
    id: 'vehicles',
    icon: '🚗',
    nameEn: 'Transport',
    nameRu: 'Транспорт',
    shortDescEn: 'Rent a car or bike',
    shortDescRu: 'Аренда авто или байка',
    ctaTextEn: 'Rent Vehicle',
    ctaTextRu: 'Арендовать транспорт',
    popularityScore: 80,
    requestTypes: [
      { value: 'car_rental', labelEn: 'Car Rental', labelRu: 'Аренда автомобиля' },
      { value: 'bike_rental', labelEn: 'Motorbike Rental', labelRu: 'Аренда мотобайка' },
      { value: 'driver_service', labelEn: 'Driver Service', labelRu: 'Водитель с авто' },
      { value: 'airport_transfer', labelEn: 'Airport Transfer', labelRu: 'Трансфер из аэропорта' },
    ],
    fields: [
      COMMON_FIELDS.dates,
      {
        key: 'vehicle_type',
        type: 'select',
        labelEn: 'Vehicle Type',
        labelRu: 'Тип транспорта',
        options: [
          { value: 'car', labelEn: 'Car', labelRu: 'Автомобиль' },
          { value: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник' },
          { value: 'motorbike', labelEn: 'Motorbike', labelRu: 'Мотобайк' },
          { value: 'scooter', labelEn: 'Scooter', labelRu: 'Скутер' },
        ],
        required: true,
      },
      {
        key: 'pickup_location',
        type: 'text',
        labelEn: 'Pickup Location',
        labelRu: 'Место получения',
        placeholderEn: 'Hotel name or address',
        placeholderRu: 'Название отеля или адрес',
      },
      COMMON_FIELDS.notes,
    ],
  },

  // ⚖️ Legal
  {
    id: 'legal',
    icon: '⚖️',
    nameEn: 'Legal',
    nameRu: 'Юридические услуги',
    shortDescEn: 'Legal consultation',
    shortDescRu: 'Юридическая консультация',
    ctaTextEn: 'Get Consultation',
    ctaTextRu: 'Получить консультацию',
    popularityScore: 60,
    requestTypes: [
      { value: 'visa_consultation', labelEn: 'Visa & Immigration', labelRu: 'Виза и иммиграция' },
      { value: 'property_legal', labelEn: 'Property Legal', labelRu: 'Недвижимость' },
      { value: 'business_legal', labelEn: 'Business Setup', labelRu: 'Открытие бизнеса' },
      { value: 'general_legal', labelEn: 'General Consultation', labelRu: 'Общая консультация' },
    ],
    fields: [
      {
        key: 'legal_topic',
        type: 'select',
        labelEn: 'Topic',
        labelRu: 'Тема консультации',
        options: [
          { value: 'visa', labelEn: 'Visa Extension', labelRu: 'Продление визы' },
          { value: 'elite_visa', labelEn: 'Thailand Elite Visa', labelRu: 'Thailand Elite виза' },
          { value: 'work_permit', labelEn: 'Work Permit', labelRu: 'Разрешение на работу' },
          { value: 'company', labelEn: 'Company Registration', labelRu: 'Регистрация компании' },
          { value: 'property', labelEn: 'Property Purchase', labelRu: 'Покупка недвижимости' },
          { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
        ],
        required: true,
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 🏥 Medical
  {
    id: 'clinics',
    icon: '🏥',
    nameEn: 'Medical',
    nameRu: 'Медицина',
    shortDescEn: 'Find a doctor',
    shortDescRu: 'Найти врача',
    ctaTextEn: 'Find Doctor',
    ctaTextRu: 'Найти врача',
    popularityScore: 55,
    requestTypes: [
      { value: 'doctor_appointment', labelEn: 'Doctor Appointment', labelRu: 'Запись к врачу' },
      { value: 'dental', labelEn: 'Dental', labelRu: 'Стоматология' },
      { value: 'health_checkup', labelEn: 'Health Checkup', labelRu: 'Чек-ап' },
      { value: 'emergency', labelEn: 'Emergency Help', labelRu: 'Срочная помощь' },
    ],
    fields: [
      {
        key: 'medical_type',
        type: 'select',
        labelEn: 'Service Type',
        labelRu: 'Тип услуги',
        options: [
          { value: 'general', labelEn: 'General Doctor', labelRu: 'Терапевт' },
          { value: 'dental', labelEn: 'Dentist', labelRu: 'Стоматолог' },
          { value: 'dermatology', labelEn: 'Dermatologist', labelRu: 'Дерматолог' },
          { value: 'pediatric', labelEn: 'Pediatrician', labelRu: 'Педиатр' },
          { value: 'checkup', labelEn: 'Full Checkup', labelRu: 'Полный чек-ап' },
          { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
        ],
        required: true,
      },
      {
        key: 'preferred_date',
        type: 'date',
        labelEn: 'Preferred Date',
        labelRu: 'Предпочтительная дата',
      },
      {
        key: 'language_preference',
        type: 'select',
        labelEn: 'Doctor Language',
        labelRu: 'Язык врача',
        options: [
          { value: 'any', labelEn: 'Any', labelRu: 'Любой' },
          { value: 'english', labelEn: 'English', labelRu: 'Английский' },
          { value: 'russian', labelEn: 'Russian', labelRu: 'Русский' },
          { value: 'thai', labelEn: 'Thai', labelRu: 'Тайский' },
        ],
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 👶 Babysitters
  {
    id: 'babysitters',
    icon: '👶',
    nameEn: 'Babysitters',
    nameRu: 'Няни',
    shortDescEn: 'Find a babysitter',
    shortDescRu: 'Найти няню',
    ctaTextEn: 'Find Babysitter',
    ctaTextRu: 'Найти няню',
    popularityScore: 50,
    requestTypes: [
      { value: 'babysitter_hourly', labelEn: 'Hourly Babysitting', labelRu: 'Почасовая няня' },
      { value: 'babysitter_daily', labelEn: 'Full Day', labelRu: 'На весь день' },
      { value: 'nanny_longterm', labelEn: 'Long-term Nanny', labelRu: 'Няня на длительный срок' },
    ],
    fields: [
      {
        key: 'children_ages',
        type: 'text',
        labelEn: 'Children Ages',
        labelRu: 'Возраст детей',
        placeholderEn: 'e.g., 2 and 5 years old',
        placeholderRu: 'Напр., 2 и 5 лет',
        required: true,
      },
      COMMON_FIELDS.dates,
      {
        key: 'language_preference',
        type: 'select',
        labelEn: 'Language',
        labelRu: 'Язык няни',
        options: [
          { value: 'any', labelEn: 'Any', labelRu: 'Любой' },
          { value: 'english', labelEn: 'English', labelRu: 'Английский' },
          { value: 'russian', labelEn: 'Russian', labelRu: 'Русский' },
          { value: 'thai', labelEn: 'Thai', labelRu: 'Тайский' },
        ],
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 💇 Beauty & Spa
  {
    id: 'salons',
    icon: '💇',
    nameEn: 'Beauty & Spa',
    nameRu: 'Красота и Spa',
    shortDescEn: 'Book beauty services',
    shortDescRu: 'Записаться на услуги',
    ctaTextEn: 'Book Service',
    ctaTextRu: 'Записаться',
    popularityScore: 45,
    requestTypes: [
      { value: 'spa_booking', labelEn: 'Spa & Massage', labelRu: 'Спа и массаж' },
      { value: 'hair_salon', labelEn: 'Hair Salon', labelRu: 'Парикмахерская' },
      { value: 'nail_salon', labelEn: 'Nail Salon', labelRu: 'Маникюр/Педикюр' },
      { value: 'beauty_service', labelEn: 'Beauty Service', labelRu: 'Бьюти-услуги' },
    ],
    fields: [
      {
        key: 'service_type',
        type: 'select',
        labelEn: 'Service',
        labelRu: 'Услуга',
        options: [
          { value: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
          { value: 'spa', labelEn: 'Spa Package', labelRu: 'Спа-программа' },
          { value: 'hair', labelEn: 'Haircut/Styling', labelRu: 'Стрижка/Укладка' },
          { value: 'nails', labelEn: 'Manicure/Pedicure', labelRu: 'Маникюр/Педикюр' },
          { value: 'facial', labelEn: 'Facial', labelRu: 'Уход за лицом' },
          { value: 'other', labelEn: 'Other', labelRu: 'Другое' },
        ],
        required: true,
      },
      {
        key: 'preferred_date',
        type: 'date',
        labelEn: 'Preferred Date',
        labelRu: 'Предпочтительная дата',
      },
      {
        key: 'district',
        type: 'select',
        labelEn: 'Preferred Area',
        labelRu: 'Предпочтительный район',
        options: PHUKET_DISTRICTS,
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 🏋️ Fitness
  {
    id: 'gyms',
    icon: '🏋️',
    nameEn: 'Fitness',
    nameRu: 'Фитнес',
    shortDescEn: 'Find a gym or trainer',
    shortDescRu: 'Найти зал или тренера',
    ctaTextEn: 'Find Gym',
    ctaTextRu: 'Найти зал',
    popularityScore: 40,
    requestTypes: [
      { value: 'gym_daypass', labelEn: 'Day Pass', labelRu: 'Дневной абонемент' },
      { value: 'gym_membership', labelEn: 'Membership', labelRu: 'Абонемент' },
      { value: 'personal_trainer', labelEn: 'Personal Trainer', labelRu: 'Персональный тренер' },
      { value: 'yoga_class', labelEn: 'Yoga/Pilates', labelRu: 'Йога/Пилатес' },
    ],
    fields: [
      {
        key: 'fitness_type',
        type: 'select',
        labelEn: 'Activity Type',
        labelRu: 'Тип активности',
        options: [
          { value: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал' },
          { value: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
          { value: 'yoga', labelEn: 'Yoga', labelRu: 'Йога' },
          { value: 'muay_thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
          { value: 'swimming', labelEn: 'Swimming', labelRu: 'Плавание' },
        ],
        required: true,
      },
      {
        key: 'district',
        type: 'select',
        labelEn: 'Preferred Area',
        labelRu: 'Предпочтительный район',
        options: PHUKET_DISTRICTS,
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 🌊 Water Activities
  {
    id: 'water_activities',
    icon: '🏄',
    nameEn: 'Water Sports',
    nameRu: 'Водный спорт',
    shortDescEn: 'Book water activities',
    shortDescRu: 'Забронировать активности',
    ctaTextEn: 'Book Activity',
    ctaTextRu: 'Забронировать',
    popularityScore: 70,
    requestTypes: [
      { value: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг' },
      { value: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Сноркелинг' },
      { value: 'jet_ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл' },
      { value: 'surfing', labelEn: 'Surfing', labelRu: 'Сёрфинг' },
    ],
    fields: [
      {
        key: 'activity_date',
        type: 'date',
        labelEn: 'Date',
        labelRu: 'Дата',
        required: true,
      },
      COMMON_FIELDS.guests,
      {
        key: 'activity_type',
        type: 'select',
        labelEn: 'Activity',
        labelRu: 'Активность',
        options: [
          { value: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг' },
          { value: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Сноркелинг' },
          { value: 'jet_ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл' },
          { value: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг' },
          { value: 'surfing', labelEn: 'Surfing', labelRu: 'Сёрфинг' },
          { value: 'kayak', labelEn: 'Kayaking', labelRu: 'Каякинг' },
        ],
        required: true,
      },
      {
        key: 'experience_level',
        type: 'select',
        labelEn: 'Experience',
        labelRu: 'Опыт',
        options: [
          { value: 'beginner', labelEn: 'Beginner', labelRu: 'Новичок' },
          { value: 'intermediate', labelEn: 'Intermediate', labelRu: 'Средний' },
          { value: 'advanced', labelEn: 'Advanced', labelRu: 'Продвинутый' },
        ],
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 🍽️ Restaurants
  {
    id: 'restaurants',
    icon: '🍽️',
    nameEn: 'Restaurants',
    nameRu: 'Рестораны',
    shortDescEn: 'Book a table',
    shortDescRu: 'Забронировать столик',
    ctaTextEn: 'Book Table',
    ctaTextRu: 'Забронировать',
    popularityScore: 35,
    requestTypes: [
      { value: 'table_booking', labelEn: 'Table Reservation', labelRu: 'Бронь столика' },
      { value: 'private_event', labelEn: 'Private Event', labelRu: 'Частное мероприятие' },
      { value: 'restaurant_recommendation', labelEn: 'Recommendations', labelRu: 'Рекомендации' },
    ],
    fields: [
      {
        key: 'reservation_date',
        type: 'date',
        labelEn: 'Date',
        labelRu: 'Дата',
        required: true,
      },
      COMMON_FIELDS.guests,
      {
        key: 'cuisine',
        type: 'select',
        labelEn: 'Cuisine',
        labelRu: 'Кухня',
        options: [
          { value: 'any', labelEn: 'Any', labelRu: 'Любая' },
          { value: 'thai', labelEn: 'Thai', labelRu: 'Тайская' },
          { value: 'italian', labelEn: 'Italian', labelRu: 'Итальянская' },
          { value: 'japanese', labelEn: 'Japanese', labelRu: 'Японская' },
          { value: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты' },
          { value: 'international', labelEn: 'International', labelRu: 'Международная' },
        ],
      },
      COMMON_FIELDS.notes,
    ],
  },

  // 📦 Other / General
  {
    id: 'other',
    icon: '💬',
    nameEn: 'Other',
    nameRu: 'Другое',
    shortDescEn: 'General inquiry',
    shortDescRu: 'Общий вопрос',
    ctaTextEn: 'Send Request',
    ctaTextRu: 'Отправить запрос',
    popularityScore: 10,
    requestTypes: [
      { value: 'general_inquiry', labelEn: 'General Inquiry', labelRu: 'Общий вопрос' },
    ],
    fields: [
      {
        key: 'inquiry_topic',
        type: 'text',
        labelEn: 'What do you need help with?',
        labelRu: 'С чем вам нужна помощь?',
        placeholderEn: 'Describe your request...',
        placeholderRu: 'Опишите ваш запрос...',
        required: true,
      },
      COMMON_FIELDS.notes,
    ],
  },
];

// Helper functions
export function getLeadVerticalById(id: string): LeadVerticalConfig | undefined {
  return LEAD_VERTICALS.find(v => v.id === id);
}

export function getLeadVerticalsSorted(): LeadVerticalConfig[] {
  return [...LEAD_VERTICALS].sort((a, b) => b.popularityScore - a.popularityScore);
}

export function detectVerticalFromPath(pathname: string): string | null {
  const pathMappings: Record<string, string> = {
    '/property': 'properties',
    '/properties': 'properties',
    '/yachts': 'yachts',
    '/tours': 'tours',
    '/transport': 'vehicles',
    '/vehicles': 'vehicles',
    '/legal': 'legal',
    '/clinics': 'clinics',
    '/medical': 'clinics',
    '/babysitter': 'babysitters',
    '/beauty': 'salons',
    '/salons': 'salons',
    '/gyms': 'gyms',
    '/fitness': 'gyms',
    '/water-activities': 'water_activities',
    '/restaurants': 'restaurants',
  };

  for (const [path, vertical] of Object.entries(pathMappings)) {
    if (pathname.startsWith(path)) {
      return vertical;
    }
  }

  return null;
}
