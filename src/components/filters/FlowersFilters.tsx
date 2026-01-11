import { FilterConfig, FilterOption } from './UniversalFilter';

// ====== FLOWER OCCASIONS ======
export const flowerOccasionOptions: FilterOption[] = [
  { id: 'birthday', labelEn: 'Birthday', labelRu: 'День рождения', icon: '🎂' },
  { id: 'anniversary', labelEn: 'Anniversary', labelRu: 'Годовщина', icon: '💑' },
  { id: 'romantic', labelEn: 'Romantic', labelRu: 'Романтика', icon: '❤️' },
  { id: 'wedding', labelEn: 'Wedding', labelRu: 'Свадьба', icon: '💒' },
  { id: 'sympathy', labelEn: 'Sympathy', labelRu: 'Соболезнование', icon: '🕊️' },
  { id: 'congratulations', labelEn: 'Congratulations', labelRu: 'Поздравления', icon: '🎉' },
  { id: 'thank-you', labelEn: 'Thank You', labelRu: 'Благодарность', icon: '🙏' },
  { id: 'new-baby', labelEn: 'New Baby', labelRu: 'Новорожденный', icon: '👶' },
];

// ====== FLOWER TYPES ======
export const flowerTypeOptions: FilterOption[] = [
  { id: 'roses', labelEn: 'Roses', labelRu: 'Розы', icon: '🌹' },
  { id: 'peonies', labelEn: 'Peonies', labelRu: 'Пионы', icon: '🌸' },
  { id: 'tulips', labelEn: 'Tulips', labelRu: 'Тюльпаны', icon: '🌷' },
  { id: 'orchids', labelEn: 'Orchids', labelRu: 'Орхидеи', icon: '🪻' },
  { id: 'lilies', labelEn: 'Lilies', labelRu: 'Лилии', icon: '🌺' },
  { id: 'sunflowers', labelEn: 'Sunflowers', labelRu: 'Подсолнухи', icon: '🌻' },
  { id: 'mixed', labelEn: 'Mixed', labelRu: 'Микс', icon: '💐' },
  { id: 'exotic', labelEn: 'Exotic', labelRu: 'Экзотика', icon: '🌴' },
];

// ====== FLOWER COLORS ======
export const flowerColorOptions: FilterOption[] = [
  { id: 'red', labelEn: 'Red', labelRu: 'Красный', icon: '🔴' },
  { id: 'pink', labelEn: 'Pink', labelRu: 'Розовый', icon: '🩷' },
  { id: 'white', labelEn: 'White', labelRu: 'Белый', icon: '⚪' },
  { id: 'yellow', labelEn: 'Yellow', labelRu: 'Желтый', icon: '🟡' },
  { id: 'purple', labelEn: 'Purple', labelRu: 'Фиолетовый', icon: '🟣' },
  { id: 'orange', labelEn: 'Orange', labelRu: 'Оранжевый', icon: '🟠' },
  { id: 'multicolor', labelEn: 'Multicolor', labelRu: 'Многоцветный', icon: '🌈' },
];

// ====== FLOWER FEATURES ======
export const flowerFeatureOptions: FilterOption[] = [
  { id: 'gift-box', labelEn: 'Gift Box', labelRu: 'Подарочная коробка', icon: '🎁' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум', icon: '👑' },
  { id: 'eco-friendly', labelEn: 'Eco Friendly', labelRu: 'Эко', icon: '🌿' },
  { id: 'long-lasting', labelEn: 'Long Lasting', labelRu: 'Долго стоят', icon: '⏳' },
  { id: 'fragrant', labelEn: 'Fragrant', labelRu: 'Ароматные', icon: '🌸' },
  { id: 'with-vase', labelEn: 'With Vase', labelRu: 'С вазой', icon: '🏺' },
];

// ====== DELIVERY OPTIONS ======
export const flowerDeliveryOptions: FilterOption[] = [
  { id: 'express-2h', labelEn: 'Express 2h', labelRu: 'Экспресс 2ч', icon: '⚡' },
  { id: 'same-day', labelEn: 'Same Day', labelRu: 'В тот же день', icon: '📅' },
  { id: 'scheduled', labelEn: 'Scheduled', labelRu: 'По расписанию', icon: '🗓️' },
  { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатная доставка', icon: '🆓' },
];

// ====== COMPLETE FLOWER FILTER CONFIG ======
export const flowerFilterConfig: FilterConfig = {
  sections: [
    {
      id: 'priceLevel',
      titleEn: 'Price Level',
      titleRu: 'Уровень цен',
      type: 'price-level',
      options: [],
    },
    {
      id: 'occasion',
      titleEn: 'Occasion',
      titleRu: 'Повод',
      type: 'multi',
      options: flowerOccasionOptions,
    },
    {
      id: 'flowerType',
      titleEn: 'Flower Type',
      titleRu: 'Тип цветов',
      type: 'multi',
      options: flowerTypeOptions,
    },
    {
      id: 'color',
      titleEn: 'Color',
      titleRu: 'Цвет',
      type: 'multi',
      options: flowerColorOptions,
    },
    {
      id: 'features',
      titleEn: 'Features',
      titleRu: 'Особенности',
      type: 'multi',
      options: flowerFeatureOptions,
    },
    {
      id: 'delivery',
      titleEn: 'Delivery',
      titleRu: 'Доставка',
      type: 'multi',
      options: flowerDeliveryOptions,
    },
  ],
};
