/**
 * Fitness vertical spec (gyms, yoga, muay thai, crossfit, swimming, studios).
 * Storage: public.listings WHERE vertical='fitness'.
 * Best-practice references: ClassPass, MindBody, Glofox, Gympass.
 */
import type { VerticalSpec, FieldOption } from './types';

const GYM_TYPES: FieldOption[] = [
  { value: 'gym', label: { en: 'Gym', ru: 'Тренажёрный зал' } },
  { value: 'yoga', label: { en: 'Yoga studio', ru: 'Йога-студия' } },
  { value: 'muay_thai', label: { en: 'Muay Thai', ru: 'Муай Тай' } },
  { value: 'crossfit', label: { en: 'CrossFit box', ru: 'Кроссфит' } },
  { value: 'swimming', label: { en: 'Swimming pool', ru: 'Бассейн' } },
  { value: 'pilates', label: { en: 'Pilates', ru: 'Пилатес' } },
  { value: 'martial_arts', label: { en: 'Martial arts', ru: 'Единоборства' } },
  { value: 'dance', label: { en: 'Dance studio', ru: 'Танц-студия' } },
];

const FACILITIES: FieldOption[] = [
  { value: 'free_weights', label: { en: 'Free weights', ru: 'Свободные веса' } },
  { value: 'machines', label: { en: 'Cardio machines', ru: 'Кардио' } },
  { value: 'functional', label: { en: 'Functional area', ru: 'Функционал' } },
  { value: 'sauna', label: { en: 'Sauna', ru: 'Сауна' } },
  { value: 'steam', label: { en: 'Steam room', ru: 'Парная' } },
  { value: 'pool', label: { en: 'Pool', ru: 'Бассейн' } },
  { value: 'showers', label: { en: 'Showers', ru: 'Душевые' } },
  { value: 'lockers', label: { en: 'Lockers', ru: 'Шкафчики' } },
  { value: 'towel', label: { en: 'Towel service', ru: 'Полотенца' } },
  { value: 'pt', label: { en: 'Personal trainers', ru: 'Персональные тренеры' } },
  { value: 'group_classes', label: { en: 'Group classes', ru: 'Групповые занятия' } },
  { value: 'kids_area', label: { en: 'Kids area', ru: 'Детская зона' } },
];

const LEVELS: FieldOption[] = [
  { value: 'beginner', label: { en: 'Beginner', ru: 'Новичок' } },
  { value: 'intermediate', label: { en: 'Intermediate', ru: 'Средний' } },
  { value: 'advanced', label: { en: 'Advanced', ru: 'Продвинутый' } },
  { value: 'professional', label: { en: 'Professional', ru: 'Профи' } },
];

const LANGUAGES: FieldOption[] = [
  { value: 'th', label: { en: 'Thai', ru: 'Тайский' } },
  { value: 'en', label: { en: 'English', ru: 'Английский' } },
  { value: 'ru', label: { en: 'Russian', ru: 'Русский' } },
];

export const fitnessSpec: VerticalSpec = {
  id: 'fitness',
  label: { en: 'Fitness & Sports', ru: 'Фитнес и спорт' },
  storage: { kind: 'listings_vertical', vertical: 'fitness' },
  surface: 'live',
  icon: 'Dumbbell',
  references: ['ClassPass', 'MindBody', 'Glofox', 'Gympass'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'basics', title: { en: 'About the venue', ru: 'О заведении' }, mapsToTab: 'basics',
      groups: [{
        id: 'core', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Name (RU + EN)', ru: 'Название (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
          { key: 'gym_type', label: { en: 'Type', ru: 'Тип' }, type: 'select', options: GYM_TYPES, required: true, path: 'attributes.gym_type', qualityWeight: 6 },
          { key: 'levels', label: { en: 'Skill levels', ru: 'Уровни подготовки' }, type: 'multiselect', options: LEVELS, path: 'attributes.levels', qualityWeight: 3 },
          { key: 'languages', label: { en: 'Coach languages', ru: 'Языки тренеров' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'location', title: { en: 'Location & hours', ru: 'Адрес и часы' }, mapsToTab: 'location',
      groups: [{
        id: 'loc', title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'address', qualityWeight: 6 },
          { key: 'hours', label: { en: 'Opening hours', ru: 'Часы работы' }, type: 'hours', required: true, path: 'attributes.hours', qualityWeight: 5 },
          { key: 'phone', label: { en: 'Phone', ru: 'Телефон' }, type: 'phone', required: true, path: 'attributes.phone', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'facilities', title: { en: 'Facilities', ru: 'Оснащение' }, mapsToTab: 'details',
      groups: [{
        id: 'fac', title: { en: 'On-site', ru: 'Что есть на объекте' },
        fields: [
          { key: 'facilities', label: { en: 'Facilities', ru: 'Оснащение' }, type: 'multiselect', options: FACILITIES, required: true, path: 'attributes.facilities', qualityWeight: 10 },
          { key: 'area_sqm', label: { en: 'Floor area (m²)', ru: 'Площадь (м²)' }, type: 'number', min: 10, path: 'attributes.area_sqm' },
        ],
      }],
    },
    {
      id: 'pricing', title: { en: 'Pricing', ru: 'Цены' }, mapsToTab: 'pricing',
      groups: [{
        id: 'price', title: { en: 'Passes (THB)', ru: 'Абонементы (THB)' },
        fields: [
          { key: 'price_day_pass', label: { en: 'Day pass', ru: 'Дневной' }, type: 'currency_thb', required: true, path: 'price', qualityWeight: 5 },
          { key: 'price_class', label: { en: 'Single class', ru: 'Одно занятие' }, type: 'currency_thb', path: 'attributes.price_class' },
          { key: 'price_month_pass', label: { en: 'Monthly', ru: 'Месяц' }, type: 'currency_thb', path: 'attributes.price_month_pass', qualityWeight: 3 },
          { key: 'price_pt', label: { en: 'Personal training', ru: 'Персоналка' }, type: 'currency_thb', path: 'attributes.price_pt' },
        ],
      }],
    },
    {
      id: 'media', title: { en: 'Photos', ru: 'Фото' }, mapsToTab: 'media',
      groups: [{
        id: 'm', title: { en: 'Media (min 5 photos)', ru: 'Медиа (мин. 5 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 12 },
        ],
      }],
    },
    {
      id: 'description', title: { en: 'Description', ru: 'Описание' }, mapsToTab: 'basics',
      groups: [{
        id: 'd', title: { en: 'About', ru: 'О заведении' },
        fields: [
          { key: 'description', label: { en: 'Full description (RU + EN)', ru: 'Полное описание (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.description', qualityWeight: 10 },
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
          { key: 'title', label: { en: 'Name', ru: 'Название' }, type: 'i18n_text', required: true, path: 'attributes.title' },
          { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
          { key: 'gym_type', label: { en: 'Type', ru: 'Тип' }, type: 'select', options: GYM_TYPES, required: true, path: 'attributes.gym_type' },
          { key: 'levels', label: { en: 'Levels', ru: 'Уровни' }, type: 'multiselect', options: LEVELS, path: 'attributes.levels' },
          { key: 'languages', label: { en: 'Languages', ru: 'Языки' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages' },
        ],
      }],
    },
    {
      id: 'location', title: { en: 'Location', ru: 'Адрес' },
      groups: [{
        id: 'l', title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'address' },
          { key: 'hours', label: { en: 'Hours', ru: 'Часы' }, type: 'hours', required: true, path: 'attributes.hours' },
          { key: 'phone', label: { en: 'Phone', ru: 'Телефон' }, type: 'phone', required: true, path: 'attributes.phone' },
        ],
      }],
    },
    {
      id: 'details', title: { en: 'Facilities', ru: 'Оснащение' },
      groups: [{
        id: 'f', title: { en: 'On-site', ru: 'Что есть' },
        fields: [
          { key: 'facilities', label: { en: 'Facilities', ru: 'Оснащение' }, type: 'multiselect', options: FACILITIES, path: 'attributes.facilities' },
          { key: 'area_sqm', label: { en: 'Area (m²)', ru: 'Площадь (м²)' }, type: 'number', path: 'attributes.area_sqm' },
        ],
      }],
    },
    {
      id: 'pricing', title: { en: 'Pricing', ru: 'Цены' },
      groups: [{
        id: 'p', title: { en: 'Passes (THB)', ru: 'Абонементы (THB)' },
        fields: [
          { key: 'price_day_pass', label: { en: 'Day', ru: 'День' }, type: 'currency_thb', required: true, path: 'price' },
          { key: 'price_class', label: { en: 'Class', ru: 'Занятие' }, type: 'currency_thb', path: 'attributes.price_class' },
          { key: 'price_month_pass', label: { en: 'Month', ru: 'Месяц' }, type: 'currency_thb', path: 'attributes.price_month_pass' },
          { key: 'price_pt', label: { en: 'PT', ru: 'Персоналка' }, type: 'currency_thb', path: 'attributes.price_pt' },
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
  ],

  filters: [
    { key: 'gym_type', label: { en: 'Type', ru: 'Тип' }, type: 'enum', options: GYM_TYPES, queryHint: { column: 'attributes', jsonbPath: 'gym_type', operator: 'in' } },
    { key: 'facilities', label: { en: 'Facilities', ru: 'Оснащение' }, type: 'enum', options: FACILITIES, queryHint: { column: 'attributes', jsonbPath: 'facilities', operator: 'contains' } },
    { key: 'levels', label: { en: 'Level', ru: 'Уровень' }, type: 'enum', options: LEVELS, queryHint: { column: 'attributes', jsonbPath: 'levels', operator: 'contains' } },
    { key: 'languages', label: { en: 'Language', ru: 'Язык' }, type: 'enum', options: LANGUAGES, queryHint: { column: 'attributes', jsonbPath: 'languages', operator: 'contains' } },
    { key: 'price', label: { en: 'Day pass', ru: 'День' }, type: 'range', min: 0, max: 5000, step: 50, unit: '฿', queryHint: { column: 'price', operator: 'between' } },
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
    { id: 'hours', render: 'hours' },
    { id: 'pricing', render: 'pricing' },
    { id: 'map', render: 'map' },
    { id: 'reviews', render: 'reviews' },
    { id: 'cta', render: 'cta' },
  ],

  quality: [
    { id: 'name', label: { en: 'Name RU + EN', ru: 'Название RU + EN' }, weight: 8, check: { kind: 'field_i18n_complete', path: 'attributes.title' } },
    { id: 'description', label: { en: 'Description RU + EN', ru: 'Описание RU + EN' }, weight: 12, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'type', label: { en: 'Venue type', ru: 'Тип' }, weight: 6, check: { kind: 'has_value', path: 'attributes.gym_type' } },
    { id: 'facilities', label: { en: '5+ facilities', ru: '5+ оснащения' }, weight: 12, check: { kind: 'array_min', path: 'attributes.facilities', min: 5 } },
    { id: 'levels', label: { en: 'Levels listed', ru: 'Уровни указаны' }, weight: 4, check: { kind: 'array_min', path: 'attributes.levels', min: 1 } },
    { id: 'languages', label: { en: 'Coach languages', ru: 'Языки тренеров' }, weight: 4, check: { kind: 'array_min', path: 'attributes.languages', min: 1 } },
    { id: 'address', label: { en: 'Address', ru: 'Адрес' }, weight: 8, check: { kind: 'field_present', path: 'address' } },
    { id: 'hours', label: { en: 'Hours', ru: 'Часы' }, weight: 8, check: { kind: 'has_value', path: 'attributes.hours' } },
    { id: 'phone', label: { en: 'Phone', ru: 'Телефон' }, weight: 4, check: { kind: 'field_present', path: 'attributes.phone' } },
    { id: 'day_pass', label: { en: 'Day pass price', ru: 'Дневной абонемент' }, weight: 6, check: { kind: 'field_present', path: 'price' } },
    { id: 'month_pass', label: { en: 'Monthly price', ru: 'Месячный абонемент' }, weight: 4, check: { kind: 'field_present', path: 'attributes.price_month_pass' } },
    { id: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, weight: 6, check: { kind: 'field_present', path: 'cover_image' } },
    { id: 'gallery', label: { en: '5+ photos', ru: '5+ фото' }, weight: 18, check: { kind: 'media_min', path: 'gallery', min: 5 } },
  ],
};
