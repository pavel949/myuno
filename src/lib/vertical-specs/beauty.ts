/**
 * Beauty / Salons vertical spec.
 * Storage: public.listings WHERE vertical='beauty'.
 * Best-practice references: Treatwell, Fresha, Booksy, Vagaro.
 */
import type { VerticalSpec, FieldOption } from './types';

const SALON_TYPES: FieldOption[] = [
  { value: 'beauty_salon', label: { en: 'Beauty salon', ru: 'Салон красоты' } },
  { value: 'spa', label: { en: 'Spa', ru: 'СПА' } },
  { value: 'nail_studio', label: { en: 'Nail studio', ru: 'Ногтевая студия' } },
  { value: 'barbershop', label: { en: 'Barbershop', ru: 'Барбершоп' } },
  { value: 'massage', label: { en: 'Massage', ru: 'Массаж' } },
  { value: 'wellness', label: { en: 'Wellness', ru: 'Веллнес' } },
];

const SERVICE_CATEGORIES: FieldOption[] = [
  { value: 'hair', label: { en: 'Hair', ru: 'Волосы' } },
  { value: 'nails', label: { en: 'Nails', ru: 'Ногти' } },
  { value: 'face', label: { en: 'Facial', ru: 'Лицо' } },
  { value: 'body', label: { en: 'Body', ru: 'Тело' } },
  { value: 'massage', label: { en: 'Massage', ru: 'Массаж' } },
  { value: 'makeup', label: { en: 'Makeup', ru: 'Макияж' } },
  { value: 'waxing', label: { en: 'Waxing', ru: 'Депиляция' } },
  { value: 'lashes', label: { en: 'Lashes', ru: 'Ресницы' } },
  { value: 'brows', label: { en: 'Brows', ru: 'Брови' } },
];

const AMENITIES: FieldOption[] = [
  { value: 'parking', label: { en: 'Parking', ru: 'Парковка' } },
  { value: 'wifi', label: { en: 'Wi-Fi', ru: 'Wi-Fi' } },
  { value: 'drinks', label: { en: 'Complimentary drinks', ru: 'Напитки' } },
  { value: 'ac', label: { en: 'Air conditioning', ru: 'Кондиционер' } },
  { value: 'kids_friendly', label: { en: 'Kids friendly', ru: 'Для детей' } },
  { value: 'accessible', label: { en: 'Wheelchair access', ru: 'Доступ для колясок' } },
  { value: 'online_booking', label: { en: 'Online booking', ru: 'Онлайн-запись' } },
  { value: 'cards', label: { en: 'Cards accepted', ru: 'Оплата картой' } },
];

const LANGUAGES: FieldOption[] = [
  { value: 'th', label: { en: 'Thai', ru: 'Тайский' } },
  { value: 'en', label: { en: 'English', ru: 'Английский' } },
  { value: 'ru', label: { en: 'Russian', ru: 'Русский' } },
  { value: 'zh', label: { en: 'Chinese', ru: 'Китайский' } },
];

export const beautySpec: VerticalSpec = {
  id: 'beauty',
  label: { en: 'Beauty & Salons', ru: 'Красота и салоны' },
  storage: { kind: 'listings_vertical', vertical: 'beauty' },
  surface: 'live',
  icon: 'Scissors',
  references: ['Treatwell', 'Fresha', 'Booksy', 'Vagaro'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'basics', title: { en: 'About the venue', ru: 'О заведении' }, mapsToTab: 'basics',
      groups: [{
        id: 'core', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Salon name (RU + EN)', ru: 'Название (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
          { key: 'salon_type', label: { en: 'Venue type', ru: 'Тип заведения' }, type: 'select', options: SALON_TYPES, required: true, path: 'attributes.salon_type', qualityWeight: 5 },
          { key: 'service_categories', label: { en: 'Service categories', ru: 'Категории услуг' }, type: 'multiselect', options: SERVICE_CATEGORIES, required: true, path: 'attributes.service_categories', qualityWeight: 6 },
          { key: 'languages', label: { en: 'Staff languages', ru: 'Языки персонала' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages', qualityWeight: 3 },
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
      id: 'menu', title: { en: 'Service menu', ru: 'Прайс услуг' }, mapsToTab: 'pricing',
      groups: [{
        id: 'price', title: { en: 'Price range (THB)', ru: 'Диапазон цен (THB)' },
        fields: [
          { key: 'price_from', label: { en: 'Price from', ru: 'Цена от' }, type: 'currency_thb', required: true, path: 'price', qualityWeight: 5 },
          { key: 'price_to', label: { en: 'Price to', ru: 'Цена до' }, type: 'currency_thb', path: 'attributes.price_to' },
          { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities', qualityWeight: 5 },
        ],
      }],
    },
    {
      id: 'media', title: { en: 'Photos', ru: 'Фото' }, mapsToTab: 'media',
      groups: [{
        id: 'media', title: { en: 'Media (min 4 photos)', ru: 'Медиа (мин. 4 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 10 },
        ],
      }],
    },
    {
      id: 'description', title: { en: 'Description', ru: 'Описание' }, mapsToTab: 'basics',
      groups: [{
        id: 'desc', title: { en: 'Tell guests about you', ru: 'Расскажите гостям' },
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
        id: 'core', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Name', ru: 'Название' }, type: 'i18n_text', required: true, path: 'attributes.title' },
          { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
          { key: 'salon_type', label: { en: 'Type', ru: 'Тип' }, type: 'select', options: SALON_TYPES, required: true, path: 'attributes.salon_type' },
          { key: 'service_categories', label: { en: 'Services', ru: 'Услуги' }, type: 'multiselect', options: SERVICE_CATEGORIES, required: true, path: 'attributes.service_categories' },
          { key: 'languages', label: { en: 'Languages', ru: 'Языки' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages' },
        ],
      }],
    },
    {
      id: 'location', title: { en: 'Location', ru: 'Адрес' },
      groups: [{
        id: 'loc', title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'address' },
          { key: 'hours', label: { en: 'Hours', ru: 'Часы' }, type: 'hours', required: true, path: 'attributes.hours' },
          { key: 'phone', label: { en: 'Phone', ru: 'Телефон' }, type: 'phone', required: true, path: 'attributes.phone' },
          { key: 'whatsapp', label: { en: 'WhatsApp', ru: 'WhatsApp' }, type: 'phone', path: 'attributes.whatsapp' },
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
      id: 'pricing', title: { en: 'Pricing & amenities', ru: 'Цены и удобства' },
      groups: [{
        id: 'p', title: { en: 'Range', ru: 'Диапазон' },
        fields: [
          { key: 'price_from', label: { en: 'Price from', ru: 'Цена от' }, type: 'currency_thb', required: true, path: 'price' },
          { key: 'price_to', label: { en: 'Price to', ru: 'Цена до' }, type: 'currency_thb', path: 'attributes.price_to' },
          { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'salon_type', label: { en: 'Type', ru: 'Тип' }, type: 'enum', options: SALON_TYPES, queryHint: { column: 'attributes', jsonbPath: 'salon_type', operator: 'in' } },
    { key: 'services', label: { en: 'Services', ru: 'Услуги' }, type: 'enum', options: SERVICE_CATEGORIES, queryHint: { column: 'attributes', jsonbPath: 'service_categories', operator: 'contains' } },
    { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'enum', options: AMENITIES, queryHint: { column: 'attributes', jsonbPath: 'amenities', operator: 'contains' } },
    { key: 'languages', label: { en: 'Language', ru: 'Язык' }, type: 'enum', options: LANGUAGES, queryHint: { column: 'attributes', jsonbPath: 'languages', operator: 'contains' } },
    { key: 'price', label: { en: 'Price', ru: 'Цена' }, type: 'range', min: 0, max: 20000, step: 100, unit: '฿', queryHint: { column: 'price', operator: 'between' } },
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
    { id: 'name', label: { en: 'Name in RU + EN', ru: 'Название RU + EN' }, weight: 8, check: { kind: 'field_i18n_complete', path: 'attributes.title' } },
    { id: 'description', label: { en: 'Description in RU + EN', ru: 'Описание RU + EN' }, weight: 14, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'type', label: { en: 'Venue type', ru: 'Тип заведения' }, weight: 6, check: { kind: 'has_value', path: 'attributes.salon_type' } },
    { id: 'services', label: { en: 'Service categories', ru: 'Категории услуг' }, weight: 8, check: { kind: 'array_min', path: 'attributes.service_categories', min: 1 } },
    { id: 'amenities', label: { en: '3+ amenities', ru: '3+ удобства' }, weight: 8, check: { kind: 'array_min', path: 'attributes.amenities', min: 3 } },
    { id: 'address', label: { en: 'Address', ru: 'Адрес' }, weight: 8, check: { kind: 'field_present', path: 'address' } },
    { id: 'hours', label: { en: 'Hours', ru: 'Часы' }, weight: 8, check: { kind: 'has_value', path: 'attributes.hours' } },
    { id: 'phone', label: { en: 'Phone', ru: 'Телефон' }, weight: 4, check: { kind: 'field_present', path: 'attributes.phone' } },
    { id: 'price', label: { en: 'Starting price', ru: 'Цена от' }, weight: 6, check: { kind: 'field_present', path: 'price' } },
    { id: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, weight: 8, check: { kind: 'field_present', path: 'cover_image' } },
    { id: 'gallery', label: { en: '4+ gallery photos', ru: '4+ фото' }, weight: 14, check: { kind: 'media_min', path: 'gallery', min: 4 } },
    { id: 'languages', label: { en: 'Staff languages', ru: 'Языки персонала' }, weight: 4, check: { kind: 'array_min', path: 'attributes.languages', min: 1 } },
    { id: 'whatsapp', label: { en: 'WhatsApp contact', ru: 'WhatsApp' }, weight: 4, check: { kind: 'field_present', path: 'attributes.whatsapp' } },
  ],
};
