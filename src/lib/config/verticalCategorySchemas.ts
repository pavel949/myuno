/**
 * Vertical Category Schemas - Comprehensive schemas for CanonicalListingWizard
 * 
 * Maps each vertical to a CategoryNode tree with field schemas,
 * pricing models, availability types, and media requirements.
 * 
 * Uses existing taxonomies as source of truth for category IDs.
 */
import { CategoryNode } from '@/components/vendor/wizard';

// ==================== YACHT CATEGORIES ====================
export const YACHT_CATEGORIES: CategoryNode[] = [
  {
    id: 'yacht_charter',
    name_en: 'Yacht Charter',
    name_ru: 'Яхт-чартер',
    icon: '🚤',
    children: [
      {
        id: 'speedboat',
        name_en: 'Speedboat',
        name_ru: 'Скоростной катер',
        icon: '🏎️',
        schema: {
          fields: [
            { key: 'capacity', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 50 },
            { key: 'length_ft', labelEn: 'Length (ft)', labelRu: 'Длина (фут)', type: 'number', min: 10 },
            { key: 'crew_included', labelEn: 'Crew Included', labelRu: 'Экипаж включен', type: 'switch' },
            { key: 'fuel_included', labelEn: 'Fuel Included', labelRu: 'Топливо включено', type: 'switch' },
            { key: 'destinations', labelEn: 'Destinations', labelRu: 'Направления', type: 'tags' },
          ],
          pricingModels: ['per_day', 'per_hour'],
          availabilityTypes: ['scheduled', 'request'],
          minImages: 5,
          maxImages: 20,
        },
      },
      {
        id: 'catamaran',
        name_en: 'Catamaran',
        name_ru: 'Катамаран',
        icon: '⛵',
        schema: {
          fields: [
            { key: 'capacity', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 80 },
            { key: 'length_ft', labelEn: 'Length (ft)', labelRu: 'Длина (фут)', type: 'number', min: 20 },
            { key: 'cabins', labelEn: 'Cabins', labelRu: 'Каюты', type: 'number', min: 0 },
            { key: 'crew_included', labelEn: 'Crew Included', labelRu: 'Экипаж включен', type: 'switch' },
            { key: 'fuel_included', labelEn: 'Fuel Included', labelRu: 'Топливо включено', type: 'switch' },
          ],
          pricingModels: ['per_day', 'per_hour'],
          availabilityTypes: ['scheduled', 'request'],
          minImages: 5,
          maxImages: 20,
        },
      },
      {
        id: 'sailing_yacht',
        name_en: 'Sailing Yacht',
        name_ru: 'Парусная яхта',
        icon: '🛥️',
        schema: {
          fields: [
            { key: 'capacity', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 30 },
            { key: 'length_ft', labelEn: 'Length (ft)', labelRu: 'Длина (фут)', type: 'number', min: 20 },
            { key: 'cabins', labelEn: 'Cabins', labelRu: 'Каюты', type: 'number', min: 0 },
            { key: 'overnight', labelEn: 'Overnight Available', labelRu: 'Ночевка возможна', type: 'switch' },
            { key: 'crew_included', labelEn: 'Crew Included', labelRu: 'Экипаж включен', type: 'switch' },
          ],
          pricingModels: ['per_day'],
          availabilityTypes: ['scheduled', 'request'],
          minImages: 5,
          maxImages: 20,
        },
      },
      {
        id: 'luxury_yacht',
        name_en: 'Luxury Motor Yacht',
        name_ru: 'Моторная яхта люкс',
        icon: '🛳️',
        schema: {
          fields: [
            { key: 'capacity', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 100 },
            { key: 'length_ft', labelEn: 'Length (ft)', labelRu: 'Длина (фут)', type: 'number', min: 30 },
            { key: 'cabins', labelEn: 'Cabins', labelRu: 'Каюты', type: 'number', min: 0 },
            { key: 'crew_included', labelEn: 'Crew Included', labelRu: 'Экипаж включен', type: 'switch' },
            { key: 'fuel_included', labelEn: 'Fuel Included', labelRu: 'Топливо включено', type: 'switch' },
            { key: 'catering_included', labelEn: 'Catering Included', labelRu: 'Кейтеринг включен', type: 'switch' },
          ],
          pricingModels: ['per_day'],
          availabilityTypes: ['request'],
          minImages: 8,
          maxImages: 30,
        },
      },
    ],
  },
];

// ==================== EXPERIENCE CATEGORIES ====================
export const EXPERIENCE_CATEGORIES: CategoryNode[] = [
  {
    id: 'water_experiences',
    name_en: 'Water Activities',
    name_ru: 'Водные активности',
    icon: '🌊',
    children: [
      {
        id: 'island-hopping',
        name_en: 'Island Hopping',
        name_ru: 'Острова',
        icon: '🏝️',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 2, max: 12 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'difficulty', labelEn: 'Difficulty', labelRu: 'Сложность', type: 'select', options: [
              { value: 'easy', labelEn: 'Easy', labelRu: 'Лёгкая' },
              { value: 'moderate', labelEn: 'Moderate', labelRu: 'Средняя' },
              { value: 'challenging', labelEn: 'Challenging', labelRu: 'Сложная' },
            ]},
            { key: 'lunch_included', labelEn: 'Lunch Included', labelRu: 'Обед включен', type: 'switch' },
            { key: 'snorkeling_gear', labelEn: 'Snorkeling Gear', labelRu: 'Маска и трубка', type: 'switch' },
            { key: 'pickup_included', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'snorkeling',
        name_en: 'Snorkeling',
        name_ru: 'Снорклинг',
        icon: '🤿',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 8 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'guide_included', labelEn: 'Guide Included', labelRu: 'Гид включен', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 12,
        },
      },
      {
        id: 'diving',
        name_en: 'Diving',
        name_ru: 'Дайвинг',
        icon: '🐠',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 2, max: 8 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'certification_required', labelEn: 'Certification Required', labelRu: 'Нужен сертификат', type: 'switch' },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'max_depth_m', labelEn: 'Max Depth (m)', labelRu: 'Макс. глубина (м)', type: 'number', min: 5, max: 40 },
          ],
          pricingModels: ['per_person'],
          availabilityTypes: ['scheduled'],
          minImages: 4,
          maxImages: 15,
          requiredLicenses: ['padi_certification'],
        },
      },
      {
        id: 'jet-ski',
        name_en: 'Jet Ski',
        name_ru: 'Гидроцикл',
        icon: '🏄',
        schema: {
          fields: [
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 15, max: 120 },
            { key: 'instructor_included', labelEn: 'Instructor', labelRu: 'Инструктор', type: 'switch' },
          ],
          pricingModels: ['per_hour', 'fixed'],
          availabilityTypes: ['instant'],
          minImages: 3,
          maxImages: 8,
        },
      },
      {
        id: 'fishing',
        name_en: 'Fishing',
        name_ru: 'Рыбалка',
        icon: '🎣',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 2, max: 12 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'lunch_included', labelEn: 'Lunch Included', labelRu: 'Обед включен', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 12,
        },
      },
      {
        id: 'sunset-cruise',
        name_en: 'Sunset Cruise',
        name_ru: 'Закатный круиз',
        icon: '🌅',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 4 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'drinks_included', labelEn: 'Drinks Included', labelRu: 'Напитки включены', type: 'switch' },
            { key: 'dinner_included', labelEn: 'Dinner Included', labelRu: 'Ужин включен', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'surfing',
        name_en: 'Surfing',
        name_ru: 'Сёрфинг',
        icon: '🏄‍♂️',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 4 },
            { key: 'board_included', labelEn: 'Board Included', labelRu: 'Доска включена', type: 'switch' },
            { key: 'level', labelEn: 'Level', labelRu: 'Уровень', type: 'select', options: [
              { value: 'beginner', labelEn: 'Beginner', labelRu: 'Новичок' },
              { value: 'intermediate', labelEn: 'Intermediate', labelRu: 'Средний' },
              { value: 'advanced', labelEn: 'Advanced', labelRu: 'Продвинутый' },
            ]},
          ],
          pricingModels: ['per_person', 'per_hour'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 10,
        },
      },
    ],
  },
  {
    id: 'land_experiences',
    name_en: 'Land Activities',
    name_ru: 'Наземные активности',
    icon: '🏔️',
    children: [
      {
        id: 'cultural',
        name_en: 'Cultural Tour',
        name_ru: 'Культурный тур',
        icon: '🛕',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 10 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'guide_language', labelEn: 'Guide Language', labelRu: 'Язык гида', type: 'tags' },
            { key: 'lunch_included', labelEn: 'Lunch Included', labelRu: 'Обед включен', type: 'switch' },
            { key: 'pickup_included', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'adventure',
        name_en: 'Adventure',
        name_ru: 'Приключения',
        icon: '🧗',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 8 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'difficulty', labelEn: 'Difficulty', labelRu: 'Сложность', type: 'select', options: [
              { value: 'easy', labelEn: 'Easy', labelRu: 'Лёгкая' },
              { value: 'moderate', labelEn: 'Moderate', labelRu: 'Средняя' },
              { value: 'challenging', labelEn: 'Challenging', labelRu: 'Сложная' },
            ]},
            { key: 'min_age', labelEn: 'Min Age', labelRu: 'Мин. возраст', type: 'number', min: 0, max: 18 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'food-tour',
        name_en: 'Food Tour',
        name_ru: 'Гастрономический тур',
        icon: '🍜',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 2, max: 6 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'tastings_count', labelEn: 'Number of Tastings', labelRu: 'Кол-во дегустаций', type: 'number', min: 3 },
            { key: 'dietary_options', labelEn: 'Dietary Options', labelRu: 'Диетические опции', type: 'tags' },
          ],
          pricingModels: ['per_person'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'zipline',
        name_en: 'Zipline',
        name_ru: 'Зиплайн',
        icon: '🦅',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 4 },
            { key: 'stations_count', labelEn: 'Number of Stations', labelRu: 'Кол-во станций', type: 'number', min: 1 },
            { key: 'min_age', labelEn: 'Min Age', labelRu: 'Мин. возраст', type: 'number', min: 0, max: 18 },
            { key: 'min_weight_kg', labelEn: 'Min Weight (kg)', labelRu: 'Мин. вес (кг)', type: 'number' },
            { key: 'max_weight_kg', labelEn: 'Max Weight (kg)', labelRu: 'Макс. вес (кг)', type: 'number' },
          ],
          pricingModels: ['per_person'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 5,
          maxImages: 12,
        },
      },
      {
        id: 'karting',
        name_en: 'Go-Kart Racing',
        name_ru: 'Картинг',
        icon: '🏎️',
        schema: {
          fields: [
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 10, max: 60 },
            { key: 'min_age', labelEn: 'Min Age', labelRu: 'Мин. возраст', type: 'number', min: 0, max: 18 },
            { key: 'track_length_m', labelEn: 'Track Length (m)', labelRu: 'Длина трассы (м)', type: 'number' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['instant'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'wildlife',
        name_en: 'Wildlife & Nature',
        name_ru: 'Дикая природа',
        icon: '🐘',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 8 },
            { key: 'max_group_size', labelEn: 'Max Group Size', labelRu: 'Макс. размер группы', type: 'number', required: true, min: 1 },
            { key: 'ethical_certified', labelEn: 'Ethical Certification', labelRu: 'Этический сертификат', type: 'switch' },
            { key: 'pickup_included', labelEn: 'Hotel Pickup', labelRu: 'Трансфер из отеля', type: 'switch' },
          ],
          pricingModels: ['per_person'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
    ],
  },
];

// ==================== RESTAURANT CATEGORIES ====================
export const RESTAURANT_CATEGORIES: CategoryNode[] = [
  {
    id: 'restaurant',
    name_en: 'Restaurant',
    name_ru: 'Ресторан',
    icon: '🍽️',
    schema: {
      fields: [
        { key: 'cuisine_type', labelEn: 'Cuisine Type', labelRu: 'Тип кухни', type: 'select', required: true, options: [
          { value: 'thai', labelEn: 'Thai', labelRu: 'Тайская' },
          { value: 'japanese', labelEn: 'Japanese', labelRu: 'Японская' },
          { value: 'italian', labelEn: 'Italian', labelRu: 'Итальянская' },
          { value: 'seafood', labelEn: 'Seafood', labelRu: 'Морепродукты' },
          { value: 'international', labelEn: 'International', labelRu: 'Международная' },
          { value: 'fusion', labelEn: 'Fusion', labelRu: 'Фьюжн' },
        ]},
        { key: 'venue_type', labelEn: 'Venue Type', labelRu: 'Тип заведения', type: 'select', options: [
          { value: 'restaurant', labelEn: 'Restaurant', labelRu: 'Ресторан' },
          { value: 'cafe', labelEn: 'Café', labelRu: 'Кафе' },
          { value: 'bar', labelEn: 'Bar', labelRu: 'Бар' },
          { value: 'beach_club', labelEn: 'Beach Club', labelRu: 'Бич-клуб' },
          { value: 'fine_dining', labelEn: 'Fine Dining', labelRu: 'Высокая кухня' },
        ]},
        { key: 'price_range', labelEn: 'Price Range', labelRu: 'Ценовая категория', type: 'select', options: [
          { value: 'budget', labelEn: '$ Budget', labelRu: '$ Бюджетный' },
          { value: 'moderate', labelEn: '$$ Moderate', labelRu: '$$ Средний' },
          { value: 'upscale', labelEn: '$$$ Upscale', labelRu: '$$$ Дорогой' },
          { value: 'fine_dining', labelEn: '$$$$ Fine Dining', labelRu: '$$$$ Высокая кухня' },
        ]},
        { key: 'seating_capacity', labelEn: 'Seating Capacity', labelRu: 'Кол-во мест', type: 'number', min: 1 },
        { key: 'delivery_available', labelEn: 'Delivery Available', labelRu: 'Доставка', type: 'switch' },
        { key: 'reservation_required', labelEn: 'Reservation Required', labelRu: 'Бронь обязательна', type: 'switch' },
        { key: 'dietary_options', labelEn: 'Dietary Options', labelRu: 'Диетические опции', type: 'tags' },
      ],
      pricingModels: ['fixed'],
      availabilityTypes: ['instant', 'scheduled'],
      minImages: 5,
      maxImages: 20,
    },
  },
];

// ==================== BEAUTY / SALON CATEGORIES ====================
export const BEAUTY_CATEGORIES: CategoryNode[] = [
  {
    id: 'beauty_wellness',
    name_en: 'Beauty & Wellness',
    name_ru: 'Красота и велнес',
    icon: '💇',
    children: [
      {
        id: 'beauty_salon',
        name_en: 'Beauty Salon',
        name_ru: 'Салон красоты',
        icon: '💇‍♀️',
        schema: {
          fields: [
            { key: 'salon_type', labelEn: 'Salon Type', labelRu: 'Тип салона', type: 'select', required: true, options: [
              { value: 'beauty_salon', labelEn: 'Beauty Salon', labelRu: 'Салон красоты' },
              { value: 'nail_studio', labelEn: 'Nail Studio', labelRu: 'Ногтевая студия' },
              { value: 'barbershop', labelEn: 'Barbershop', labelRu: 'Барбершоп' },
            ]},
            { key: 'services_offered', labelEn: 'Services Offered', labelRu: 'Услуги', type: 'tags' },
            { key: 'home_service', labelEn: 'Home Service Available', labelRu: 'Выезд на дом', type: 'switch' },
            { key: 'workstations', labelEn: 'Workstations', labelRu: 'Рабочих мест', type: 'number', min: 1 },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'spa',
        name_en: 'Spa',
        name_ru: 'СПА',
        icon: '🧖',
        schema: {
          fields: [
            { key: 'treatment_types', labelEn: 'Treatment Types', labelRu: 'Виды процедур', type: 'tags' },
            { key: 'duration_minutes', labelEn: 'Session Duration (min)', labelRu: 'Длительность сеанса (мин)', type: 'number', required: true, min: 30, max: 240 },
            { key: 'couples_available', labelEn: 'Couples Treatment', labelRu: 'Для пар', type: 'switch' },
            { key: 'sauna_available', labelEn: 'Sauna Available', labelRu: 'Сауна есть', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'massage',
        name_en: 'Massage',
        name_ru: 'Массаж',
        icon: '💆',
        schema: {
          fields: [
            { key: 'massage_types', labelEn: 'Massage Types', labelRu: 'Виды массажа', type: 'tags' },
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 30, max: 180 },
            { key: 'home_service', labelEn: 'Home Service Available', labelRu: 'Выезд на дом', type: 'switch' },
            { key: 'therapist_gender', labelEn: 'Therapist Gender', labelRu: 'Пол терапевта', type: 'select', options: [
              { value: 'any', labelEn: 'Any', labelRu: 'Любой' },
              { value: 'female', labelEn: 'Female', labelRu: 'Женщина' },
              { value: 'male', labelEn: 'Male', labelRu: 'Мужчина' },
            ]},
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 12,
        },
      },
    ],
  },
];

// ==================== MEDICAL CATEGORIES ====================
export const MEDICAL_CATEGORIES: CategoryNode[] = [
  {
    id: 'medical',
    name_en: 'Healthcare',
    name_ru: 'Здоровье',
    icon: '🏥',
    children: [
      {
        id: 'clinic',
        name_en: 'Clinic',
        name_ru: 'Клиника',
        icon: '🏥',
        schema: {
          fields: [
            { key: 'specialties', labelEn: 'Specialties', labelRu: 'Специализации', type: 'tags', required: true },
            { key: 'facility_type', labelEn: 'Facility Type', labelRu: 'Тип учреждения', type: 'select', required: true, options: [
              { value: 'hospital', labelEn: 'Hospital', labelRu: 'Больница' },
              { value: 'clinic', labelEn: 'Clinic', labelRu: 'Клиника' },
              { value: 'dental_clinic', labelEn: 'Dental Clinic', labelRu: 'Стоматология' },
              { value: 'wellness_center', labelEn: 'Wellness Center', labelRu: 'Велнес-центр' },
              { value: 'lab', labelEn: 'Laboratory', labelRu: 'Лаборатория' },
            ]},
            { key: 'languages_spoken', labelEn: 'Languages Spoken', labelRu: 'Языки обслуживания', type: 'tags' },
            { key: 'insurance_accepted', labelEn: 'Insurance Accepted', labelRu: 'Принимают страховку', type: 'switch' },
            { key: 'emergency_24h', labelEn: '24h Emergency', labelRu: 'Экстренная помощь 24ч', type: 'switch' },
            { key: 'online_booking', labelEn: 'Online Booking', labelRu: 'Онлайн запись', type: 'switch' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 15,
        },
      },
      {
        id: 'pharmacy',
        name_en: 'Pharmacy',
        name_ru: 'Аптека',
        icon: '💊',
        schema: {
          fields: [
            { key: 'delivery_available', labelEn: 'Delivery', labelRu: 'Доставка', type: 'switch' },
            { key: 'prescription_required', labelEn: 'Prescription Items', labelRu: 'Рецептурные препараты', type: 'switch' },
            { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['instant'],
          minImages: 2,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== FITNESS CATEGORIES ====================
export const FITNESS_CATEGORIES: CategoryNode[] = [
  {
    id: 'fitness',
    name_en: 'Fitness & Gyms',
    name_ru: 'Фитнес и залы',
    icon: '🏋️',
    schema: {
      fields: [
        { key: 'gym_type', labelEn: 'Type', labelRu: 'Тип', type: 'select', required: true, options: [
          { value: 'gym', labelEn: 'Gym', labelRu: 'Тренажёрный зал' },
          { value: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
          { value: 'yoga', labelEn: 'Yoga Studio', labelRu: 'Йога-студия' },
          { value: 'pilates', labelEn: 'Pilates', labelRu: 'Пилатес' },
          { value: 'muay_thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
          { value: 'mma', labelEn: 'MMA', labelRu: 'MMA' },
          { value: 'pool', labelEn: 'Swimming Pool', labelRu: 'Бассейн' },
        ]},
        { key: 'amenities', labelEn: 'Amenities', labelRu: 'Удобства', type: 'tags' },
        { key: 'personal_training', labelEn: 'Personal Training', labelRu: 'Персональные тренировки', type: 'switch' },
        { key: 'group_classes', labelEn: 'Group Classes', labelRu: 'Групповые занятия', type: 'switch' },
        { key: 'day_pass_available', labelEn: 'Day Pass Available', labelRu: 'Дневной абонемент', type: 'switch' },
      ],
      pricingModels: ['per_day', 'fixed'],
      availabilityTypes: ['instant', 'scheduled'],
      minImages: 5,
      maxImages: 15,
    },
  },
];

// ==================== EVENT CATEGORIES ====================
export const EVENT_CATEGORIES: CategoryNode[] = [
  {
    id: 'events',
    name_en: 'Events',
    name_ru: 'События',
    icon: '🎉',
    children: [
      {
        id: 'party',
        name_en: 'Party / Nightlife',
        name_ru: 'Вечеринка / Ночная жизнь',
        icon: '🎶',
        schema: {
          fields: [
            { key: 'venue', labelEn: 'Venue', labelRu: 'Площадка', type: 'text', required: true },
            { key: 'event_date', labelEn: 'Event Date', labelRu: 'Дата события', type: 'text', required: true },
            { key: 'capacity', labelEn: 'Max Capacity', labelRu: 'Макс. вместимость', type: 'number', min: 1 },
            { key: 'age_policy', labelEn: 'Age Policy', labelRu: 'Возрастная политика', type: 'select', options: [
              { value: 'all_ages', labelEn: 'All Ages', labelRu: 'Все возрасты' },
              { value: '18+', labelEn: '18+', labelRu: '18+' },
              { value: '21+', labelEn: '21+', labelRu: '21+' },
            ]},
            { key: 'dress_code', labelEn: 'Dress Code', labelRu: 'Дресс-код', type: 'text' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 15,
        },
      },
      {
        id: 'festival',
        name_en: 'Festival',
        name_ru: 'Фестиваль',
        icon: '🎪',
        schema: {
          fields: [
            { key: 'venue', labelEn: 'Venue', labelRu: 'Площадка', type: 'text', required: true },
            { key: 'event_date', labelEn: 'Event Date', labelRu: 'Дата события', type: 'text', required: true },
            { key: 'duration_days', labelEn: 'Duration (days)', labelRu: 'Длительность (дни)', type: 'number', min: 1, max: 14 },
            { key: 'capacity', labelEn: 'Max Capacity', labelRu: 'Макс. вместимость', type: 'number', min: 1 },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 5,
          maxImages: 20,
        },
      },
      {
        id: 'workshop_event',
        name_en: 'Workshop',
        name_ru: 'Воркшоп',
        icon: '🎨',
        schema: {
          fields: [
            { key: 'venue', labelEn: 'Venue', labelRu: 'Площадка', type: 'text', required: true },
            { key: 'event_date', labelEn: 'Event Date', labelRu: 'Дата события', type: 'text', required: true },
            { key: 'max_participants', labelEn: 'Max Participants', labelRu: 'Макс. участников', type: 'number', min: 1 },
            { key: 'materials_included', labelEn: 'Materials Included', labelRu: 'Материалы включены', type: 'switch' },
          ],
          pricingModels: ['per_person'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 12,
        },
      },
    ],
  },
];

// ==================== EDUCATION CATEGORIES ====================
export const EDUCATION_CATEGORIES: CategoryNode[] = [
  {
    id: 'education',
    name_en: 'Education & Courses',
    name_ru: 'Образование',
    icon: '📚',
    children: [
      {
        id: 'language_school',
        name_en: 'Language School',
        name_ru: 'Языковая школа',
        icon: '🗣️',
        schema: {
          fields: [
            { key: 'languages_taught', labelEn: 'Languages Taught', labelRu: 'Преподаваемые языки', type: 'tags', required: true },
            { key: 'class_format', labelEn: 'Class Format', labelRu: 'Формат', type: 'select', options: [
              { value: 'group', labelEn: 'Group', labelRu: 'Групповые' },
              { value: 'private', labelEn: 'Private', labelRu: 'Индивидуальные' },
              { value: 'online', labelEn: 'Online', labelRu: 'Онлайн' },
            ]},
            { key: 'levels', labelEn: 'Levels', labelRu: 'Уровни', type: 'tags' },
            { key: 'visa_support', labelEn: 'Visa Support', labelRu: 'Помощь с визой', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'sports_training',
        name_en: 'Sports Training',
        name_ru: 'Спортивные занятия',
        icon: '⚽',
        schema: {
          fields: [
            { key: 'sport_type', labelEn: 'Sport Type', labelRu: 'Вид спорта', type: 'text', required: true },
            { key: 'age_group', labelEn: 'Age Group', labelRu: 'Возраст', type: 'select', options: [
              { value: 'kids', labelEn: 'Kids (4-12)', labelRu: 'Дети (4-12)' },
              { value: 'teens', labelEn: 'Teens (13-17)', labelRu: 'Подростки (13-17)' },
              { value: 'adults', labelEn: 'Adults', labelRu: 'Взрослые' },
              { value: 'all_ages', labelEn: 'All Ages', labelRu: 'Все возрасты' },
            ]},
            { key: 'group_training', labelEn: 'Group Training', labelRu: 'Групповые', type: 'switch' },
            { key: 'private_training', labelEn: 'Private Training', labelRu: 'Индивидуальные', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour', 'per_person'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 12,
        },
      },
      {
        id: 'creative_course',
        name_en: 'Creative Course',
        name_ru: 'Творческий курс',
        icon: '🎨',
        schema: {
          fields: [
            { key: 'course_type', labelEn: 'Course Type', labelRu: 'Тип курса', type: 'text', required: true },
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1 },
            { key: 'materials_included', labelEn: 'Materials Included', labelRu: 'Материалы включены', type: 'switch' },
            { key: 'skill_level', labelEn: 'Skill Level', labelRu: 'Уровень', type: 'select', options: [
              { value: 'beginner', labelEn: 'Beginner', labelRu: 'Начальный' },
              { value: 'intermediate', labelEn: 'Intermediate', labelRu: 'Средний' },
              { value: 'advanced', labelEn: 'Advanced', labelRu: 'Продвинутый' },
            ]},
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 12,
        },
      },
    ],
  },
];

// ==================== BABYSITTER CATEGORIES ====================
export const BABYSITTER_CATEGORIES: CategoryNode[] = [
  {
    id: 'childcare',
    name_en: 'Childcare',
    name_ru: 'Присмотр за детьми',
    icon: '👶',
    schema: {
      fields: [
        { key: 'age_groups', labelEn: 'Age Groups', labelRu: 'Возрастные группы', type: 'tags', required: true },
        { key: 'languages', labelEn: 'Languages', labelRu: 'Языки', type: 'tags', required: true },
        { key: 'experience_years', labelEn: 'Experience (years)', labelRu: 'Опыт (лет)', type: 'number', min: 0, max: 30 },
        { key: 'first_aid_certified', labelEn: 'First Aid Certified', labelRu: 'Сертификат первой помощи', type: 'switch' },
        { key: 'can_cook', labelEn: 'Can Cook', labelRu: 'Готовит', type: 'switch' },
        { key: 'can_drive', labelEn: 'Can Drive', labelRu: 'Водит авто', type: 'switch' },
        { key: 'overnight_available', labelEn: 'Overnight Available', labelRu: 'Ночёвка возможна', type: 'switch' },
      ],
      pricingModels: ['per_hour', 'per_day'],
      availabilityTypes: ['request', 'scheduled'],
      minImages: 1,
      maxImages: 5,
    },
  },
];

// ==================== PET SERVICES CATEGORIES ====================
export const PET_CATEGORIES: CategoryNode[] = [
  {
    id: 'pet_services',
    name_en: 'Pet Care',
    name_ru: 'Уход за питомцами',
    icon: '🐾',
    children: [
      {
        id: 'pet_grooming',
        name_en: 'Grooming',
        name_ru: 'Груминг',
        icon: '✂️',
        schema: {
          fields: [
            { key: 'pet_types', labelEn: 'Pet Types', labelRu: 'Виды животных', type: 'tags', required: true },
            { key: 'mobile_service', labelEn: 'Mobile Service', labelRu: 'Выездной', type: 'switch' },
            { key: 'breeds_specialized', labelEn: 'Breed Specialization', labelRu: 'Специализация на породах', type: 'tags' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'pet_sitting',
        name_en: 'Pet Sitting',
        name_ru: 'Передержка',
        icon: '🏠',
        schema: {
          fields: [
            { key: 'pet_types', labelEn: 'Pet Types', labelRu: 'Виды животных', type: 'tags', required: true },
            { key: 'home_visits', labelEn: 'Home Visits', labelRu: 'На дому', type: 'switch' },
            { key: 'boarding', labelEn: 'Boarding Available', labelRu: 'Пансион', type: 'switch' },
            { key: 'max_pets', labelEn: 'Max Pets at Once', labelRu: 'Макс. животных', type: 'number', min: 1 },
          ],
          pricingModels: ['per_day', 'per_hour'],
          availabilityTypes: ['request', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'vet_clinic',
        name_en: 'Vet Clinic',
        name_ru: 'Ветклиника',
        icon: '🩺',
        schema: {
          fields: [
            { key: 'specialties', labelEn: 'Specialties', labelRu: 'Специализации', type: 'tags' },
            { key: 'emergency_24h', labelEn: '24h Emergency', labelRu: 'Экстренно 24ч', type: 'switch' },
            { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 10,
        },
      },
    ],
  },
];

// ==================== LEGAL CATEGORIES ====================
export const LEGAL_CATEGORIES: CategoryNode[] = [
  {
    id: 'legal_services',
    name_en: 'Legal Services',
    name_ru: 'Юридические услуги',
    icon: '⚖️',
    children: [
      {
        id: 'visa_services',
        name_en: 'Visa & Immigration',
        name_ru: 'Визы и иммиграция',
        icon: '🛂',
        schema: {
          fields: [
            { key: 'visa_types', labelEn: 'Visa Types', labelRu: 'Типы виз', type: 'tags', required: true },
            { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags', required: true },
            { key: 'online_consultation', labelEn: 'Online Consultation', labelRu: 'Онлайн консультация', type: 'switch' },
            { key: 'free_initial_consultation', labelEn: 'Free Initial Consultation', labelRu: 'Бесплатная первая консультация', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
      {
        id: 'business_registration',
        name_en: 'Business Registration',
        name_ru: 'Регистрация бизнеса',
        icon: '🏢',
        schema: {
          fields: [
            { key: 'company_types', labelEn: 'Company Types', labelRu: 'Типы компаний', type: 'tags' },
            { key: 'accounting_included', labelEn: 'Accounting Included', labelRu: 'Бухгалтерия включена', type: 'switch' },
            { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
      {
        id: 'real_estate_legal',
        name_en: 'Real Estate Legal',
        name_ru: 'Юрист по недвижимости',
        icon: '🏠',
        schema: {
          fields: [
            { key: 'service_types', labelEn: 'Service Types', labelRu: 'Типы услуг', type: 'tags' },
            { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags' },
            { key: 'free_initial_consultation', labelEn: 'Free Consultation', labelRu: 'Бесплатная консультация', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== FLOWER SHOP CATEGORIES ====================
export const FLOWER_CATEGORIES: CategoryNode[] = [
  {
    id: 'flower_shop',
    name_en: 'Flower Delivery',
    name_ru: 'Доставка цветов',
    icon: '💐',
    schema: {
      fields: [
        { key: 'specialties', labelEn: 'Specialties', labelRu: 'Специализации', type: 'tags' },
        { key: 'same_day_delivery', labelEn: 'Same Day Delivery', labelRu: 'Доставка в тот же день', type: 'switch' },
        { key: 'custom_arrangements', labelEn: 'Custom Arrangements', labelRu: 'Индивидуальные букеты', type: 'switch' },
        { key: 'event_decoration', labelEn: 'Event Decoration', labelRu: 'Оформление мероприятий', type: 'switch' },
        { key: 'delivery_radius_km', labelEn: 'Delivery Radius (km)', labelRu: 'Радиус доставки (км)', type: 'number', min: 1 },
      ],
      pricingModels: ['fixed'],
      availabilityTypes: ['instant', 'scheduled'],
      minImages: 5,
      maxImages: 20,
    },
  },
];

// ==================== INSURANCE CATEGORIES ====================
export const INSURANCE_CATEGORIES: CategoryNode[] = [
  {
    id: 'insurance',
    name_en: 'Insurance',
    name_ru: 'Страхование',
    icon: '🛡️',
    schema: {
      fields: [
        { key: 'insurance_types', labelEn: 'Insurance Types', labelRu: 'Виды страхования', type: 'tags', required: true },
        { key: 'coverage_areas', labelEn: 'Coverage Areas', labelRu: 'Покрытие', type: 'tags' },
        { key: 'languages_spoken', labelEn: 'Languages', labelRu: 'Языки', type: 'tags' },
        { key: 'online_claims', labelEn: 'Online Claims', labelRu: 'Онлайн заявки', type: 'switch' },
        { key: 'expat_friendly', labelEn: 'Expat Friendly', labelRu: 'Для экспатов', type: 'switch' },
      ],
      pricingModels: ['fixed'],
      availabilityTypes: ['request', 'scheduled'],
      minImages: 2,
      maxImages: 8,
    },
  },
];

// ==================== VEHICLE / TRANSPORT CATEGORIES ====================
export const VEHICLE_CATEGORIES: CategoryNode[] = [
  {
    id: 'vehicles',
    name_en: 'Car & Bike Rental',
    name_ru: 'Аренда авто и мото',
    icon: '🚗',
    children: [
      {
        id: 'car',
        name_en: 'Car',
        name_ru: 'Автомобиль',
        icon: '🚗',
        schema: {
          fields: [
            { key: 'brand', labelEn: 'Brand', labelRu: 'Марка', type: 'text', required: true },
            { key: 'model', labelEn: 'Model', labelRu: 'Модель', type: 'text', required: true },
            { key: 'year', labelEn: 'Year', labelRu: 'Год', type: 'number', min: 2000, max: 2030 },
            { key: 'transmission', labelEn: 'Transmission', labelRu: 'КПП', type: 'select', options: [
              { value: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат' },
              { value: 'manual', labelEn: 'Manual', labelRu: 'Механика' },
            ]},
            { key: 'passengers', labelEn: 'Passengers', labelRu: 'Пассажиров', type: 'number', required: true, min: 1, max: 15 },
            { key: 'insurance_included', labelEn: 'Insurance Included', labelRu: 'Страховка включена', type: 'switch' },
            { key: 'delivery', labelEn: 'Delivery Available', labelRu: 'Доставка', type: 'switch' },
          ],
          pricingModels: ['per_day'],
          availabilityTypes: ['instant', 'request'],
          minImages: 5,
          maxImages: 15,
        },
      },
      {
        id: 'motorbike',
        name_en: 'Motorbike',
        name_ru: 'Мотоцикл',
        icon: '🏍️',
        schema: {
          fields: [
            { key: 'brand', labelEn: 'Brand', labelRu: 'Марка', type: 'text', required: true },
            { key: 'model', labelEn: 'Model', labelRu: 'Модель', type: 'text', required: true },
            { key: 'engine_cc', labelEn: 'Engine (cc)', labelRu: 'Объем (куб.см)', type: 'number', min: 50, max: 2000 },
            { key: 'helmet_included', labelEn: 'Helmet Included', labelRu: 'Шлем включен', type: 'switch' },
            { key: 'delivery', labelEn: 'Delivery Available', labelRu: 'Доставка', type: 'switch' },
          ],
          pricingModels: ['per_day'],
          availabilityTypes: ['instant', 'request'],
          minImages: 4,
          maxImages: 10,
        },
      },
      {
        id: 'scooter',
        name_en: 'Scooter',
        name_ru: 'Скутер',
        icon: '🛵',
        schema: {
          fields: [
            { key: 'brand', labelEn: 'Brand', labelRu: 'Марка', type: 'text' },
            { key: 'engine_cc', labelEn: 'Engine (cc)', labelRu: 'Объем (куб.см)', type: 'number', min: 50, max: 300 },
            { key: 'helmet_included', labelEn: 'Helmet Included', labelRu: 'Шлем включен', type: 'switch' },
            { key: 'delivery', labelEn: 'Delivery Available', labelRu: 'Доставка', type: 'switch' },
          ],
          pricingModels: ['per_day'],
          availabilityTypes: ['instant'],
          minImages: 3,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== TRANSFER CATEGORIES ====================
export const TRANSFER_CATEGORIES: CategoryNode[] = [
  {
    id: 'transfers',
    name_en: 'Transfers',
    name_ru: 'Трансферы',
    icon: '🚕',
    children: [
      {
        id: 'airport_transfer',
        name_en: 'Airport Transfer',
        name_ru: 'Трансфер в аэропорт',
        icon: '✈️',
        schema: {
          fields: [
            { key: 'vehicle_type', labelEn: 'Vehicle Type', labelRu: 'Тип авто', type: 'select', required: true, options: [
              { value: 'sedan', labelEn: 'Sedan', labelRu: 'Седан' },
              { value: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник' },
              { value: 'van', labelEn: 'Van', labelRu: 'Минивэн' },
              { value: 'minibus', labelEn: 'Minibus', labelRu: 'Микроавтобус' },
            ]},
            { key: 'max_passengers', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 30 },
            { key: 'max_luggage', labelEn: 'Max Luggage', labelRu: 'Макс. багаж', type: 'number', min: 0 },
            { key: 'meet_greet', labelEn: 'Meet & Greet', labelRu: 'Встреча с табличкой', type: 'switch' },
            { key: 'flight_tracking', labelEn: 'Flight Tracking', labelRu: 'Отслеживание рейса', type: 'switch' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 8,
        },
      },
      {
        id: 'city_transfer',
        name_en: 'City Transfer',
        name_ru: 'Городской трансфер',
        icon: '🚗',
        schema: {
          fields: [
            { key: 'vehicle_type', labelEn: 'Vehicle Type', labelRu: 'Тип авто', type: 'select', required: true, options: [
              { value: 'sedan', labelEn: 'Sedan', labelRu: 'Седан' },
              { value: 'suv', labelEn: 'SUV', labelRu: 'Внедорожник' },
              { value: 'van', labelEn: 'Van', labelRu: 'Минивэн' },
            ]},
            { key: 'max_passengers', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', required: true, min: 1, max: 15 },
            { key: 'hourly_available', labelEn: 'Hourly Hire', labelRu: 'Почасовая аренда', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['scheduled', 'instant'],
          minImages: 3,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== WATER ACTIVITY CATEGORIES ====================
export const WATER_ACTIVITY_CATEGORIES: CategoryNode[] = [
  {
    id: 'water_activities',
    name_en: 'Water Sports',
    name_ru: 'Водный спорт',
    icon: '🏄',
    children: [
      {
        id: 'kayak',
        name_en: 'Kayaking',
        name_ru: 'Каякинг',
        icon: '🛶',
        schema: {
          fields: [
            { key: 'duration_hours', labelEn: 'Duration (hours)', labelRu: 'Длительность (часы)', type: 'number', required: true, min: 1, max: 6 },
            { key: 'guide_included', labelEn: 'Guide Included', labelRu: 'Гид включен', type: 'switch' },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
          ],
          pricingModels: ['per_person', 'per_hour'],
          availabilityTypes: ['instant', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'parasailing',
        name_en: 'Parasailing',
        name_ru: 'Парасейлинг',
        icon: '🪂',
        schema: {
          fields: [
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 10, max: 30 },
            { key: 'max_passengers', labelEn: 'Max Passengers', labelRu: 'Макс. пассажиров', type: 'number', min: 1, max: 3 },
            { key: 'height_m', labelEn: 'Flight Height (m)', labelRu: 'Высота полёта (м)', type: 'number' },
          ],
          pricingModels: ['per_person', 'fixed'],
          availabilityTypes: ['instant'],
          minImages: 3,
          maxImages: 8,
        },
      },
      {
        id: 'wakeboarding',
        name_en: 'Wakeboarding',
        name_ru: 'Вейкборд',
        icon: '🏄‍♂️',
        schema: {
          fields: [
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 15, max: 60 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'instructor_included', labelEn: 'Instructor', labelRu: 'Инструктор', type: 'switch' },
          ],
          pricingModels: ['per_hour', 'fixed'],
          availabilityTypes: ['instant', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
    ],
  },
];

// ==================== CLEANING SERVICES ====================
// Re-uses homeServicesTaxonomy structure
export const CLEANING_CATEGORIES: CategoryNode[] = [
  {
    id: 'cleaning_services',
    name_en: 'Cleaning Services',
    name_ru: 'Клининг',
    icon: '🧹',
    children: [
      {
        id: 'home-cleaning',
        name_en: 'Home Cleaning',
        name_ru: 'Уборка дома',
        icon: '🏠',
        schema: {
          fields: [
            { key: 'service_area', labelEn: 'Service Area', labelRu: 'Зона обслуживания', type: 'text', required: true },
            { key: 'team_size', labelEn: 'Team Size', labelRu: 'Размер команды', type: 'number', min: 1 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'eco_friendly', labelEn: 'Eco-Friendly Products', labelRu: 'Эко-средства', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['instant', 'request', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'deep-cleaning',
        name_en: 'Deep Cleaning',
        name_ru: 'Генеральная уборка',
        icon: '✨',
        schema: {
          fields: [
            { key: 'service_area', labelEn: 'Service Area', labelRu: 'Зона обслуживания', type: 'text', required: true },
            { key: 'team_size', labelEn: 'Team Size', labelRu: 'Размер команды', type: 'number', min: 1 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
            { key: 'move_in_out', labelEn: 'Move In/Out', labelRu: 'Заезд/Выезд', type: 'switch' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['request', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'pool-cleaning',
        name_en: 'Pool Cleaning',
        name_ru: 'Чистка бассейна',
        icon: '🏊',
        schema: {
          fields: [
            { key: 'pool_size', labelEn: 'Pool Size', labelRu: 'Размер бассейна', type: 'text' },
            { key: 'chemicals_included', labelEn: 'Chemicals Included', labelRu: 'Химия включена', type: 'switch' },
            { key: 'equipment_maintenance', labelEn: 'Equipment Check', labelRu: 'Проверка оборудования', type: 'switch' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== HOME SERVICES (REPAIR) ====================
export const HOME_SERVICE_CATEGORIES: CategoryNode[] = [
  {
    id: 'home_services',
    name_en: 'Home Services',
    name_ru: 'Услуги для дома',
    icon: '🏠',
    children: [
      {
        id: 'handyman',
        name_en: 'Handyman',
        name_ru: 'Мастер на час',
        icon: '🔨',
        schema: {
          fields: [
            { key: 'specializations', labelEn: 'Specializations', labelRu: 'Специализации', type: 'tags' },
            { key: 'emergency_available', labelEn: 'Emergency Service', labelRu: 'Экстренный вызов', type: 'switch' },
            { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['instant', 'request', 'scheduled'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'plumbing',
        name_en: 'Plumbing',
        name_ru: 'Сантехник',
        icon: '🚿',
        schema: {
          fields: [
            { key: 'emergency_available', labelEn: 'Emergency Service', labelRu: 'Экстренный вызов', type: 'switch' },
            { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['instant', 'request', 'scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
      {
        id: 'electrical',
        name_en: 'Electrical',
        name_ru: 'Электрик',
        icon: '⚡',
        schema: {
          fields: [
            { key: 'licensed', labelEn: 'Licensed', labelRu: 'Лицензированный', type: 'switch', required: true },
            { key: 'emergency_available', labelEn: 'Emergency Service', labelRu: 'Экстренный вызов', type: 'switch' },
            { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['request', 'scheduled'],
          minImages: 2,
          maxImages: 8,
          requiredLicenses: ['electrical_license'],
        },
      },
      {
        id: 'ac',
        name_en: 'AC Service',
        name_ru: 'Кондиционеры',
        icon: '❄️',
        schema: {
          fields: [
            { key: 'service_types', labelEn: 'Service Types', labelRu: 'Типы услуг', type: 'tags' },
            { key: 'brands_serviced', labelEn: 'Brands Serviced', labelRu: 'Обслуживаемые бренды', type: 'tags' },
            { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 2,
          maxImages: 8,
        },
      },
    ],
  },
];

// ==================== VERTICAL → CATEGORY MAP ====================
/**
 * Maps vertical IDs (from VERTICALS registry) to their category trees.
 * Used by CanonicalListingWizard and IntakeItemEditor to render
 * the correct form schema per vertical.
 */
export const VERTICAL_CATEGORY_MAP: Record<string, CategoryNode[]> = {
  // Canonical vertical IDs (singular)
  yacht: YACHT_CATEGORIES,
  experience: EXPERIENCE_CATEGORIES,
  restaurant: RESTAURANT_CATEGORIES,
  beauty: BEAUTY_CATEGORIES,
  medical: MEDICAL_CATEGORIES,
  fitness: FITNESS_CATEGORIES,
  event: EVENT_CATEGORIES,
  education: EDUCATION_CATEGORIES,
  babysitter: BABYSITTER_CATEGORIES,
  pet_service: PET_CATEGORIES,
  legal: LEGAL_CATEGORIES,
  flower: FLOWER_CATEGORIES,
  insurance: INSURANCE_CATEGORIES,
  vehicle: VEHICLE_CATEGORIES,
  transfer: TRANSFER_CATEGORIES,
  water_activity: WATER_ACTIVITY_CATEGORIES,
  cleaning: CLEANING_CATEGORIES,

  // Plural aliases (for URL slugs and legacy references)
  yachts: YACHT_CATEGORIES,
  experiences: EXPERIENCE_CATEGORIES,
  restaurants: RESTAURANT_CATEGORIES,
  salons: BEAUTY_CATEGORIES,
  clinics: MEDICAL_CATEGORIES,
  gyms: FITNESS_CATEGORIES,
  events: EVENT_CATEGORIES,
  babysitters: BABYSITTER_CATEGORIES,
  pet_services: PET_CATEGORIES,
  legal_services: LEGAL_CATEGORIES,
  flower_shops: FLOWER_CATEGORIES,
  insurance_providers: INSURANCE_CATEGORIES,
  vehicles: VEHICLE_CATEGORIES,
  transfers: TRANSFER_CATEGORIES,
  water_activities: WATER_ACTIVITY_CATEGORIES,
  cleaning_services: CLEANING_CATEGORIES,
  education_providers: EDUCATION_CATEGORIES,
};

/**
 * Get category tree for a given vertical ID.
 * Accepts both singular and plural forms.
 */
export function getCategoriesForVertical(verticalId: string): CategoryNode[] {
  return VERTICAL_CATEGORY_MAP[verticalId] || [];
}

/**
 * Get all supported vertical IDs (unique, canonical singular forms)
 */
export function getSupportedVerticals(): string[] {
  return [...new Set(Object.keys(VERTICAL_CATEGORY_MAP))];
}
