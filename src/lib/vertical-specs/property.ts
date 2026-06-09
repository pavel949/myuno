/**
 * Property (residential rental/sale) vertical spec.
 * Storage: public.listings WHERE vertical='property', JSONB in attributes.
 * Best-practice references: Idealista, Rightmove, Zillow, Airbnb.
 *
 * Note: the dedicated `properties` table (281 cols) remains the SSOT for PMS;
 * this spec is for marketplace listings, not PMS sync.
 */
import type { VerticalSpec, FieldOption } from './types';

const DEAL_TYPES: FieldOption[] = [
  { value: 'rent_short', label: { en: 'Short rent (daily)', ru: 'Краткосрочно (посуточно)' } },
  { value: 'rent_long', label: { en: 'Long rent (monthly)', ru: 'Долгосрочно (помесячно)' } },
  { value: 'sale', label: { en: 'For sale', ru: 'Продажа' } },
];

const PROPERTY_TYPES: FieldOption[] = [
  { value: 'apartment', label: { en: 'Apartment', ru: 'Апартаменты' } },
  { value: 'condo', label: { en: 'Condominium', ru: 'Кондоминиум' } },
  { value: 'villa', label: { en: 'Villa', ru: 'Вилла' } },
  { value: 'townhouse', label: { en: 'Townhouse', ru: 'Таунхаус' } },
  { value: 'studio', label: { en: 'Studio', ru: 'Студия' } },
  { value: 'penthouse', label: { en: 'Penthouse', ru: 'Пентхаус' } },
  { value: 'land', label: { en: 'Land plot', ru: 'Участок' } },
  { value: 'commercial', label: { en: 'Commercial', ru: 'Коммерческая' } },
];

const AMENITIES: FieldOption[] = [
  { value: 'pool_private', label: { en: 'Private pool', ru: 'Частный бассейн' } },
  { value: 'pool_shared', label: { en: 'Shared pool', ru: 'Общий бассейн' } },
  { value: 'sea_view', label: { en: 'Sea view', ru: 'Вид на море' } },
  { value: 'mountain_view', label: { en: 'Mountain view', ru: 'Вид на горы' } },
  { value: 'beachfront', label: { en: 'Beachfront', ru: 'У моря' } },
  { value: 'air_conditioning', label: { en: 'Air conditioning', ru: 'Кондиционер' } },
  { value: 'wifi', label: { en: 'Wi-Fi', ru: 'Wi-Fi' } },
  { value: 'parking', label: { en: 'Parking', ru: 'Парковка' } },
  { value: 'gym', label: { en: 'Gym', ru: 'Спортзал' } },
  { value: 'security_24h', label: { en: '24/7 security', ru: 'Охрана 24/7' } },
  { value: 'pet_friendly', label: { en: 'Pet-friendly', ru: 'С животными' } },
  { value: 'kids_friendly', label: { en: 'Kids-friendly', ru: 'Для детей' } },
  { value: 'washer', label: { en: 'Washing machine', ru: 'Стиральная машина' } },
  { value: 'kitchen_full', label: { en: 'Full kitchen', ru: 'Полная кухня' } },
  { value: 'workspace', label: { en: 'Workspace', ru: 'Рабочее место' } },
  { value: 'elevator', label: { en: 'Elevator', ru: 'Лифт' } },
];

const FURNISHING: FieldOption[] = [
  { value: 'furnished', label: { en: 'Fully furnished', ru: 'С мебелью' } },
  { value: 'semi', label: { en: 'Semi-furnished', ru: 'Частично' } },
  { value: 'unfurnished', label: { en: 'Unfurnished', ru: 'Без мебели' } },
];

const OWNERSHIP: FieldOption[] = [
  { value: 'freehold', label: { en: 'Freehold', ru: 'Freehold' } },
  { value: 'leasehold', label: { en: 'Leasehold (30y)', ru: 'Leasehold (30 лет)' } },
  { value: 'company', label: { en: 'Thai company', ru: 'Через тайскую компанию' } },
];

export const propertySpec: VerticalSpec = {
  id: 'property',
  label: { en: 'Property', ru: 'Недвижимость' },
  storage: { kind: 'listings_vertical', vertical: 'property' },
  surface: 'live',
  icon: 'Home',
  references: ['Idealista', 'Rightmove', 'Zillow', 'Airbnb'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'deal',
      title: { en: 'Deal type & property type', ru: 'Тип сделки и объекта' },
      mapsToTab: 'basics',
      groups: [{
        id: 'core',
        title: { en: 'Basics', ru: 'Основное' },
        fields: [
          { key: 'deal_type', label: { en: 'Deal type', ru: 'Тип сделки' }, type: 'select', options: DEAL_TYPES, required: true, path: 'attributes.deal_type', qualityWeight: 5 },
          { key: 'property_type', label: { en: 'Property type', ru: 'Тип объекта' }, type: 'select', options: PROPERTY_TYPES, required: true, path: 'attributes.property_type', qualityWeight: 5 },
          { key: 'title', label: { en: 'Title (RU + EN)', ru: 'Заголовок (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
        ],
      }],
    },
    {
      id: 'specs',
      title: { en: 'Layout & area', ru: 'Планировка и площадь' },
      mapsToTab: 'details',
      groups: [{
        id: 'layout',
        title: { en: 'Layout', ru: 'Планировка' },
        fields: [
          { key: 'bedrooms', label: { en: 'Bedrooms', ru: 'Спален' }, type: 'number', min: 0, required: true, path: 'attributes.bedrooms', qualityWeight: 4 },
          { key: 'bathrooms', label: { en: 'Bathrooms', ru: 'Ванных' }, type: 'number', min: 0, step: 0.5, required: true, path: 'attributes.bathrooms', qualityWeight: 4 },
          { key: 'area_sqm', label: { en: 'Indoor area (m²)', ru: 'Площадь (м²)' }, type: 'number', min: 5, required: true, path: 'attributes.area_sqm', qualityWeight: 4 },
          { key: 'land_sqm', label: { en: 'Land area (m²)', ru: 'Площадь участка (м²)' }, type: 'number', min: 0, path: 'attributes.land_sqm', showIf: { key: 'attributes.property_type', equals: 'villa' } },
          { key: 'floor', label: { en: 'Floor', ru: 'Этаж' }, type: 'number', min: 0, path: 'attributes.floor' },
          { key: 'furnishing', label: { en: 'Furnishing', ru: 'Меблировка' }, type: 'select', options: FURNISHING, path: 'attributes.furnishing', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'location',
      title: { en: 'Location', ru: 'Расположение' },
      mapsToTab: 'location',
      groups: [{
        id: 'where',
        title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'address', label: { en: 'Full address', ru: 'Полный адрес' }, type: 'address', required: true, path: 'attributes.address', qualityWeight: 8 },
        ],
      }],
    },
    {
      id: 'pricing',
      title: { en: 'Pricing', ru: 'Цены' },
      mapsToTab: 'pricing',
      groups: [{
        id: 'price',
        title: { en: 'Price (THB)', ru: 'Цена (THB)' },
        fields: [
          { key: 'price_daily', label: { en: 'Per night', ru: 'За ночь' }, type: 'currency_thb', path: 'attributes.price_daily', showIf: { key: 'attributes.deal_type', equals: 'rent_short' }, qualityWeight: 5 },
          { key: 'price_monthly', label: { en: 'Per month', ru: 'За месяц' }, type: 'currency_thb', path: 'attributes.price_monthly', showIf: { key: 'attributes.deal_type', equals: 'rent_long' }, qualityWeight: 5 },
          { key: 'price_sale', label: { en: 'Sale price', ru: 'Цена продажи' }, type: 'currency_thb', path: 'attributes.price_sale', showIf: { key: 'attributes.deal_type', equals: 'sale' }, qualityWeight: 5 },
          { key: 'deposit', label: { en: 'Deposit', ru: 'Депозит' }, type: 'currency_thb', path: 'attributes.deposit' },
          { key: 'ownership', label: { en: 'Ownership form', ru: 'Форма собственности' }, type: 'select', options: OWNERSHIP, path: 'attributes.ownership', showIf: { key: 'attributes.deal_type', equals: 'sale' } },
        ],
      }],
    },
    {
      id: 'amenities',
      title: { en: 'Amenities', ru: 'Удобства' },
      mapsToTab: 'details',
      groups: [{
        id: 'amen',
        title: { en: 'What this place offers', ru: 'Что есть в объекте' },
        fields: [
          { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities', qualityWeight: 10 },
        ],
      }],
    },
    {
      id: 'media',
      title: { en: 'Photos & video', ru: 'Фото и видео' },
      mapsToTab: 'media',
      groups: [{
        id: 'media',
        title: { en: 'Media (min 8 photos)', ru: 'Медиа (мин. 8 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 15 },
          { key: 'video_url', label: { en: 'Video tour URL', ru: 'Видеотур' }, type: 'video_url', path: 'attributes.video_url' },
          { key: 'floorplan', label: { en: 'Floor plan', ru: 'План этажа' }, type: 'media_single', path: 'attributes.floorplan', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'description',
      title: { en: 'Description', ru: 'Описание' },
      mapsToTab: 'basics',
      groups: [{
        id: 'desc',
        title: { en: 'Tell the story', ru: 'Расскажите об объекте' },
        fields: [
          { key: 'description', label: { en: 'Full description (RU + EN)', ru: 'Полное описание (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.description', qualityWeight: 10 },
        ],
      }],
    },
    {
      id: 'policies',
      title: { en: 'Policies', ru: 'Правила и политика' },
      mapsToTab: 'policies',
      groups: [{
        id: 'rules',
        title: { en: 'House rules', ru: 'Правила дома' },
        fields: [
          { key: 'min_stay', label: { en: 'Min stay (nights)', ru: 'Мин. срок (ночей)' }, type: 'number', min: 1, path: 'attributes.min_stay', showIf: { key: 'attributes.deal_type', equals: 'rent_short' } },
          { key: 'check_in', label: { en: 'Check-in time', ru: 'Заезд' }, type: 'text', path: 'attributes.check_in', placeholder: { en: '14:00', ru: '14:00' } },
          { key: 'check_out', label: { en: 'Check-out time', ru: 'Выезд' }, type: 'text', path: 'attributes.check_out', placeholder: { en: '11:00', ru: '11:00' } },
          { key: 'smoking', label: { en: 'Smoking allowed', ru: 'Можно курить' }, type: 'boolean', path: 'attributes.smoking' },
          { key: 'parties', label: { en: 'Parties allowed', ru: 'Можно вечеринки' }, type: 'boolean', path: 'attributes.parties' },
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
          { key: 'deal_type', label: { en: 'Deal type', ru: 'Тип сделки' }, type: 'select', options: DEAL_TYPES, required: true, path: 'attributes.deal_type' },
          { key: 'property_type', label: { en: 'Property type', ru: 'Тип' }, type: 'select', options: PROPERTY_TYPES, required: true, path: 'attributes.property_type' },
          { key: 'title', label: { en: 'Title', ru: 'Заголовок' }, type: 'i18n_text', required: true, path: 'attributes.title' },
          { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
        ],
      }],
    },
    {
      id: 'details',
      title: { en: 'Details', ru: 'Детали' },
      groups: [
        {
          id: 'layout',
          title: { en: 'Layout', ru: 'Планировка' },
          fields: [
            { key: 'bedrooms', label: { en: 'Bedrooms', ru: 'Спален' }, type: 'number', min: 0, required: true, path: 'attributes.bedrooms' },
            { key: 'bathrooms', label: { en: 'Bathrooms', ru: 'Ванных' }, type: 'number', min: 0, step: 0.5, required: true, path: 'attributes.bathrooms' },
            { key: 'area_sqm', label: { en: 'Indoor area (m²)', ru: 'Площадь (м²)' }, type: 'number', min: 5, required: true, path: 'attributes.area_sqm' },
            { key: 'land_sqm', label: { en: 'Land (m²)', ru: 'Участок (м²)' }, type: 'number', min: 0, path: 'attributes.land_sqm' },
            { key: 'floor', label: { en: 'Floor', ru: 'Этаж' }, type: 'number', path: 'attributes.floor' },
            { key: 'furnishing', label: { en: 'Furnishing', ru: 'Меблировка' }, type: 'select', options: FURNISHING, path: 'attributes.furnishing' },
          ],
        },
        {
          id: 'amenities',
          title: { en: 'Amenities', ru: 'Удобства' },
          fields: [
            { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'multiselect', options: AMENITIES, path: 'attributes.amenities' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: { en: 'Location', ru: 'Адрес' },
      groups: [{
        id: 'where',
        title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'attributes.address' },
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
          { key: 'floorplan', label: { en: 'Floor plan', ru: 'План' }, type: 'media_single', path: 'attributes.floorplan' },
          { key: 'video_url', label: { en: 'Video URL', ru: 'Видео' }, type: 'video_url', path: 'attributes.video_url' },
        ],
      }],
    },
    {
      id: 'pricing',
      title: { en: 'Pricing', ru: 'Цена' },
      groups: [{
        id: 'price',
        title: { en: 'Price (THB)', ru: 'Цена (THB)' },
        fields: [
          { key: 'price_daily', label: { en: 'Per night', ru: 'За ночь' }, type: 'currency_thb', path: 'attributes.price_daily' },
          { key: 'price_monthly', label: { en: 'Per month', ru: 'За месяц' }, type: 'currency_thb', path: 'attributes.price_monthly' },
          { key: 'price_sale', label: { en: 'Sale price', ru: 'Цена продажи' }, type: 'currency_thb', path: 'attributes.price_sale' },
          { key: 'deposit', label: { en: 'Deposit', ru: 'Депозит' }, type: 'currency_thb', path: 'attributes.deposit' },
          { key: 'ownership', label: { en: 'Ownership', ru: 'Собственность' }, type: 'select', options: OWNERSHIP, path: 'attributes.ownership' },
        ],
      }],
    },
    {
      id: 'policies',
      title: { en: 'Policies', ru: 'Правила' },
      groups: [{
        id: 'rules',
        title: { en: 'House rules', ru: 'Правила' },
        fields: [
          { key: 'min_stay', label: { en: 'Min stay', ru: 'Мин. срок' }, type: 'number', min: 1, path: 'attributes.min_stay' },
          { key: 'check_in', label: { en: 'Check-in', ru: 'Заезд' }, type: 'text', path: 'attributes.check_in' },
          { key: 'check_out', label: { en: 'Check-out', ru: 'Выезд' }, type: 'text', path: 'attributes.check_out' },
          { key: 'smoking', label: { en: 'Smoking', ru: 'Курение' }, type: 'boolean', path: 'attributes.smoking' },
          { key: 'parties', label: { en: 'Parties', ru: 'Вечеринки' }, type: 'boolean', path: 'attributes.parties' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'deal_type', label: { en: 'Deal type', ru: 'Тип сделки' }, type: 'enum', options: DEAL_TYPES, queryHint: { column: 'attributes', jsonbPath: 'deal_type', operator: 'eq' } },
    { key: 'property_type', label: { en: 'Type', ru: 'Тип' }, type: 'enum', options: PROPERTY_TYPES, queryHint: { column: 'attributes', jsonbPath: 'property_type', operator: 'in' } },
    { key: 'bedrooms', label: { en: 'Bedrooms', ru: 'Спален' }, type: 'range', min: 0, max: 10, step: 1, queryHint: { column: 'attributes', jsonbPath: 'bedrooms', operator: 'between' } },
    { key: 'price', label: { en: 'Price', ru: 'Цена' }, type: 'range', min: 0, max: 1000000, step: 1000, unit: '฿' },
    { key: 'area', label: { en: 'Area (m²)', ru: 'Площадь (м²)' }, type: 'range', min: 0, max: 1000, step: 10, unit: 'm²' },
    { key: 'amenities', label: { en: 'Amenities', ru: 'Удобства' }, type: 'enum', options: AMENITIES, queryHint: { column: 'attributes', jsonbPath: 'amenities', operator: 'contains' } },
    { key: 'distance', label: { en: 'Distance', ru: 'Расстояние' }, type: 'distance', min: 1, max: 50, step: 1, unit: 'km' },
    { key: 'sort', label: { en: 'Sort', ru: 'Сортировка' }, type: 'sort', options: [
      { value: 'relevance', label: { en: 'Relevance', ru: 'Релевантность' } },
      { value: 'price_asc', label: { en: 'Price ↑', ru: 'Цена ↑' } },
      { value: 'price_desc', label: { en: 'Price ↓', ru: 'Цена ↓' } },
      { value: 'newest', label: { en: 'Newest', ru: 'Сначала новые' } },
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
    { id: 'deal_type', label: { en: 'Deal type set', ru: 'Тип сделки' }, weight: 5, check: { kind: 'has_value', path: 'attributes.deal_type' } },
    { id: 'property_type', label: { en: 'Property type set', ru: 'Тип объекта' }, weight: 5, check: { kind: 'has_value', path: 'attributes.property_type' } },
    { id: 'address', label: { en: 'Address set', ru: 'Адрес указан' }, weight: 8, check: { kind: 'has_value', path: 'attributes.address.line' } },
    { id: 'bedrooms', label: { en: 'Bedrooms', ru: 'Кол-во спален' }, weight: 4, check: { kind: 'has_value', path: 'attributes.bedrooms' } },
    { id: 'bathrooms', label: { en: 'Bathrooms', ru: 'Кол-во ванных' }, weight: 4, check: { kind: 'has_value', path: 'attributes.bathrooms' } },
    { id: 'area', label: { en: 'Area set', ru: 'Площадь' }, weight: 4, check: { kind: 'has_value', path: 'attributes.area_sqm' } },
    { id: 'price', label: { en: 'Price set', ru: 'Цена указана' }, weight: 5, check: { kind: 'has_value', path: 'attributes.price_daily' } },
    { id: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, weight: 5, check: { kind: 'has_value', path: 'cover_image' } },
    { id: 'gallery_8', label: { en: '8+ photos', ru: '≥8 фото' }, weight: 15, check: { kind: 'media_min', path: 'gallery', min: 8 } },
    { id: 'amenities_5', label: { en: '5+ amenities', ru: '≥5 удобств' }, weight: 10, check: { kind: 'array_min', path: 'attributes.amenities', min: 5 } },
    { id: 'floorplan', label: { en: 'Floor plan uploaded', ru: 'План этажа' }, weight: 3, check: { kind: 'has_value', path: 'attributes.floorplan' } },
    { id: 'furnishing', label: { en: 'Furnishing set', ru: 'Меблировка' }, weight: 3, check: { kind: 'has_value', path: 'attributes.furnishing' } },
    { id: 'video', label: { en: 'Video tour', ru: 'Видеотур' }, weight: 3, check: { kind: 'has_value', path: 'attributes.video_url' } },
    { id: 'checkin', label: { en: 'Check-in time', ru: 'Время заезда' }, weight: 4, check: { kind: 'has_value', path: 'attributes.check_in' } },
    { id: 'checkout', label: { en: 'Check-out time', ru: 'Время выезда' }, weight: 4, check: { kind: 'has_value', path: 'attributes.check_out' } },
  ],
};
