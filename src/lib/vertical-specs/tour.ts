/**
 * Tours & Experiences vertical spec.
 * Storage: public.listings WHERE vertical='tour'.
 * Best-practice references: GetYourGuide, Viator, Klook, Airbnb Experiences.
 */
import type { VerticalSpec, FieldOption } from './types';

const TOUR_CATEGORIES: FieldOption[] = [
  { value: 'island_hopping', label: { en: 'Island hopping', ru: 'Острова' } },
  { value: 'sightseeing', label: { en: 'Sightseeing', ru: 'Достопримечательности' } },
  { value: 'cultural', label: { en: 'Cultural', ru: 'Культура' } },
  { value: 'adventure', label: { en: 'Adventure', ru: 'Приключения' } },
  { value: 'food', label: { en: 'Food & culinary', ru: 'Гастрономия' } },
  { value: 'wildlife', label: { en: 'Wildlife', ru: 'Природа и фауна' } },
  { value: 'water', label: { en: 'Water activities', ru: 'Водные активности' } },
  { value: 'wellness', label: { en: 'Wellness retreat', ru: 'Ретрит' } },
  { value: 'family', label: { en: 'Family', ru: 'Семейные' } },
  { value: 'nightlife', label: { en: 'Nightlife', ru: 'Ночная жизнь' } },
];

const DURATION_TYPES: FieldOption[] = [
  { value: 'half_day', label: { en: 'Half-day (<4h)', ru: 'Полдня (<4ч)' } },
  { value: 'full_day', label: { en: 'Full day (4–8h)', ru: 'Полный день (4–8ч)' } },
  { value: 'multi_day', label: { en: 'Multi-day', ru: 'Несколько дней' } },
  { value: 'hourly', label: { en: 'Hourly', ru: 'Почасово' } },
];

const GROUP_TYPES: FieldOption[] = [
  { value: 'private', label: { en: 'Private', ru: 'Приватный' } },
  { value: 'small_group', label: { en: 'Small group (<10)', ru: 'Малая группа (<10)' } },
  { value: 'group', label: { en: 'Group', ru: 'Групповой' } },
];

const INCLUSIONS: FieldOption[] = [
  { value: 'pickup', label: { en: 'Hotel pickup', ru: 'Трансфер из отеля' } },
  { value: 'transport', label: { en: 'Transport', ru: 'Транспорт' } },
  { value: 'guide', label: { en: 'Professional guide', ru: 'Гид' } },
  { value: 'lunch', label: { en: 'Lunch', ru: 'Обед' } },
  { value: 'snacks', label: { en: 'Snacks', ru: 'Перекус' } },
  { value: 'drinks', label: { en: 'Drinks', ru: 'Напитки' } },
  { value: 'tickets', label: { en: 'Entrance tickets', ru: 'Входные билеты' } },
  { value: 'equipment', label: { en: 'Equipment', ru: 'Снаряжение' } },
  { value: 'insurance', label: { en: 'Insurance', ru: 'Страховка' } },
  { value: 'photos', label: { en: 'Photos', ru: 'Фото' } },
];

const LANGUAGES: FieldOption[] = [
  { value: 'th', label: { en: 'Thai', ru: 'Тайский' } },
  { value: 'en', label: { en: 'English', ru: 'Английский' } },
  { value: 'ru', label: { en: 'Russian', ru: 'Русский' } },
  { value: 'zh', label: { en: 'Chinese', ru: 'Китайский' } },
  { value: 'de', label: { en: 'German', ru: 'Немецкий' } },
];

const ACCESSIBILITY: FieldOption[] = [
  { value: 'wheelchair', label: { en: 'Wheelchair accessible', ru: 'Доступ для колясок' } },
  { value: 'kids', label: { en: 'Kid friendly', ru: 'Для детей' } },
  { value: 'pets', label: { en: 'Pet friendly', ru: 'Для животных' } },
  { value: 'pregnancy', label: { en: 'Pregnancy safe', ru: 'Для беременных' } },
];

export const tourSpec: VerticalSpec = {
  id: 'tour',
  label: { en: 'Tours & Experiences', ru: 'Туры и экскурсии' },
  storage: { kind: 'listings_vertical', vertical: 'tour' },
  surface: 'live',
  icon: 'Map',
  references: ['GetYourGuide', 'Viator', 'Klook', 'Airbnb Experiences'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'basics', title: { en: 'About the tour', ru: 'О туре' }, mapsToTab: 'basics',
      groups: [{
        id: 'c', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Tour title (RU + EN)', ru: 'Название тура (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
          { key: 'categories', label: { en: 'Categories', ru: 'Категории' }, type: 'multiselect', options: TOUR_CATEGORIES, required: true, path: 'attributes.categories', qualityWeight: 6 },
          { key: 'duration_type', label: { en: 'Duration type', ru: 'Длительность' }, type: 'select', options: DURATION_TYPES, required: true, path: 'attributes.duration_type', qualityWeight: 4 },
          { key: 'duration_hours', label: { en: 'Duration (hours)', ru: 'Длительность (часы)' }, type: 'number', min: 0.5, step: 0.5, required: true, path: 'attributes.duration_hours', qualityWeight: 4 },
          { key: 'languages', label: { en: 'Guide languages', ru: 'Языки гида' }, type: 'multiselect', options: LANGUAGES, required: true, path: 'attributes.languages', qualityWeight: 4 },
        ],
      }],
    },
    {
      id: 'group', title: { en: 'Group & guests', ru: 'Группа и гости' }, mapsToTab: 'details',
      groups: [{
        id: 'g', title: { en: 'Capacity', ru: 'Вместимость' },
        fields: [
          { key: 'group_type', label: { en: 'Group type', ru: 'Тип группы' }, type: 'select', options: GROUP_TYPES, required: true, path: 'attributes.group_type', qualityWeight: 4 },
          { key: 'group_min', label: { en: 'Min guests', ru: 'Мин. гостей' }, type: 'number', min: 1, path: 'attributes.group_min' },
          { key: 'group_max', label: { en: 'Max guests', ru: 'Макс. гостей' }, type: 'number', min: 1, required: true, path: 'attributes.group_max', qualityWeight: 4 },
          { key: 'min_age', label: { en: 'Min age', ru: 'Мин. возраст' }, type: 'number', min: 0, path: 'attributes.min_age' },
          { key: 'accessibility', label: { en: 'Accessibility', ru: 'Доступность' }, type: 'multiselect', options: ACCESSIBILITY, path: 'attributes.accessibility', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'meeting', title: { en: 'Meeting point', ru: 'Точка встречи' }, mapsToTab: 'location',
      groups: [{
        id: 'm', title: { en: 'Where & when', ru: 'Где и когда' },
        fields: [
          { key: 'meeting_point', label: { en: 'Meeting point', ru: 'Точка сбора' }, type: 'address', required: true, path: 'address', qualityWeight: 6 },
          { key: 'start_times', label: { en: 'Start times (e.g. 08:00, 13:00)', ru: 'Время начала (напр. 08:00, 13:00)' }, type: 'tags', required: true, path: 'attributes.start_times', qualityWeight: 4 },
          { key: 'pickup_included', label: { en: 'Pickup included', ru: 'Трансфер включён' }, type: 'boolean', path: 'attributes.pickup_included' },
        ],
      }],
    },
    {
      id: 'inclusions', title: { en: 'What\'s included', ru: 'Что включено' }, mapsToTab: 'details',
      groups: [{
        id: 'in', title: { en: 'Included / not included', ru: 'Включено / не включено' },
        fields: [
          { key: 'includes', label: { en: 'Includes', ru: 'Включено' }, type: 'multiselect', options: INCLUSIONS, required: true, path: 'attributes.includes', qualityWeight: 8 },
          { key: 'excludes', label: { en: 'Not included (free text)', ru: 'Не включено (текст)' }, type: 'i18n_textarea', path: 'attributes.excludes' },
          { key: 'what_to_bring', label: { en: 'What to bring', ru: 'Что взять с собой' }, type: 'i18n_textarea', path: 'attributes.what_to_bring' },
        ],
      }],
    },
    {
      id: 'pricing', title: { en: 'Pricing', ru: 'Цены' }, mapsToTab: 'pricing',
      groups: [{
        id: 'p', title: { en: 'Per-person (THB)', ru: 'С человека (THB)' },
        fields: [
          { key: 'price_adult', label: { en: 'Adult', ru: 'Взрослый' }, type: 'currency_thb', required: true, path: 'price', qualityWeight: 5 },
          { key: 'price_child', label: { en: 'Child', ru: 'Детский' }, type: 'currency_thb', path: 'attributes.price_child' },
          { key: 'price_private', label: { en: 'Private group total', ru: 'Приватная группа целиком' }, type: 'currency_thb', path: 'attributes.price_private' },
          { key: 'cancellation_hours', label: { en: 'Free cancellation (hours before)', ru: 'Беспл. отмена (часов до)' }, type: 'number', min: 0, path: 'attributes.cancellation_hours', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'media', title: { en: 'Photos', ru: 'Фото' }, mapsToTab: 'media',
      groups: [{
        id: 'm', title: { en: 'Media (min 6 photos)', ru: 'Медиа (мин. 6 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 12 },
        ],
      }],
    },
    {
      id: 'description', title: { en: 'Description', ru: 'Описание' }, mapsToTab: 'basics',
      groups: [{
        id: 'd', title: { en: 'Tell the story', ru: 'Расскажите историю' },
        fields: [
          { key: 'highlights', label: { en: 'Highlights (RU + EN)', ru: 'Изюминки (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.highlights', qualityWeight: 5 },
          { key: 'description', label: { en: 'Full description (RU + EN)', ru: 'Полное описание (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.description', qualityWeight: 9 },
          { key: 'itinerary', label: { en: 'Itinerary (RU + EN)', ru: 'Маршрут (RU + EN)' }, type: 'i18n_textarea', path: 'attributes.itinerary', qualityWeight: 5 },
        ],
      }],
    },
  ],

  editorTabs: [
    {
      id: 'basics', title: { en: 'Basics', ru: 'Основное' },
      groups: [{
        id: 'c', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Title', ru: 'Название' }, type: 'i18n_text', required: true, path: 'attributes.title' },
          { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
          { key: 'highlights', label: { en: 'Highlights', ru: 'Изюминки' }, type: 'i18n_textarea', path: 'attributes.highlights' },
          { key: 'itinerary', label: { en: 'Itinerary', ru: 'Маршрут' }, type: 'i18n_textarea', path: 'attributes.itinerary' },
          { key: 'categories', label: { en: 'Categories', ru: 'Категории' }, type: 'multiselect', options: TOUR_CATEGORIES, required: true, path: 'attributes.categories' },
          { key: 'languages', label: { en: 'Languages', ru: 'Языки' }, type: 'multiselect', options: LANGUAGES, required: true, path: 'attributes.languages' },
        ],
      }],
    },
    {
      id: 'details', title: { en: 'Duration & group', ru: 'Длительность и группа' },
      groups: [{
        id: 'd', title: { en: 'Details', ru: 'Детали' },
        fields: [
          { key: 'duration_type', label: { en: 'Duration type', ru: 'Длительность' }, type: 'select', options: DURATION_TYPES, required: true, path: 'attributes.duration_type' },
          { key: 'duration_hours', label: { en: 'Hours', ru: 'Часы' }, type: 'number', min: 0.5, step: 0.5, path: 'attributes.duration_hours' },
          { key: 'group_type', label: { en: 'Group', ru: 'Группа' }, type: 'select', options: GROUP_TYPES, required: true, path: 'attributes.group_type' },
          { key: 'group_min', label: { en: 'Min guests', ru: 'Мин.' }, type: 'number', path: 'attributes.group_min' },
          { key: 'group_max', label: { en: 'Max guests', ru: 'Макс.' }, type: 'number', path: 'attributes.group_max' },
          { key: 'min_age', label: { en: 'Min age', ru: 'Мин. возраст' }, type: 'number', path: 'attributes.min_age' },
          { key: 'accessibility', label: { en: 'Accessibility', ru: 'Доступность' }, type: 'multiselect', options: ACCESSIBILITY, path: 'attributes.accessibility' },
          { key: 'includes', label: { en: 'Includes', ru: 'Включено' }, type: 'multiselect', options: INCLUSIONS, path: 'attributes.includes' },
        ],
      }],
    },
    {
      id: 'location', title: { en: 'Meeting point', ru: 'Точка встречи' },
      groups: [{
        id: 'm', title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'meeting_point', label: { en: 'Meeting point', ru: 'Точка сбора' }, type: 'address', required: true, path: 'address' },
          { key: 'start_times', label: { en: 'Start times', ru: 'Время начала' }, type: 'tags', path: 'attributes.start_times' },
          { key: 'pickup_included', label: { en: 'Pickup included', ru: 'Трансфер включён' }, type: 'boolean', path: 'attributes.pickup_included' },
        ],
      }],
    },
    {
      id: 'media', title: { en: 'Media', ru: 'Медиа' },
      groups: [{
        id: 'm', title: { en: 'Photos', ru: 'Фото' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image' },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery' },
        ],
      }],
    },
    {
      id: 'pricing', title: { en: 'Pricing', ru: 'Цены' },
      groups: [{
        id: 'p', title: { en: 'Per-person (THB)', ru: 'С человека (THB)' },
        fields: [
          { key: 'price_adult', label: { en: 'Adult', ru: 'Взрослый' }, type: 'currency_thb', required: true, path: 'price' },
          { key: 'price_child', label: { en: 'Child', ru: 'Детский' }, type: 'currency_thb', path: 'attributes.price_child' },
          { key: 'price_private', label: { en: 'Private total', ru: 'Приватный целиком' }, type: 'currency_thb', path: 'attributes.price_private' },
          { key: 'cancellation_hours', label: { en: 'Free cancellation (hours before)', ru: 'Беспл. отмена (часов до)' }, type: 'number', path: 'attributes.cancellation_hours' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'categories', label: { en: 'Category', ru: 'Категория' }, type: 'enum', options: TOUR_CATEGORIES, queryHint: { column: 'attributes', jsonbPath: 'categories', operator: 'contains' } },
    { key: 'duration_type', label: { en: 'Duration', ru: 'Длительность' }, type: 'enum', options: DURATION_TYPES, queryHint: { column: 'attributes', jsonbPath: 'duration_type', operator: 'in' } },
    { key: 'group_type', label: { en: 'Group', ru: 'Группа' }, type: 'enum', options: GROUP_TYPES, queryHint: { column: 'attributes', jsonbPath: 'group_type', operator: 'in' } },
    { key: 'languages', label: { en: 'Language', ru: 'Язык' }, type: 'enum', options: LANGUAGES, queryHint: { column: 'attributes', jsonbPath: 'languages', operator: 'contains' } },
    { key: 'includes', label: { en: 'Includes', ru: 'Включает' }, type: 'enum', options: INCLUSIONS, queryHint: { column: 'attributes', jsonbPath: 'includes', operator: 'contains' } },
    { key: 'accessibility', label: { en: 'Accessibility', ru: 'Доступность' }, type: 'enum', options: ACCESSIBILITY, queryHint: { column: 'attributes', jsonbPath: 'accessibility', operator: 'contains' } },
    { key: 'price', label: { en: 'Price/person', ru: 'Цена/чел' }, type: 'range', min: 0, max: 50000, step: 100, unit: '฿', queryHint: { column: 'price', operator: 'between' } },
    { key: 'date', label: { en: 'Date', ru: 'Дата' }, type: 'daterange' },
    { key: 'sort', label: { en: 'Sort', ru: 'Сортировка' }, type: 'sort', options: [
      { value: 'relevance', label: { en: 'Relevance', ru: 'Релевантность' } },
      { value: 'rating', label: { en: 'Top rated', ru: 'По рейтингу' } },
      { value: 'price_asc', label: { en: 'Price ↑', ru: 'Цена ↑' } },
      { value: 'price_desc', label: { en: 'Price ↓', ru: 'Цена ↓' } },
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
    { id: 'reviews', render: 'reviews' },
    { id: 'cta', render: 'cta' },
  ],

  quality: [
    { id: 'name', label: { en: 'Title RU + EN', ru: 'Название RU + EN' }, weight: 8, check: { kind: 'field_i18n_complete', path: 'attributes.title' } },
    { id: 'description', label: { en: 'Description RU + EN', ru: 'Описание RU + EN' }, weight: 10, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'highlights', label: { en: 'Highlights', ru: 'Изюминки' }, weight: 5, check: { kind: 'field_i18n_complete', path: 'attributes.highlights' } },
    { id: 'itinerary', label: { en: 'Itinerary', ru: 'Маршрут' }, weight: 5, check: { kind: 'field_i18n_complete', path: 'attributes.itinerary' } },
    { id: 'categories', label: { en: 'Categories', ru: 'Категории' }, weight: 6, check: { kind: 'array_min', path: 'attributes.categories', min: 1 } },
    { id: 'duration', label: { en: 'Duration', ru: 'Длительность' }, weight: 4, check: { kind: 'has_value', path: 'attributes.duration_type' } },
    { id: 'group', label: { en: 'Group type', ru: 'Тип группы' }, weight: 4, check: { kind: 'has_value', path: 'attributes.group_type' } },
    { id: 'languages', label: { en: 'Guide languages', ru: 'Языки гида' }, weight: 4, check: { kind: 'array_min', path: 'attributes.languages', min: 1 } },
    { id: 'meeting', label: { en: 'Meeting point', ru: 'Точка встречи' }, weight: 6, check: { kind: 'field_present', path: 'address' } },
    { id: 'start_times', label: { en: 'Start times', ru: 'Время начала' }, weight: 4, check: { kind: 'array_min', path: 'attributes.start_times', min: 1 } },
    { id: 'includes', label: { en: 'Inclusions', ru: 'Что включено' }, weight: 8, check: { kind: 'array_min', path: 'attributes.includes', min: 1 } },
    { id: 'price', label: { en: 'Price', ru: 'Цена' }, weight: 5, check: { kind: 'field_present', path: 'price' } },
    { id: 'cancellation', label: { en: 'Cancellation policy', ru: 'Отмена' }, weight: 3, check: { kind: 'field_present', path: 'attributes.cancellation_hours' } },
    { id: 'cover', label: { en: 'Cover', ru: 'Обложка' }, weight: 6, check: { kind: 'field_present', path: 'cover_image' } },
    { id: 'gallery', label: { en: '6+ photos', ru: '6+ фото' }, weight: 14, check: { kind: 'media_min', path: 'gallery', min: 6 } },
    { id: 'accessibility', label: { en: 'Accessibility info', ru: 'Доступность' }, weight: 3, check: { kind: 'array_min', path: 'attributes.accessibility', min: 1 } },
    { id: 'pickup', label: { en: 'Pickup info', ru: 'Трансфер' }, weight: 3, check: { kind: 'has_value', path: 'attributes.pickup_included' } },
  ],
};
