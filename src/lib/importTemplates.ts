/**
 * Field mapping templates for Data Import Hub
 * Maps common Excel/CSV column names to database field names
 */

export interface ImportTarget {
  id: string;
  name: string;
  nameRu: string;
  table: string;
  requiredFields: string[];
  optionalFields: string[];
  fieldLabels: Record<string, { en: string; ru: string }>;
}

// Auto-mapping dictionary for common column names
export const autoMappingDictionary: Record<string, string> = {
  // English common names
  'name': 'name_en',
  'title': 'title_en',
  'title_en': 'title_en',
  'title_ru': 'title_ru',
  'name_en': 'name_en',
  'name_ru': 'name_ru',
  'price': 'price',
  'cost': 'price',
  'description': 'description_en',
  'description_en': 'description_en',
  'description_ru': 'description_ru',
  'category': 'category_slug',
  'image': 'cover_image',
  'cover': 'cover_image',
  'cover_image': 'cover_image',
  'phone': 'phone',
  'telephone': 'phone',
  'email': 'email',
  'address': 'address',
  'website': 'website',
  'url': 'website',
  'rating': 'rating',
  'stock': 'in_stock',
  'quantity': 'stock_quantity',
  'active': 'is_active',
  'featured': 'is_featured',
  'currency': 'currency',
  
  // Real estate specific
  'bedrooms': 'bedrooms',
  'bathrooms': 'bathrooms',
  'area': 'area_sqm',
  'sqm': 'area_sqm',
  'floor': 'floor',
  'district': 'district',
  'type': 'property_type',
  'property_type': 'property_type',
  'listing_type': 'listing_type',
  'rent': 'listing_type',
  'sale': 'listing_type',
  
  // Russian common names
  'название': 'name_ru',
  'заголовок': 'title_ru',
  'наименование': 'name_ru',
  'имя': 'name_ru',
  'цена': 'price',
  'стоимость': 'price',
  'описание': 'description_ru',
  'категория': 'category_slug',
  'картинка': 'cover_image',
  'изображение': 'cover_image',
  'фото': 'cover_image',
  'телефон': 'phone',
  'почта': 'email',
  'адрес': 'address',
  'сайт': 'website',
  'рейтинг': 'rating',
  'остаток': 'stock_quantity',
  'наличие': 'in_stock',
  'валюта': 'currency',
  
  // Real estate Russian
  'спальни': 'bedrooms',
  'спален': 'bedrooms',
  'ванные': 'bathrooms',
  'санузел': 'bathrooms',
  'площадь': 'area_sqm',
  'этаж': 'floor',
  'район': 'district',
  'тип': 'property_type',
  'аренда': 'listing_type',
  'продажа': 'listing_type',
};

export const importTargets: ImportTarget[] = [
  {
    id: 'providers',
    name: 'Providers',
    nameRu: 'Поставщики',
    table: 'providers',
    requiredFields: ['name'],
    optionalFields: ['phone', 'email', 'address', 'business_category', 'website', 'description', 'is_active', 'is_verified'],
    fieldLabels: {
      name: { en: 'Name', ru: 'Название' },
      phone: { en: 'Phone', ru: 'Телефон' },
      email: { en: 'Email', ru: 'Email' },
      address: { en: 'Address', ru: 'Адрес' },
      business_category: { en: 'Business Category', ru: 'Категория бизнеса' },
      website: { en: 'Website', ru: 'Сайт' },
      description: { en: 'Description', ru: 'Описание' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_verified: { en: 'Verified', ru: 'Верифицирован' },
    },
  },
  {
    id: 'marketplace_products',
    name: 'Marketplace Products',
    nameRu: 'Товары маркетплейса',
    table: 'marketplace_products',
    requiredFields: ['name_en', 'price'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'category_slug', 'subcategory_slug', 'currency', 'in_stock', 'stock_quantity', 'is_active', 'is_featured'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      price: { en: 'Price', ru: 'Цена' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Изображение' },
      category_slug: { en: 'Category', ru: 'Категория' },
      subcategory_slug: { en: 'Subcategory', ru: 'Подкатегория' },
      currency: { en: 'Currency', ru: 'Валюта' },
      in_stock: { en: 'In Stock', ru: 'В наличии' },
      stock_quantity: { en: 'Stock Quantity', ru: 'Количество' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
  {
    id: 'marketplace_vendors',
    name: 'Marketplace Vendors',
    nameRu: 'Продавцы маркетплейса',
    table: 'marketplace_vendors',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'logo', 'cover_image', 'email', 'phone', 'address', 'is_active', 'is_verified'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      logo: { en: 'Logo', ru: 'Логотип' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      email: { en: 'Email', ru: 'Email' },
      phone: { en: 'Phone', ru: 'Телефон' },
      address: { en: 'Address', ru: 'Адрес' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_verified: { en: 'Verified', ru: 'Верифицирован' },
    },
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    nameRu: 'Рестораны',
    table: 'restaurants',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'address', 'phone', 'email', 'website', 'cuisine', 'price_range', 'rating', 'is_active', 'is_featured'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      address: { en: 'Address', ru: 'Адрес' },
      phone: { en: 'Phone', ru: 'Телефон' },
      email: { en: 'Email', ru: 'Email' },
      website: { en: 'Website', ru: 'Сайт' },
      cuisine: { en: 'Cuisine', ru: 'Кухня' },
      price_range: { en: 'Price Range', ru: 'Ценовой диапазон' },
      rating: { en: 'Rating', ru: 'Рейтинг' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
  {
    id: 'salons',
    name: 'Beauty Salons',
    nameRu: 'Салоны красоты',
    table: 'salons',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'address', 'phone', 'email', 'rating', 'is_active', 'is_featured'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      address: { en: 'Address', ru: 'Адрес' },
      phone: { en: 'Phone', ru: 'Телефон' },
      email: { en: 'Email', ru: 'Email' },
      rating: { en: 'Rating', ru: 'Рейтинг' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
  {
    id: 'yachts',
    name: 'Yachts',
    nameRu: 'Яхты',
    table: 'yachts',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'price_per_day', 'capacity', 'length', 'currency', 'is_active', 'is_featured'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      price_per_day: { en: 'Price per Day', ru: 'Цена за день' },
      capacity: { en: 'Capacity', ru: 'Вместимость' },
      length: { en: 'Length (m)', ru: 'Длина (м)' },
      currency: { en: 'Currency', ru: 'Валюта' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
  {
    id: 'tours',
    name: 'Tours',
    nameRu: 'Туры',
    table: 'tours',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'price', 'duration', 'currency', 'is_active', 'is_featured'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      price: { en: 'Price', ru: 'Цена' },
      duration: { en: 'Duration', ru: 'Продолжительность' },
      currency: { en: 'Currency', ru: 'Валюта' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
  {
    id: 'services',
    name: 'Services',
    nameRu: 'Услуги',
    table: 'services',
    requiredFields: ['name_en'],
    optionalFields: ['name_ru', 'description_en', 'description_ru', 'cover_image', 'price', 'currency', 'category_id', 'is_active'],
    fieldLabels: {
      name_en: { en: 'Name (EN)', ru: 'Название (EN)' },
      name_ru: { en: 'Name (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      price: { en: 'Price', ru: 'Цена' },
      currency: { en: 'Currency', ru: 'Валюта' },
      category_id: { en: 'Category ID', ru: 'ID категории' },
      is_active: { en: 'Active', ru: 'Активен' },
    },
  },
  {
    id: 'properties',
    name: 'Real Estate',
    nameRu: 'Недвижимость',
    table: 'properties',
    requiredFields: ['title_en', 'property_type', 'listing_type'],
    optionalFields: ['title_ru', 'description_en', 'description_ru', 'cover_image', 'address', 'district', 'price', 'price_period', 'currency', 'bedrooms', 'bathrooms', 'area_sqm', 'floor', 'furnishing_level', 'amenities', 'is_active', 'is_featured'],
    fieldLabels: {
      title_en: { en: 'Title (EN)', ru: 'Название (EN)' },
      title_ru: { en: 'Title (RU)', ru: 'Название (RU)' },
      description_en: { en: 'Description (EN)', ru: 'Описание (EN)' },
      description_ru: { en: 'Description (RU)', ru: 'Описание (RU)' },
      cover_image: { en: 'Cover Image', ru: 'Обложка' },
      address: { en: 'Address', ru: 'Адрес' },
      district: { en: 'District', ru: 'Район' },
      price: { en: 'Price', ru: 'Цена' },
      price_period: { en: 'Price Period', ru: 'Период оплаты' },
      currency: { en: 'Currency', ru: 'Валюта' },
      property_type: { en: 'Property Type', ru: 'Тип недвижимости' },
      listing_type: { en: 'Listing Type (rent/sale)', ru: 'Тип объявления (аренда/продажа)' },
      bedrooms: { en: 'Bedrooms', ru: 'Спальни' },
      bathrooms: { en: 'Bathrooms', ru: 'Ванные' },
      area_sqm: { en: 'Area (sqm)', ru: 'Площадь (м²)' },
      floor: { en: 'Floor', ru: 'Этаж' },
      furnishing_level: { en: 'Furnishing', ru: 'Меблировка' },
      amenities: { en: 'Amenities', ru: 'Удобства' },
      is_active: { en: 'Active', ru: 'Активен' },
      is_featured: { en: 'Featured', ru: 'Рекомендуемый' },
    },
  },
];

/**
 * Try to auto-map a source column name to a target field
 */
export function autoMapColumn(sourceColumn: string, targetFields: string[]): string | null {
  const normalizedSource = sourceColumn.toLowerCase().trim();
  
  // Direct match in dictionary
  if (autoMappingDictionary[normalizedSource]) {
    const mappedField = autoMappingDictionary[normalizedSource];
    if (targetFields.includes(mappedField)) {
      return mappedField;
    }
  }
  
  // Check for partial matches
  for (const targetField of targetFields) {
    if (normalizedSource.includes(targetField) || targetField.includes(normalizedSource)) {
      return targetField;
    }
  }
  
  return null;
}

/**
 * Get all available fields for a target table
 */
export function getTargetFields(targetId: string): string[] {
  const target = importTargets.find(t => t.id === targetId);
  if (!target) return [];
  return [...target.requiredFields, ...target.optionalFields];
}
