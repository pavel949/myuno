/**
 * Yacht charter vertical spec.
 * Storage: public.listings WHERE vertical='yacht'.
 * Best-practice references: GetMyBoat, Boatsetter, Click&Boat, SamBoat.
 */
import type { VerticalSpec, FieldOption } from './types';

const BOAT_TYPES: FieldOption[] = [
  { value: 'motor_yacht', label: { en: 'Motor yacht', ru: 'Моторная яхта' } },
  { value: 'sailing_yacht', label: { en: 'Sailing yacht', ru: 'Парусная яхта' } },
  { value: 'catamaran', label: { en: 'Catamaran', ru: 'Катамаран' } },
  { value: 'speedboat', label: { en: 'Speedboat', ru: 'Спид-бот' } },
  { value: 'longtail', label: { en: 'Longtail boat', ru: 'Лонгтейл' } },
  { value: 'fishing', label: { en: 'Fishing boat', ru: 'Рыболовное судно' } },
  { value: 'luxury', label: { en: 'Luxury yacht', ru: 'Люкс-яхта' } },
];

const CHARTER_TYPES: FieldOption[] = [
  { value: 'bareboat', label: { en: 'Bareboat (without crew)', ru: 'Без экипажа' } },
  { value: 'crewed', label: { en: 'Crewed', ru: 'С экипажем' } },
  { value: 'skippered', label: { en: 'Skippered', ru: 'С капитаном' } },
];

const AMENITIES: FieldOption[] = [
  { value: 'snorkeling', label: { en: 'Snorkeling gear', ru: 'Снаряжение для снорклинга' } },
  { value: 'fishing', label: { en: 'Fishing gear', ru: 'Рыболовные снасти' } },
  { value: 'wakeboard', label: { en: 'Wakeboard', ru: 'Вейкборд' } },
  { value: 'kayak', label: { en: 'Kayak / SUP', ru: 'Каяк / SUP' } },
  { value: 'sound_system', label: { en: 'Sound system', ru: 'Аудио-система' } },
  { value: 'aircon_cabin', label: { en: 'A/C cabins', ru: 'Каюты с кондиц.' } },
  { value: 'shower', label: { en: 'Shower', ru: 'Душ' } },
  { value: 'toilet', label: { en: 'Toilet', ru: 'Туалет' } },
  { value: 'kitchen', label: { en: 'Kitchen', ru: 'Кухня' } },
  { value: 'bbq', label: { en: 'BBQ on board', ru: 'Гриль на борту' } },
  { value: 'sunpad', label: { en: 'Sun pad', ru: 'Зона для загара' } },
  { value: 'dinghy', label: { en: 'Dinghy / tender', ru: 'Дингай' } },
];

const TRIP_INCLUDES: FieldOption[] = [
  { value: 'fuel', label: { en: 'Fuel included', ru: 'Топливо включено' } },
  { value: 'crew', label: { en: 'Crew included', ru: 'Экипаж включён' } },
  { value: 'food', label: { en: 'Food / lunch', ru: 'Обед / еда' } },
  { value: 'drinks', label: { en: 'Soft drinks', ru: 'Напитки' } },
  { value: 'permits', label: { en: 'National park fees', ru: 'Сборы нацпарка' } },
  { value: 'insurance', label: { en: 'Insurance', ru: 'Страховка' } },
  { value: 'pickup', label: { en: 'Hotel pickup', ru: 'Трансфер из отеля' } },
];

const ROUTES: FieldOption[] = [
  { value: 'phi_phi', label: { en: 'Phi Phi Islands', ru: 'Острова Пхи-Пхи' } },
  { value: 'james_bond', label: { en: 'James Bond Island', ru: 'Остров Джеймса Бонда' } },
  { value: 'similan', label: { en: 'Similan Islands', ru: 'Симиланы' } },
  { value: 'racha', label: { en: 'Racha Islands', ru: 'Острова Рача' } },
  { value: 'coral_island', label: { en: 'Coral Island', ru: 'Коралловый остров' } },
  { value: 'sunset', label: { en: 'Sunset cruise', ru: 'Закатный круиз' } },
  { value: 'custom', label: { en: 'Custom route', ru: 'Маршрут под заказ' } },
];

export const yachtSpec: VerticalSpec = {
  id: 'yacht',
  label: { en: 'Yacht charter', ru: 'Аренда яхт' },
  storage: { kind: 'listings_vertical', vertical: 'yacht' },
  surface: 'live',
  icon: 'Sailboat',
  references: ['GetMyBoat', 'Boatsetter', 'Click&Boat', 'SamBoat'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'vessel',
      title: { en: 'About the vessel', ru: 'О судне' },
      mapsToTab: 'basics',
      groups: [{
        id: 'core',
        title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Listing title (RU + EN)', ru: 'Заголовок (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
          { key: 'boat_type', label: { en: 'Boat type', ru: 'Тип судна' }, type: 'select', options: BOAT_TYPES, required: true, path: 'attributes.boat_type', qualityWeight: 5 },
          { key: 'manufacturer', label: { en: 'Manufacturer / model', ru: 'Производитель / модель' }, type: 'text', path: 'attributes.manufacturer', qualityWeight: 3 },
          { key: 'year', label: { en: 'Year built', ru: 'Год постройки' }, type: 'number', min: 1970, max: new Date().getFullYear(), path: 'attributes.year_built' },
          { key: 'length_m', label: { en: 'Length (m)', ru: 'Длина (м)' }, type: 'number', min: 3, step: 0.1, required: true, path: 'attributes.length_m', qualityWeight: 4 },
        ],
      }],
    },
    {
      id: 'capacity',
      title: { en: 'Capacity & cabins', ru: 'Вместимость и каюты' },
      mapsToTab: 'details',
      groups: [{
        id: 'cap',
        title: { en: 'Capacity', ru: 'Вместимость' },
        fields: [
          { key: 'guests_max', label: { en: 'Max guests (day)', ru: 'Максимум гостей (день)' }, type: 'number', min: 1, required: true, path: 'attributes.guests_max', qualityWeight: 4 },
          { key: 'guests_overnight', label: { en: 'Sleeps overnight', ru: 'Ночёвка для' }, type: 'number', min: 0, path: 'attributes.guests_overnight' },
          { key: 'cabins', label: { en: 'Cabins', ru: 'Каюты' }, type: 'number', min: 0, path: 'attributes.cabins' },
          { key: 'bathrooms', label: { en: 'Bathrooms', ru: 'Санузлы' }, type: 'number', min: 0, path: 'attributes.bathrooms' },
        ],
      }],
    },
    {
      id: 'charter',
      title: { en: 'Charter terms', ru: 'Условия чартера' },
      mapsToTab: 'booking',
      groups: [{
        id: 'terms',
        title: { en: 'How you charter', ru: 'Как сдаёте' },
        fields: [
          { key: 'charter_types', label: { en: 'Charter types', ru: 'Типы чартера' }, type: 'multiselect', options: CHARTER_TYPES, required: true, path: 'attributes.charter_types', qualityWeight: 5 },
          { key: 'min_hours', label: { en: 'Min duration (hours)', ru: 'Мин. длительность (часы)' }, type: 'number', min: 1, required: true, path: 'attributes.min_hours' },
          { key: 'routes', label: { en: 'Popular routes', ru: 'Популярные маршруты' }, type: 'multiselect', options: ROUTES, path: 'attributes.routes', qualityWeight: 5 },
          { key: 'departure_marina', label: { en: 'Departure marina', ru: 'Марина отправления' }, type: 'address', required: true, path: 'attributes.departure_marina', qualityWeight: 5 },
        ],
      }],
    },
    {
      id: 'pricing',
      title: { en: 'Pricing & inclusions', ru: 'Цены и включено' },
      mapsToTab: 'pricing',
      groups: [{
        id: 'price',
        title: { en: 'Price (THB)', ru: 'Цена (THB)' },
        fields: [
          { key: 'price_half_day', label: { en: 'Half-day (4h)', ru: 'Полдня (4ч)' }, type: 'currency_thb', path: 'attributes.price_half_day' },
          { key: 'price_full_day', label: { en: 'Full day (8h)', ru: 'Полный день (8ч)' }, type: 'currency_thb', required: true, path: 'attributes.price_full_day', qualityWeight: 5 },
          { key: 'price_overnight', label: { en: 'Per night', ru: 'За ночь' }, type: 'currency_thb', path: 'attributes.price_overnight' },
          { key: 'includes', label: { en: 'Included in price', ru: 'Включено в цену' }, type: 'multiselect', options: TRIP_INCLUDES, path: 'attributes.includes', qualityWeight: 5 },
        ],
      }],
    },
    {
      id: 'amenities',
      title: { en: 'On-board amenities', ru: 'На борту' },
      mapsToTab: 'details',
      groups: [{
        id: 'amen',
        title: { en: 'What\'s on board', ru: 'Что есть на борту' },
        fields: [
          { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities', qualityWeight: 8 },
        ],
      }],
    },
    {
      id: 'media',
      title: { en: 'Photos & video', ru: 'Фото и видео' },
      mapsToTab: 'media',
      groups: [{
        id: 'media',
        title: { en: 'Media (min 6 photos)', ru: 'Медиа (мин. 6 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 12 },
          { key: 'video_url', label: { en: 'Video tour URL', ru: 'Видеотур' }, type: 'video_url', path: 'attributes.video_url' },
        ],
      }],
    },
    {
      id: 'compliance',
      title: { en: 'Safety & licenses', ru: 'Безопасность и лицензии' },
      mapsToTab: 'compliance',
      groups: [{
        id: 'safety',
        title: { en: 'Compliance', ru: 'Лицензии' },
        fields: [
          { key: 'marine_license', label: { en: 'Marine license', ru: 'Морская лицензия' }, type: 'license_upload', required: true, path: 'attributes.licenses.marine', qualityWeight: 5 },
          { key: 'insurance', label: { en: 'Liability insurance', ru: 'Страхование ответственности' }, type: 'license_upload', required: true, path: 'attributes.licenses.insurance', qualityWeight: 5 },
          { key: 'life_jackets', label: { en: 'Life jackets for all guests', ru: 'Спасжилеты на всех' }, type: 'boolean', required: true, path: 'attributes.safety.life_jackets' },
          { key: 'first_aid', label: { en: 'First aid kit', ru: 'Аптечка' }, type: 'boolean', path: 'attributes.safety.first_aid' },
        ],
      }],
    },
    {
      id: 'description',
      title: { en: 'Description', ru: 'Описание' },
      mapsToTab: 'basics',
      groups: [{
        id: 'desc',
        title: { en: 'Tell the story', ru: 'Расскажите о судне' },
        fields: [
          { key: 'description', label: { en: 'Full description (RU + EN)', ru: 'Полное описание (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.description', qualityWeight: 10 },
        ],
      }],
    },
  ],

  editorTabs: [
    {
      id: 'basics',
      title: { en: 'Basics', ru: 'Основное' },
      groups: [{
        id: 'core',
        title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Title', ru: 'Заголовок' }, type: 'i18n_text', required: true, path: 'attributes.title' },
          { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
          { key: 'boat_type', label: { en: 'Type', ru: 'Тип' }, type: 'select', options: BOAT_TYPES, required: true, path: 'attributes.boat_type' },
          { key: 'manufacturer', label: { en: 'Manufacturer / model', ru: 'Производитель / модель' }, type: 'text', path: 'attributes.manufacturer' },
          { key: 'year_built', label: { en: 'Year', ru: 'Год' }, type: 'number', path: 'attributes.year_built' },
          { key: 'length_m', label: { en: 'Length (m)', ru: 'Длина (м)' }, type: 'number', min: 3, step: 0.1, path: 'attributes.length_m' },
        ],
      }],
    },
    {
      id: 'details',
      title: { en: 'Capacity & amenities', ru: 'Вместимость и удобства' },
      groups: [
        {
          id: 'cap',
          title: { en: 'Capacity', ru: 'Вместимость' },
          fields: [
            { key: 'guests_max', label: { en: 'Max guests', ru: 'Макс. гостей' }, type: 'number', min: 1, required: true, path: 'attributes.guests_max' },
            { key: 'guests_overnight', label: { en: 'Sleeps', ru: 'Ночёвка' }, type: 'number', path: 'attributes.guests_overnight' },
            { key: 'cabins', label: { en: 'Cabins', ru: 'Каюты' }, type: 'number', path: 'attributes.cabins' },
            { key: 'bathrooms', label: { en: 'Bathrooms', ru: 'Санузлы' }, type: 'number', path: 'attributes.bathrooms' },
          ],
        },
        {
          id: 'amen',
          title: { en: 'Amenities', ru: 'Удобства' },
          fields: [
            { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: { en: 'Marina', ru: 'Марина' },
      groups: [{
        id: 'where',
        title: { en: 'Departure', ru: 'Отправление' },
        fields: [
          { key: 'departure_marina', label: { en: 'Marina', ru: 'Марина' }, type: 'address', required: true, path: 'attributes.departure_marina' },
          { key: 'routes', label: { en: 'Routes', ru: 'Маршруты' }, type: 'multiselect', options: ROUTES, path: 'attributes.routes' },
        ],
      }],
    },
    {
      id: 'media',
      title: { en: 'Media', ru: 'Медиа' },
      groups: [{
        id: 'media',
        title: { en: 'Photos', ru: 'Фото' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image' },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery' },
          { key: 'video_url', label: { en: 'Video', ru: 'Видео' }, type: 'video_url', path: 'attributes.video_url' },
        ],
      }],
    },
    {
      id: 'pricing',
      title: { en: 'Pricing', ru: 'Цены' },
      groups: [{
        id: 'price',
        title: { en: 'Price (THB)', ru: 'Цена (THB)' },
        fields: [
          { key: 'price_half_day', label: { en: 'Half-day', ru: 'Полдня' }, type: 'currency_thb', path: 'attributes.price_half_day' },
          { key: 'price_full_day', label: { en: 'Full day', ru: 'Полный день' }, type: 'currency_thb', required: true, path: 'attributes.price_full_day' },
          { key: 'price_overnight', label: { en: 'Per night', ru: 'За ночь' }, type: 'currency_thb', path: 'attributes.price_overnight' },
          { key: 'includes', label: { en: 'Included', ru: 'Включено' }, type: 'multiselect', options: TRIP_INCLUDES, path: 'attributes.includes' },
        ],
      }],
    },
    {
      id: 'booking',
      title: { en: 'Booking', ru: 'Бронирование' },
      groups: [{
        id: 'rules',
        title: { en: 'Rules', ru: 'Правила' },
        fields: [
          { key: 'charter_types', label: { en: 'Charter types', ru: 'Типы чартера' }, type: 'multiselect', options: CHARTER_TYPES, required: true, path: 'attributes.charter_types' },
          { key: 'min_hours', label: { en: 'Min hours', ru: 'Мин. часов' }, type: 'number', min: 1, path: 'attributes.min_hours' },
          { key: 'cancellation_hours', label: { en: 'Free cancellation (hours before)', ru: 'Бесп. отмена (часов до)' }, type: 'number', min: 0, path: 'attributes.cancellation_hours' },
        ],
      }],
    },
    {
      id: 'compliance',
      title: { en: 'Compliance', ru: 'Документы' },
      groups: [{
        id: 'docs',
        title: { en: 'Licenses & safety', ru: 'Лицензии и безопасность' },
        fields: [
          { key: 'marine_license', label: { en: 'Marine license', ru: 'Морская лицензия' }, type: 'license_upload', required: true, path: 'attributes.licenses.marine' },
          { key: 'insurance', label: { en: 'Insurance', ru: 'Страховка' }, type: 'license_upload', required: true, path: 'attributes.licenses.insurance' },
          { key: 'life_jackets', label: { en: 'Life jackets', ru: 'Спасжилеты' }, type: 'boolean', path: 'attributes.safety.life_jackets' },
          { key: 'first_aid', label: { en: 'First aid', ru: 'Аптечка' }, type: 'boolean', path: 'attributes.safety.first_aid' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'boat_type', label: { en: 'Boat type', ru: 'Тип' }, type: 'enum', options: BOAT_TYPES, queryHint: { column: 'attributes', jsonbPath: 'boat_type', operator: 'in' } },
    { key: 'charter_type', label: { en: 'Charter', ru: 'Чартер' }, type: 'enum', options: CHARTER_TYPES, queryHint: { column: 'attributes', jsonbPath: 'charter_types', operator: 'contains' } },
    { key: 'guests', label: { en: 'Guests', ru: 'Гостей' }, type: 'range', min: 1, max: 50, step: 1 },
    { key: 'routes', label: { en: 'Routes', ru: 'Маршруты' }, type: 'enum', options: ROUTES, queryHint: { column: 'attributes', jsonbPath: 'routes', operator: 'contains' } },
    { key: 'price', label: { en: 'Price/day', ru: 'Цена/день' }, type: 'range', min: 0, max: 500000, step: 1000, unit: '฿' },
    { key: 'date', label: { en: 'Date', ru: 'Дата' }, type: 'daterange' },
    { key: 'sort', label: { en: 'Sort', ru: 'Сортировка' }, type: 'sort', options: [
      { value: 'relevance', label: { en: 'Relevance', ru: 'Релевантность' } },
      { value: 'price_asc', label: { en: 'Price ↑', ru: 'Цена ↑' } },
      { value: 'price_desc', label: { en: 'Price ↓', ru: 'Цена ↓' } },
      { value: 'guests', label: { en: 'Capacity', ru: 'Вместимость' } },
    ]},
  ],

  detail: [
    { id: 'hero', render: 'hero' },
    { id: 'gallery', render: 'gallery' },
    { id: 'description', render: 'description' },
    { id: 'amenities', render: 'amenities' },
    { id: 'pricing', render: 'pricing' },
    { id: 'map', render: 'map' },
    { id: 'policies', render: 'policies' },
    { id: 'cta', render: 'cta' },
  ],

  quality: [
    { id: 'title', label: { en: 'Title in RU + EN', ru: 'Заголовок RU + EN' }, weight: 8, check: { kind: 'field_i18n_complete', path: 'attributes.title' } },
    { id: 'description', label: { en: 'Description in RU + EN', ru: 'Описание RU + EN' }, weight: 10, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'boat_type', label: { en: 'Boat type', ru: 'Тип судна' }, weight: 5, check: { kind: 'has_value', path: 'attributes.boat_type' } },
    { id: 'length', label: { en: 'Length (m)', ru: 'Длина (м)' }, weight: 4, check: { kind: 'has_value', path: 'attributes.length_m' } },
    { id: 'guests', label: { en: 'Capacity set', ru: 'Вместимость' }, weight: 4, check: { kind: 'has_value', path: 'attributes.guests_max' } },
    { id: 'charter', label: { en: 'Charter type', ru: 'Тип чартера' }, weight: 5, check: { kind: 'array_min', path: 'attributes.charter_types', min: 1 } },
    { id: 'marina', label: { en: 'Departure marina', ru: 'Марина' }, weight: 5, check: { kind: 'has_value', path: 'attributes.departure_marina.line' } },
    { id: 'price', label: { en: 'Full-day price', ru: 'Цена за день' }, weight: 5, check: { kind: 'has_value', path: 'attributes.price_full_day' } },
    { id: 'includes', label: { en: 'Inclusions set', ru: 'Что включено' }, weight: 5, check: { kind: 'array_min', path: 'attributes.includes', min: 1 } },
    { id: 'amenities', label: { en: '4+ amenities', ru: '≥4 удобств' }, weight: 8, check: { kind: 'array_min', path: 'attributes.amenities', min: 4 } },
    { id: 'routes', label: { en: 'Routes', ru: 'Маршруты' }, weight: 5, check: { kind: 'array_min', path: 'attributes.routes', min: 1 } },
    { id: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, weight: 5, check: { kind: 'has_value', path: 'cover_image' } },
    { id: 'gallery_6', label: { en: '6+ photos', ru: '≥6 фото' }, weight: 12, check: { kind: 'media_min', path: 'gallery', min: 6 } },
    { id: 'manufacturer', label: { en: 'Manufacturer', ru: 'Производитель' }, weight: 3, check: { kind: 'has_value', path: 'attributes.manufacturer' } },
    { id: 'marine_license', label: { en: 'Marine license', ru: 'Морская лицензия' }, weight: 5, check: { kind: 'has_value', path: 'attributes.licenses.marine' } },
    { id: 'insurance', label: { en: 'Insurance', ru: 'Страховка' }, weight: 5, check: { kind: 'has_value', path: 'attributes.licenses.insurance' } },
    { id: 'safety', label: { en: 'Life jackets', ru: 'Спасжилеты' }, weight: 6, check: { kind: 'has_value', path: 'attributes.safety.life_jackets' } },
  ],
};
