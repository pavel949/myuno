/**
 * Transport vertical spec (airport transfers, taxi, private driver, car/bike rental).
 * Storage: public.listings WHERE vertical='transport'.
 * Best-practice references: Bolt, Kiwitaxi, GetTransfer, DiDi, Turo.
 */
import type { VerticalSpec, FieldOption } from './types';

const SERVICE_TYPES: FieldOption[] = [
  { value: 'airport_transfer', label: { en: 'Airport transfer', ru: 'Трансфер из аэропорта' } },
  { value: 'point_to_point', label: { en: 'Point-to-point', ru: 'Из точки А в Б' } },
  { value: 'hourly_charter', label: { en: 'Hourly charter', ru: 'Почасовая аренда с водителем' } },
  { value: 'day_tour', label: { en: 'Day tour', ru: 'Дневной тур' } },
  { value: 'car_rental', label: { en: 'Self-drive car rental', ru: 'Аренда авто без водителя' } },
  { value: 'bike_rental', label: { en: 'Bike / scooter rental', ru: 'Аренда байка' } },
];

const VEHICLE_CLASSES: FieldOption[] = [
  { value: 'economy', label: { en: 'Economy', ru: 'Эконом' } },
  { value: 'comfort', label: { en: 'Comfort', ru: 'Комфорт' } },
  { value: 'business', label: { en: 'Business', ru: 'Бизнес' } },
  { value: 'premium', label: { en: 'Premium / Luxury', ru: 'Премиум / Люкс' } },
  { value: 'minivan', label: { en: 'Minivan', ru: 'Минивэн' } },
  { value: 'minibus', label: { en: 'Minibus', ru: 'Микроавтобус' } },
  { value: 'suv', label: { en: 'SUV', ru: 'Внедорожник' } },
  { value: 'pickup', label: { en: 'Pickup truck', ru: 'Пикап' } },
  { value: 'scooter', label: { en: 'Scooter', ru: 'Скутер' } },
  { value: 'motorbike', label: { en: 'Motorbike', ru: 'Мотоцикл' } },
];

const TRANSMISSION: FieldOption[] = [
  { value: 'automatic', label: { en: 'Automatic', ru: 'Автомат' } },
  { value: 'manual', label: { en: 'Manual', ru: 'Механика' } },
];

const FUEL_TYPES: FieldOption[] = [
  { value: 'petrol', label: { en: 'Petrol', ru: 'Бензин' } },
  { value: 'diesel', label: { en: 'Diesel', ru: 'Дизель' } },
  { value: 'hybrid', label: { en: 'Hybrid', ru: 'Гибрид' } },
  { value: 'electric', label: { en: 'Electric', ru: 'Электро' } },
];

const FEATURES: FieldOption[] = [
  { value: 'ac', label: { en: 'Air conditioning', ru: 'Кондиционер' } },
  { value: 'wifi', label: { en: 'Wi-Fi on board', ru: 'Wi-Fi' } },
  { value: 'child_seat', label: { en: 'Child seat available', ru: 'Детское кресло' } },
  { value: 'booster', label: { en: 'Booster', ru: 'Бустер' } },
  { value: 'water', label: { en: 'Bottled water', ru: 'Бутылка воды' } },
  { value: 'meet_and_greet', label: { en: 'Meet & greet sign', ru: 'Табличка встречи' } },
  { value: 'flight_tracking', label: { en: 'Flight tracking', ru: 'Отслеживание рейса' } },
  { value: 'usb_charger', label: { en: 'USB charger', ru: 'USB-зарядка' } },
  { value: 'large_luggage', label: { en: 'Large luggage space', ru: 'Большой багажник' } },
  { value: 'bike_rack', label: { en: 'Bike rack', ru: 'Багажник для велосипеда' } },
];

const INCLUDED: FieldOption[] = [
  { value: 'insurance', label: { en: 'Insurance', ru: 'Страховка' } },
  { value: 'fuel', label: { en: 'Fuel', ru: 'Топливо' } },
  { value: 'unlimited_km', label: { en: 'Unlimited mileage', ru: 'Без лимита пробега' } },
  { value: 'toll', label: { en: 'Tolls', ru: 'Платные дороги' } },
  { value: 'delivery', label: { en: 'Hotel delivery', ru: 'Доставка в отель' } },
  { value: 'helmet', label: { en: 'Helmet (bikes)', ru: 'Шлем (для байков)' } },
];

const LANGUAGES: FieldOption[] = [
  { value: 'th', label: { en: 'Thai', ru: 'Тайский' } },
  { value: 'en', label: { en: 'English', ru: 'Английский' } },
  { value: 'ru', label: { en: 'Russian', ru: 'Русский' } },
  { value: 'zh', label: { en: 'Chinese', ru: 'Китайский' } },
];

export const transportSpec: VerticalSpec = {
  id: 'transport',
  label: { en: 'Transport & Transfers', ru: 'Транспорт и трансферы' },
  storage: { kind: 'listings_vertical', vertical: 'transport' },
  surface: 'arrive',
  icon: 'Car',
  references: ['Bolt', 'Kiwitaxi', 'GetTransfer', 'DiDi', 'Turo'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'service', title: { en: 'Service type', ru: 'Тип сервиса' }, mapsToTab: 'basics',
      groups: [{
        id: 'c', title: { en: 'Core', ru: 'Главное' },
        fields: [
          { key: 'title', label: { en: 'Title (RU + EN)', ru: 'Название (RU + EN)' }, type: 'i18n_text', required: true, path: 'attributes.title', qualityWeight: 8 },
          { key: 'service_type', label: { en: 'Service type', ru: 'Тип сервиса' }, type: 'select', options: SERVICE_TYPES, required: true, path: 'attributes.service_type', qualityWeight: 6 },
          { key: 'with_driver', label: { en: 'With driver', ru: 'С водителем' }, type: 'boolean', path: 'attributes.with_driver' },
          { key: 'languages', label: { en: 'Driver languages', ru: 'Языки водителя' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages', qualityWeight: 3, showIf: { key: 'attributes.with_driver', equals: true } },
        ],
      }],
    },
    {
      id: 'vehicle', title: { en: 'Vehicle', ru: 'Транспорт' }, mapsToTab: 'details',
      groups: [{
        id: 'v', title: { en: 'Vehicle details', ru: 'Параметры авто' },
        fields: [
          { key: 'vehicle_class', label: { en: 'Vehicle class', ru: 'Класс' }, type: 'select', options: VEHICLE_CLASSES, required: true, path: 'attributes.vehicle_class', qualityWeight: 5 },
          { key: 'make_model', label: { en: 'Make & model (or similar)', ru: 'Марка и модель (или аналог)' }, type: 'text', required: true, path: 'attributes.make_model', qualityWeight: 4 },
          { key: 'year', label: { en: 'Year', ru: 'Год' }, type: 'number', min: 1990, max: new Date().getFullYear() + 1, path: 'attributes.year' },
          { key: 'pax_max', label: { en: 'Max passengers', ru: 'Макс. пассажиров' }, type: 'number', min: 1, required: true, path: 'attributes.pax_max', qualityWeight: 4 },
          { key: 'luggage_max', label: { en: 'Max luggage pieces', ru: 'Макс. чемоданов' }, type: 'number', min: 0, path: 'attributes.luggage_max', qualityWeight: 3 },
          { key: 'transmission', label: { en: 'Transmission', ru: 'КПП' }, type: 'select', options: TRANSMISSION, path: 'attributes.transmission' },
          { key: 'fuel_type', label: { en: 'Fuel type', ru: 'Топливо' }, type: 'select', options: FUEL_TYPES, path: 'attributes.fuel_type' },
          { key: 'features', label: { en: 'Features', ru: 'Особенности' }, type: 'multiselect', options: FEATURES, path: 'attributes.features', qualityWeight: 6 },
        ],
      }],
    },
    {
      id: 'service_area', title: { en: 'Service area', ru: 'Зона работы' }, mapsToTab: 'location',
      groups: [{
        id: 'sa', title: { en: 'Where you operate', ru: 'Где работаете' },
        fields: [
          { key: 'base_location', label: { en: 'Base location', ru: 'База' }, type: 'address', required: true, path: 'address', qualityWeight: 5 },
          { key: 'service_areas', label: { en: 'Service areas / zones', ru: 'Зоны работы' }, type: 'tags', required: true, path: 'attributes.service_areas', qualityWeight: 4 },
          { key: 'pickup_24_7', label: { en: '24/7 pickup available', ru: 'Подача 24/7' }, type: 'boolean', path: 'attributes.pickup_24_7' },
        ],
      }],
    },
    {
      id: 'pricing', title: { en: 'Pricing', ru: 'Цены' }, mapsToTab: 'pricing',
      groups: [{
        id: 'p', title: { en: 'Pricing model', ru: 'Модель цен' },
        fields: [
          { key: 'price_from', label: { en: 'Starting price (THB)', ru: 'Цена от (THB)' }, type: 'currency_thb', required: true, path: 'price', qualityWeight: 5 },
          { key: 'price_per_km', label: { en: 'Per km', ru: 'За км' }, type: 'currency_thb', path: 'attributes.price_per_km' },
          { key: 'price_per_hour', label: { en: 'Per hour', ru: 'За час' }, type: 'currency_thb', path: 'attributes.price_per_hour' },
          { key: 'price_per_day', label: { en: 'Per day', ru: 'За день' }, type: 'currency_thb', path: 'attributes.price_per_day' },
          { key: 'includes', label: { en: 'Included in price', ru: 'Включено в цену' }, type: 'multiselect', options: INCLUDED, path: 'attributes.includes', qualityWeight: 5 },
          { key: 'deposit_amount', label: { en: 'Security deposit (THB)', ru: 'Депозит (THB)' }, type: 'currency_thb', path: 'attributes.deposit_amount', showIf: { key: 'attributes.with_driver', equals: false } },
          { key: 'cancellation_hours', label: { en: 'Free cancellation (hours before)', ru: 'Беспл. отмена (часов до)' }, type: 'number', min: 0, path: 'attributes.cancellation_hours', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'media', title: { en: 'Photos', ru: 'Фото' }, mapsToTab: 'media',
      groups: [{
        id: 'm', title: { en: 'Media (min 4 photos)', ru: 'Медиа (мин. 4 фото)' },
        fields: [
          { key: 'cover', label: { en: 'Cover', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 5 },
          { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 10 },
        ],
      }],
    },
    {
      id: 'compliance', title: { en: 'License & insurance', ru: 'Лицензия и страховка' }, mapsToTab: 'compliance',
      groups: [{
        id: 'c', title: { en: 'Compliance', ru: 'Документы' },
        fields: [
          { key: 'driver_license', label: { en: 'Public driver license (for-hire)', ru: 'Лицензия таксиста (для услуг с водителем)' }, type: 'license_upload', path: 'attributes.licenses.driver', showIf: { key: 'attributes.with_driver', equals: true }, qualityWeight: 4 },
          { key: 'insurance', label: { en: 'Insurance certificate', ru: 'Страховой полис' }, type: 'license_upload', required: true, path: 'attributes.licenses.insurance', qualityWeight: 4 },
          { key: 'vehicle_registration', label: { en: 'Vehicle registration', ru: 'Свидетельство о регистрации' }, type: 'license_upload', path: 'attributes.licenses.registration', qualityWeight: 3 },
        ],
      }],
    },
    {
      id: 'description', title: { en: 'Description', ru: 'Описание' }, mapsToTab: 'basics',
      groups: [{
        id: 'd', title: { en: 'About', ru: 'О сервисе' },
        fields: [
          { key: 'description', label: { en: 'Full description (RU + EN)', ru: 'Полное описание (RU + EN)' }, type: 'i18n_textarea', required: true, path: 'attributes.description', qualityWeight: 8 },
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
          { key: 'service_type', label: { en: 'Service', ru: 'Сервис' }, type: 'select', options: SERVICE_TYPES, required: true, path: 'attributes.service_type' },
          { key: 'with_driver', label: { en: 'With driver', ru: 'С водителем' }, type: 'boolean', path: 'attributes.with_driver' },
          { key: 'languages', label: { en: 'Languages', ru: 'Языки' }, type: 'multiselect', options: LANGUAGES, path: 'attributes.languages' },
        ],
      }],
    },
    {
      id: 'details', title: { en: 'Vehicle', ru: 'Транспорт' },
      groups: [{
        id: 'v', title: { en: 'Vehicle', ru: 'Авто' },
        fields: [
          { key: 'vehicle_class', label: { en: 'Class', ru: 'Класс' }, type: 'select', options: VEHICLE_CLASSES, required: true, path: 'attributes.vehicle_class' },
          { key: 'make_model', label: { en: 'Make / model', ru: 'Марка / модель' }, type: 'text', required: true, path: 'attributes.make_model' },
          { key: 'year', label: { en: 'Year', ru: 'Год' }, type: 'number', path: 'attributes.year' },
          { key: 'pax_max', label: { en: 'Max pax', ru: 'Макс. пасс.' }, type: 'number', min: 1, required: true, path: 'attributes.pax_max' },
          { key: 'luggage_max', label: { en: 'Max luggage', ru: 'Макс. багаж' }, type: 'number', path: 'attributes.luggage_max' },
          { key: 'transmission', label: { en: 'Transmission', ru: 'КПП' }, type: 'select', options: TRANSMISSION, path: 'attributes.transmission' },
          { key: 'fuel_type', label: { en: 'Fuel', ru: 'Топливо' }, type: 'select', options: FUEL_TYPES, path: 'attributes.fuel_type' },
          { key: 'features', label: { en: 'Features', ru: 'Особенности' }, type: 'multiselect', options: FEATURES, path: 'attributes.features' },
        ],
      }],
    },
    {
      id: 'location', title: { en: 'Service area', ru: 'Зона' },
      groups: [{
        id: 'l', title: { en: 'Where', ru: 'Где' },
        fields: [
          { key: 'base_location', label: { en: 'Base', ru: 'База' }, type: 'address', required: true, path: 'address' },
          { key: 'service_areas', label: { en: 'Service areas', ru: 'Зоны' }, type: 'tags', path: 'attributes.service_areas' },
          { key: 'pickup_24_7', label: { en: '24/7', ru: '24/7' }, type: 'boolean', path: 'attributes.pickup_24_7' },
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
        id: 'p', title: { en: 'Pricing (THB)', ru: 'Цены (THB)' },
        fields: [
          { key: 'price_from', label: { en: 'From', ru: 'От' }, type: 'currency_thb', required: true, path: 'price' },
          { key: 'price_per_km', label: { en: 'Per km', ru: 'За км' }, type: 'currency_thb', path: 'attributes.price_per_km' },
          { key: 'price_per_hour', label: { en: 'Per hour', ru: 'За час' }, type: 'currency_thb', path: 'attributes.price_per_hour' },
          { key: 'price_per_day', label: { en: 'Per day', ru: 'За день' }, type: 'currency_thb', path: 'attributes.price_per_day' },
          { key: 'includes', label: { en: 'Included', ru: 'Включено' }, type: 'multiselect', options: INCLUDED, path: 'attributes.includes' },
          { key: 'deposit_amount', label: { en: 'Deposit', ru: 'Депозит' }, type: 'currency_thb', path: 'attributes.deposit_amount' },
          { key: 'cancellation_hours', label: { en: 'Free cancel (h)', ru: 'Беспл. отмена (ч)' }, type: 'number', path: 'attributes.cancellation_hours' },
        ],
      }],
    },
    {
      id: 'compliance', title: { en: 'Compliance', ru: 'Документы' },
      groups: [{
        id: 'c', title: { en: 'Licenses', ru: 'Лицензии' },
        fields: [
          { key: 'driver_license', label: { en: 'Driver license', ru: 'Лицензия водителя' }, type: 'license_upload', path: 'attributes.licenses.driver' },
          { key: 'insurance', label: { en: 'Insurance', ru: 'Страховка' }, type: 'license_upload', required: true, path: 'attributes.licenses.insurance' },
          { key: 'vehicle_registration', label: { en: 'Vehicle reg.', ru: 'Регистрация ТС' }, type: 'license_upload', path: 'attributes.licenses.registration' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'service_type', label: { en: 'Service', ru: 'Сервис' }, type: 'enum', options: SERVICE_TYPES, queryHint: { column: 'attributes', jsonbPath: 'service_type', operator: 'in' } },
    { key: 'vehicle_class', label: { en: 'Class', ru: 'Класс' }, type: 'enum', options: VEHICLE_CLASSES, queryHint: { column: 'attributes', jsonbPath: 'vehicle_class', operator: 'in' } },
    { key: 'pax', label: { en: 'Passengers', ru: 'Пассажиров' }, type: 'range', min: 1, max: 20, step: 1 },
    { key: 'transmission', label: { en: 'Transmission', ru: 'КПП' }, type: 'enum', options: TRANSMISSION, queryHint: { column: 'attributes', jsonbPath: 'transmission', operator: 'eq' } },
    { key: 'features', label: { en: 'Features', ru: 'Особенности' }, type: 'enum', options: FEATURES, queryHint: { column: 'attributes', jsonbPath: 'features', operator: 'contains' } },
    { key: 'languages', label: { en: 'Driver language', ru: 'Язык водителя' }, type: 'enum', options: LANGUAGES, queryHint: { column: 'attributes', jsonbPath: 'languages', operator: 'contains' } },
    { key: 'price', label: { en: 'Price from', ru: 'Цена от' }, type: 'range', min: 0, max: 50000, step: 100, unit: '฿', queryHint: { column: 'price', operator: 'between' } },
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
    { id: 'description', label: { en: 'Description RU + EN', ru: 'Описание RU + EN' }, weight: 8, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'service_type', label: { en: 'Service type', ru: 'Тип сервиса' }, weight: 6, check: { kind: 'has_value', path: 'attributes.service_type' } },
    { id: 'vehicle_class', label: { en: 'Vehicle class', ru: 'Класс' }, weight: 5, check: { kind: 'has_value', path: 'attributes.vehicle_class' } },
    { id: 'make_model', label: { en: 'Make/model', ru: 'Марка/модель' }, weight: 4, check: { kind: 'field_present', path: 'attributes.make_model' } },
    { id: 'pax', label: { en: 'Max passengers', ru: 'Макс. пасс.' }, weight: 4, check: { kind: 'field_present', path: 'attributes.pax_max' } },
    { id: 'luggage', label: { en: 'Luggage info', ru: 'Багаж' }, weight: 3, check: { kind: 'field_present', path: 'attributes.luggage_max' } },
    { id: 'features', label: { en: '3+ features', ru: '3+ особенности' }, weight: 6, check: { kind: 'array_min', path: 'attributes.features', min: 3 } },
    { id: 'languages', label: { en: 'Driver languages', ru: 'Языки водителя' }, weight: 3, check: { kind: 'array_min', path: 'attributes.languages', min: 1 } },
    { id: 'base', label: { en: 'Base location', ru: 'База' }, weight: 5, check: { kind: 'field_present', path: 'address' } },
    { id: 'areas', label: { en: 'Service areas', ru: 'Зоны' }, weight: 4, check: { kind: 'array_min', path: 'attributes.service_areas', min: 1 } },
    { id: 'price', label: { en: 'Starting price', ru: 'Цена от' }, weight: 5, check: { kind: 'field_present', path: 'price' } },
    { id: 'includes', label: { en: 'What\'s included', ru: 'Что включено' }, weight: 5, check: { kind: 'array_min', path: 'attributes.includes', min: 1 } },
    { id: 'cancellation', label: { en: 'Cancellation', ru: 'Отмена' }, weight: 3, check: { kind: 'field_present', path: 'attributes.cancellation_hours' } },
    { id: 'insurance', label: { en: 'Insurance uploaded', ru: 'Страховка загружена' }, weight: 6, check: { kind: 'field_present', path: 'attributes.licenses.insurance' } },
    { id: 'registration', label: { en: 'Vehicle registration', ru: 'Регистрация ТС' }, weight: 3, check: { kind: 'field_present', path: 'attributes.licenses.registration' } },
    { id: 'cover', label: { en: 'Cover', ru: 'Обложка' }, weight: 5, check: { kind: 'field_present', path: 'cover_image' } },
    { id: 'gallery', label: { en: '4+ photos', ru: '4+ фото' }, weight: 12, check: { kind: 'media_min', path: 'gallery', min: 4 } },
    { id: 'pickup24', label: { en: '24/7 availability', ru: 'Подача 24/7' }, weight: 3, check: { kind: 'has_value', path: 'attributes.pickup_24_7' } },
    { id: 'deposit', label: { en: 'Deposit disclosed', ru: 'Депозит указан' }, weight: 2, check: { kind: 'field_present', path: 'attributes.deposit_amount' } },
  ],
};
