/**
 * Restaurant vertical spec — reference implementation for Wave 0.
 * Storage: public.listings WHERE vertical='restaurant', JSONB in `attributes`.
 * Best-practice references: TheFork, Google, Tripadvisor, OpenTable.
 */
import type { VerticalSpec, FieldOption } from './types';

const CUISINES: FieldOption[] = [
  { value: 'thai', label: { en: 'Thai', ru: 'Тайская' } },
  { value: 'italian', label: { en: 'Italian', ru: 'Итальянская' } },
  { value: 'japanese', label: { en: 'Japanese', ru: 'Японская' } },
  { value: 'chinese', label: { en: 'Chinese', ru: 'Китайская' } },
  { value: 'indian', label: { en: 'Indian', ru: 'Индийская' } },
  { value: 'russian', label: { en: 'Russian', ru: 'Русская' } },
  { value: 'european', label: { en: 'European', ru: 'Европейская' } },
  { value: 'seafood', label: { en: 'Seafood', ru: 'Морепродукты' } },
  { value: 'bbq_grill', label: { en: 'BBQ & Grill', ru: 'Гриль' } },
  { value: 'vegan', label: { en: 'Vegan', ru: 'Веганская' } },
  { value: 'street_food', label: { en: 'Street Food', ru: 'Стрит-фуд' } },
  { value: 'cafe_bakery', label: { en: 'Café & Bakery', ru: 'Кафе и пекарня' } },
  { value: 'fusion', label: { en: 'Fusion', ru: 'Фьюжн' } },
];

const PRICE_LEVELS: FieldOption[] = [
  { value: '1', label: { en: '฿ Budget (<400)', ru: '฿ Бюджет (<400)' } },
  { value: '2', label: { en: '฿฿ Mid (400–900)', ru: '฿฿ Средне (400–900)' } },
  { value: '3', label: { en: '฿฿฿ High (900–2000)', ru: '฿฿฿ Выше среднего (900–2000)' } },
  { value: '4', label: { en: '฿฿฿฿ Fine dining (2000+)', ru: '฿฿฿฿ Файн-дайнинг (2000+)' } },
];

const DIETARY: FieldOption[] = [
  { value: 'vegetarian', label: { en: 'Vegetarian options', ru: 'Вегетарианское меню' } },
  { value: 'vegan', label: { en: 'Vegan options', ru: 'Веганское меню' } },
  { value: 'halal', label: { en: 'Halal', ru: 'Халяль' } },
  { value: 'gluten_free', label: { en: 'Gluten-free', ru: 'Без глютена' } },
  { value: 'kosher', label: { en: 'Kosher', ru: 'Кошер' } },
];

const AMBIANCE: FieldOption[] = [
  { value: 'sea_view', label: { en: 'Sea view', ru: 'Вид на море' } },
  { value: 'rooftop', label: { en: 'Rooftop', ru: 'Руфтоп' } },
  { value: 'terrace', label: { en: 'Terrace', ru: 'Веранда' } },
  { value: 'romantic', label: { en: 'Romantic', ru: 'Романтика' } },
  { value: 'family_friendly', label: { en: 'Family-friendly', ru: 'Для семей с детьми' } },
  { value: 'live_music', label: { en: 'Live music', ru: 'Живая музыка' } },
  { value: 'sports_bar', label: { en: 'Sports bar', ru: 'Спорт-бар' } },
  { value: 'pet_friendly', label: { en: 'Pet-friendly', ru: 'С животными' } },
];

const SERVICES: FieldOption[] = [
  { value: 'reservations', label: { en: 'Reservations', ru: 'Бронь столиков' } },
  { value: 'delivery', label: { en: 'Delivery', ru: 'Доставка' } },
  { value: 'takeaway', label: { en: 'Takeaway', ru: 'С собой' } },
  { value: 'dine_in', label: { en: 'Dine-in', ru: 'В зале' } },
  { value: 'catering', label: { en: 'Catering', ru: 'Кейтеринг' } },
  { value: 'private_dining', label: { en: 'Private dining', ru: 'Приватные залы' } },
];

const PAYMENTS: FieldOption[] = [
  { value: 'cash', label: { en: 'Cash', ru: 'Наличные' } },
  { value: 'card', label: { en: 'Card', ru: 'Карта' } },
  { value: 'promptpay', label: { en: 'PromptPay', ru: 'PromptPay' } },
  { value: 'crypto', label: { en: 'Crypto', ru: 'Криптовалюта' } },
];

export const restaurantSpec: VerticalSpec = {
  id: 'restaurant',
  label: { en: 'Restaurant', ru: 'Ресторан' },
  storage: { kind: 'listings_vertical', vertical: 'restaurant' },
  surface: 'live',
  icon: 'UtensilsCrossed',
  references: ['TheFork', 'Google Business', 'Tripadvisor', 'OpenTable'],
  requiresApproval: true,

  onboarding: [
    {
      id: 'identity',
      title: { en: 'Restaurant identity', ru: 'Идентичность ресторана' },
      mapsToTab: 'basics',
      groups: [
        {
          id: 'identity',
          title: { en: 'Basics', ru: 'Основное' },
          fields: [
            { key: 'name', label: { en: 'Restaurant name', ru: 'Название' }, type: 'text', required: true, path: 'name', qualityWeight: 5 },
            { key: 'short_pitch', label: { en: 'Short pitch (1 sentence)', ru: 'Краткое описание (1 предложение)' }, hint: { en: 'EN + RU required', ru: 'Нужен EN и RU' }, type: 'i18n_text', required: true, path: 'attributes.short_pitch', qualityWeight: 5 },
            { key: 'cuisine_types', label: { en: 'Cuisines', ru: 'Кухни' }, type: 'multiselect', options: CUISINES, required: true, path: 'attributes.cuisine_types', qualityWeight: 8 },
            { key: 'price_level', label: { en: 'Price level', ru: 'Средний чек' }, type: 'select', options: PRICE_LEVELS, required: true, path: 'attributes.price_level', qualityWeight: 5 },
          ],
        },
      ],
    },
    {
      id: 'compliance',
      title: { en: 'Licenses & compliance', ru: 'Лицензии и документы' },
      description: { en: 'Phuket F&B license, alcohol license (if applicable).', ru: 'Лицензия общепита Пхукета, алкогольная (если есть).' },
      mapsToTab: 'compliance',
      groups: [
        {
          id: 'licenses',
          title: { en: 'Documents', ru: 'Документы' },
          fields: [
            { key: 'food_license', label: { en: 'Food license', ru: 'Лицензия на общепит' }, type: 'license_upload', required: true, path: 'attributes.licenses.food', qualityWeight: 5 },
            { key: 'alcohol_license', label: { en: 'Alcohol license', ru: 'Алкогольная лицензия' }, type: 'license_upload', path: 'attributes.licenses.alcohol' },
          ],
        },
      ],
    },
    {
      id: 'location_hours',
      title: { en: 'Location & hours', ru: 'Адрес и часы работы' },
      mapsToTab: 'location',
      groups: [
        {
          id: 'where',
          title: { en: 'Where', ru: 'Где' },
          fields: [
            { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'attributes.address', qualityWeight: 8 },
            { key: 'hours', label: { en: 'Opening hours', ru: 'Часы работы' }, type: 'hours', required: true, path: 'attributes.hours', qualityWeight: 5 },
            { key: 'phone', label: { en: 'Phone', ru: 'Телефон' }, type: 'phone', required: true, path: 'attributes.phone', qualityWeight: 3 },
          ],
        },
      ],
    },
    {
      id: 'experience',
      title: { en: 'Experience', ru: 'Атмосфера и услуги' },
      mapsToTab: 'details',
      groups: [
        {
          id: 'features',
          title: { en: 'Features', ru: 'Особенности' },
          fields: [
            { key: 'ambiance', label: { en: 'Ambiance', ru: 'Атмосфера' }, type: 'multiselect', options: AMBIANCE, path: 'attributes.ambiance', qualityWeight: 5 },
            { key: 'dietary', label: { en: 'Dietary options', ru: 'Диетические опции' }, type: 'multiselect', options: DIETARY, path: 'attributes.dietary', qualityWeight: 5 },
            { key: 'services', label: { en: 'Services', ru: 'Услуги' }, type: 'multiselect', options: SERVICES, path: 'attributes.services', qualityWeight: 5 },
            { key: 'payments', label: { en: 'Payment methods', ru: 'Способы оплаты' }, type: 'multiselect', options: PAYMENTS, path: 'attributes.payments' },
          ],
        },
      ],
    },
    {
      id: 'menu_media',
      title: { en: 'Menu & photos', ru: 'Меню и фото' },
      mapsToTab: 'menu',
      groups: [
        {
          id: 'media',
          title: { en: 'Media (min 5 photos)', ru: 'Медиа (мин. 5 фото)' },
          fields: [
            { key: 'cover', label: { en: 'Cover photo', ru: 'Обложка' }, type: 'media_single', required: true, path: 'cover_image', qualityWeight: 8 },
            { key: 'gallery', label: { en: 'Gallery', ru: 'Галерея' }, type: 'media_gallery', required: true, path: 'gallery', qualityWeight: 12 },
            { key: 'menu_pdf', label: { en: 'Menu (PDF or photos)', ru: 'Меню (PDF или фото)' }, type: 'media_gallery', path: 'attributes.menu_media', qualityWeight: 8 },
          ],
        },
      ],
    },
    {
      id: 'booking',
      title: { en: 'Booking & lead capture', ru: 'Бронирование и лиды' },
      mapsToTab: 'booking',
      groups: [
        {
          id: 'booking',
          title: { en: 'How guests reach you', ru: 'Как клиенты вас находят' },
          fields: [
            { key: 'booking_mode', label: { en: 'Booking mode', ru: 'Режим бронирования' }, type: 'select', required: true, path: 'attributes.booking_mode', options: [
              { value: 'instant', label: { en: 'Instant book', ru: 'Мгновенная бронь' } },
              { value: 'request', label: { en: 'Request to book', ru: 'По запросу' } },
              { value: 'lead', label: { en: 'Lead form only', ru: 'Только заявка' } },
            ]},
            { key: 'tables_capacity', label: { en: 'Total seats', ru: 'Всего мест' }, type: 'number', min: 1, path: 'attributes.seats' },
          ],
        },
      ],
    },
  ],

  editorTabs: [
    {
      id: 'basics',
      title: { en: 'Basics', ru: 'Основное' },
      groups: [
        {
          id: 'core',
          title: { en: 'Core', ru: 'Главное' },
          fields: [
            { key: 'name', label: { en: 'Name', ru: 'Название' }, type: 'text', required: true, path: 'name' },
            { key: 'description', label: { en: 'Description', ru: 'Описание' }, type: 'i18n_textarea', required: true, path: 'attributes.description' },
            { key: 'cuisine_types', label: { en: 'Cuisines', ru: 'Кухни' }, type: 'multiselect', options: CUISINES, required: true, path: 'attributes.cuisine_types' },
            { key: 'price_level', label: { en: 'Price level', ru: 'Средний чек' }, type: 'select', options: PRICE_LEVELS, required: true, path: 'attributes.price_level' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: { en: 'Location', ru: 'Расположение' },
      groups: [
        {
          id: 'where',
          title: { en: 'Where', ru: 'Где' },
          fields: [
            { key: 'address', label: { en: 'Address', ru: 'Адрес' }, type: 'address', required: true, path: 'attributes.address' },
            { key: 'hours', label: { en: 'Hours', ru: 'Часы работы' }, type: 'hours', required: true, path: 'attributes.hours' },
            { key: 'phone', label: { en: 'Phone', ru: 'Телефон' }, type: 'phone', required: true, path: 'attributes.phone' },
            { key: 'website', label: { en: 'Website', ru: 'Сайт' }, type: 'url', path: 'attributes.website' },
          ],
        },
      ],
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
        ],
      }],
    },
    {
      id: 'details',
      title: { en: 'Details', ru: 'Детали' },
      groups: [{
        id: 'features',
        title: { en: 'Features', ru: 'Особенности' },
        fields: [
          { key: 'ambiance', label: { en: 'Ambiance', ru: 'Атмосфера' }, type: 'multiselect', options: AMBIANCE, path: 'attributes.ambiance' },
          { key: 'dietary', label: { en: 'Dietary', ru: 'Диета' }, type: 'multiselect', options: DIETARY, path: 'attributes.dietary' },
          { key: 'services', label: { en: 'Services', ru: 'Услуги' }, type: 'multiselect', options: SERVICES, path: 'attributes.services' },
          { key: 'payments', label: { en: 'Payments', ru: 'Оплата' }, type: 'multiselect', options: PAYMENTS, path: 'attributes.payments' },
        ],
      }],
    },
    {
      id: 'menu',
      title: { en: 'Menu', ru: 'Меню' },
      groups: [{
        id: 'menu',
        title: { en: 'Menu', ru: 'Меню' },
        fields: [
          { key: 'menu_media', label: { en: 'Menu (PDF/photos)', ru: 'Меню (PDF/фото)' }, type: 'media_gallery', path: 'attributes.menu_media' },
          { key: 'menu_url', label: { en: 'External menu URL', ru: 'Внешняя ссылка на меню' }, type: 'url', path: 'attributes.menu_url' },
        ],
      }],
    },
    {
      id: 'booking',
      title: { en: 'Booking', ru: 'Бронирование' },
      groups: [{
        id: 'booking',
        title: { en: 'Booking', ru: 'Бронирование' },
        fields: [
          { key: 'booking_mode', label: { en: 'Mode', ru: 'Режим' }, type: 'select', required: true, path: 'attributes.booking_mode', options: [
            { value: 'instant', label: { en: 'Instant', ru: 'Мгновенно' } },
            { value: 'request', label: { en: 'Request', ru: 'По запросу' } },
            { value: 'lead', label: { en: 'Lead only', ru: 'Только заявка' } },
          ]},
          { key: 'tables_capacity', label: { en: 'Seats', ru: 'Мест' }, type: 'number', min: 1, path: 'attributes.seats' },
          { key: 'avg_meal_minutes', label: { en: 'Avg meal duration (min)', ru: 'Средняя длительность (мин)' }, type: 'number', min: 30, step: 15, path: 'attributes.avg_meal_minutes' },
        ],
      }],
    },
    {
      id: 'compliance',
      title: { en: 'Compliance', ru: 'Документы' },
      groups: [{
        id: 'licenses',
        title: { en: 'Licenses', ru: 'Лицензии' },
        fields: [
          { key: 'food_license', label: { en: 'Food license', ru: 'Лицензия общепита' }, type: 'license_upload', required: true, path: 'attributes.licenses.food' },
          { key: 'alcohol_license', label: { en: 'Alcohol license', ru: 'Алкогольная лицензия' }, type: 'license_upload', path: 'attributes.licenses.alcohol' },
        ],
      }],
    },
    {
      id: 'seo',
      title: { en: 'SEO', ru: 'SEO' },
      groups: [{
        id: 'seo',
        title: { en: 'SEO', ru: 'SEO' },
        fields: [
          { key: 'seo_title', label: { en: 'SEO title', ru: 'SEO заголовок' }, type: 'i18n_text', path: 'attributes.seo.title' },
          { key: 'seo_description', label: { en: 'Meta description', ru: 'Meta-описание' }, type: 'i18n_textarea', path: 'attributes.seo.description' },
        ],
      }],
    },
  ],

  filters: [
    { key: 'cuisine', label: { en: 'Cuisine', ru: 'Кухня' }, type: 'enum', options: CUISINES, queryHint: { column: 'attributes', jsonbPath: 'cuisine_types', operator: 'contains' } },
    { key: 'price', label: { en: 'Price', ru: 'Цена' }, type: 'enum', options: PRICE_LEVELS, queryHint: { column: 'attributes', jsonbPath: 'price_level', operator: 'in' } },
    { key: 'ambiance', label: { en: 'Ambiance', ru: 'Атмосфера' }, type: 'enum', options: AMBIANCE, queryHint: { column: 'attributes', jsonbPath: 'ambiance', operator: 'contains' } },
    { key: 'dietary', label: { en: 'Dietary', ru: 'Диета' }, type: 'enum', options: DIETARY, queryHint: { column: 'attributes', jsonbPath: 'dietary', operator: 'contains' } },
    { key: 'services', label: { en: 'Services', ru: 'Услуги' }, type: 'enum', options: SERVICES, queryHint: { column: 'attributes', jsonbPath: 'services', operator: 'contains' } },
    { key: 'open_now', label: { en: 'Open now', ru: 'Сейчас открыто' }, type: 'bool' },
    { key: 'reservable', label: { en: 'Online reservations', ru: 'Онлайн-бронь' }, type: 'bool', queryHint: { column: 'attributes', jsonbPath: 'booking_mode', operator: 'in' } },
    { key: 'distance', label: { en: 'Distance', ru: 'Расстояние' }, type: 'distance', min: 1, max: 50, step: 1, unit: 'km' },
    { key: 'sort', label: { en: 'Sort', ru: 'Сортировка' }, type: 'sort', options: [
      { value: 'relevance', label: { en: 'Relevance', ru: 'Релевантность' } },
      { value: 'rating', label: { en: 'Top rated', ru: 'По рейтингу' } },
      { value: 'price_asc', label: { en: 'Price ↑', ru: 'Цена ↑' } },
      { value: 'price_desc', label: { en: 'Price ↓', ru: 'Цена ↓' } },
      { value: 'distance', label: { en: 'Nearest', ru: 'Ближайшие' } },
    ]},
  ],

  detail: [
    { id: 'hero', render: 'hero' },
    { id: 'description', render: 'description' },
    { id: 'amenities', render: 'amenities' },
    { id: 'menu', render: 'menu' },
    { id: 'gallery', render: 'gallery' },
    { id: 'hours', render: 'hours' },
    { id: 'map', render: 'map' },
    { id: 'reviews', render: 'reviews' },
    { id: 'policies', render: 'policies' },
    { id: 'cta', render: 'cta' },
  ],

  quality: [
    { id: 'name', label: { en: 'Name set', ru: 'Название указано' }, weight: 5, check: { kind: 'field_present', path: 'name' } },
    { id: 'pitch_i18n', label: { en: 'Short pitch in RU + EN', ru: 'Краткое описание RU + EN' }, weight: 5, check: { kind: 'field_i18n_complete', path: 'attributes.short_pitch' } },
    { id: 'description_i18n', label: { en: 'Full description in RU + EN', ru: 'Полное описание RU + EN' }, weight: 10, check: { kind: 'field_i18n_complete', path: 'attributes.description' } },
    { id: 'cuisine', label: { en: 'At least 1 cuisine', ru: 'Хотя бы 1 кухня' }, weight: 8, check: { kind: 'array_min', path: 'attributes.cuisine_types', min: 1 } },
    { id: 'price_level', label: { en: 'Price level set', ru: 'Указан средний чек' }, weight: 5, check: { kind: 'has_value', path: 'attributes.price_level' } },
    { id: 'address', label: { en: 'Address with map pin', ru: 'Адрес и точка на карте' }, weight: 8, check: { kind: 'has_value', path: 'attributes.address.lat' } },
    { id: 'hours', label: { en: 'Opening hours set', ru: 'Часы работы указаны' }, weight: 5, check: { kind: 'has_value', path: 'attributes.hours' } },
    { id: 'phone', label: { en: 'Phone set', ru: 'Телефон указан' }, weight: 3, check: { kind: 'has_value', path: 'attributes.phone' } },
    { id: 'cover', label: { en: 'Cover photo', ru: 'Есть обложка' }, weight: 8, check: { kind: 'has_value', path: 'cover_image' } },
    { id: 'gallery_5', label: { en: '5+ gallery photos', ru: '5+ фото в галерее' }, weight: 12, check: { kind: 'media_min', path: 'gallery', min: 5 } },
    { id: 'menu_media', label: { en: 'Menu uploaded', ru: 'Меню загружено' }, weight: 8, check: { kind: 'media_min', path: 'attributes.menu_media', min: 1 } },
    { id: 'ambiance', label: { en: 'Ambiance tags', ru: 'Теги атмосферы' }, weight: 5, check: { kind: 'array_min', path: 'attributes.ambiance', min: 1 } },
    { id: 'dietary', label: { en: 'Dietary options', ru: 'Диетические опции' }, weight: 5, check: { kind: 'array_min', path: 'attributes.dietary', min: 1 } },
    { id: 'services', label: { en: 'Services list', ru: 'Указаны услуги' }, weight: 5, check: { kind: 'array_min', path: 'attributes.services', min: 1 } },
    { id: 'food_license', label: { en: 'Food license uploaded', ru: 'Лицензия общепита' }, weight: 5, check: { kind: 'has_value', path: 'attributes.licenses.food' } },
    { id: 'booking_mode', label: { en: 'Booking mode chosen', ru: 'Выбран режим брони' }, weight: 3, check: { kind: 'has_value', path: 'attributes.booking_mode' } },
  ],
};
