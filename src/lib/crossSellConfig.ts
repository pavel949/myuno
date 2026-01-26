// Cross-sell configuration matrix
// Defines logical connections between verticals for upselling

export interface CrossSellLink {
  id: string;
  icon: string;
  path: string;
  labelEn: string;
  labelRu: string;
  descriptionEn?: string;
  descriptionRu?: string;
}

export const CROSS_SELL_MATRIX: Record<string, CrossSellLink[]> = {
  water: [
    { id: 'yachts', icon: '🛥️', path: '/yachts', labelEn: 'Yacht Rentals', labelRu: 'Аренда яхт', descriptionEn: 'Private charters', descriptionRu: 'Приватные туры' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dinner after diving', descriptionRu: 'Ужин после дайвинга' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get a ride', descriptionRu: 'Заказать машину' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Snacks & drinks', descriptionRu: 'Снеки и напитки' },
  ],
  yachts: [
    { id: 'water', icon: '🤿', path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Diving & snorkeling', descriptionRu: 'Дайвинг и снорклинг' },
    { id: 'restaurants', icon: '🍾', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Celebrate ashore', descriptionRu: 'Праздник на берегу' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Romantic touch', descriptionRu: 'Романтика' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'To the marina', descriptionRu: 'До причала' },
  ],
  property: [
    { id: 'services', icon: '🧹', path: '/services', labelEn: 'Home Services', labelRu: 'Домашний сервис', descriptionEn: 'Cleaning & more', descriptionRu: 'Уборка и сервис' },
    { id: 'legal', icon: '⚖️', path: '/legal', labelEn: 'Legal', labelRu: 'Юристы', descriptionEn: 'Contract help', descriptionRu: 'Помощь с договором' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', descriptionEn: 'Vehicle rental', descriptionRu: 'Аренда авто' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Home essentials', descriptionRu: 'Товары для дома' },
  ],
  tours: [
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get there easy', descriptionRu: 'Удобный трансфер' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Local cuisine', descriptionRu: 'Местная кухня' },
    { id: 'events', icon: '🎉', path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Whats on', descriptionRu: 'Что происходит' },
    { id: 'water', icon: '🌊', path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Beach activities', descriptionRu: 'Активности на воде' },
  ],
  restaurants: [
    { id: 'delivery', icon: '🛵', path: '/delivery', labelEn: 'Delivery', labelRu: 'Доставка', descriptionEn: 'Order to home', descriptionRu: 'Заказать домой' },
    { id: 'events', icon: '🎉', path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Shows & parties', descriptionRu: 'Шоу и вечеринки' },
    { id: 'beauty', icon: '💆', path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Relax after', descriptionRu: 'Расслабиться после' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get home safe', descriptionRu: 'Безопасно домой' },
  ],
  market: [
    { id: 'delivery', icon: '🛵', path: '/delivery', labelEn: 'Delivery', labelRu: 'Доставка', descriptionEn: 'Fast delivery', descriptionRu: 'Быстрая доставка' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dine out', descriptionRu: 'Поесть вне дома' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Fresh bouquets', descriptionRu: 'Свежие букеты' },
    { id: 'services', icon: '🧹', path: '/services', labelEn: 'Services', labelRu: 'Услуги', descriptionEn: 'Home help', descriptionRu: 'Помощь по дому' },
  ],
  flowers: [
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Romantic dinner', descriptionRu: 'Романтический ужин' },
    { id: 'beauty', icon: '💆', path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Pamper yourself', descriptionRu: 'Побаловать себя' },
    { id: 'events', icon: '🎉', path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Special occasions', descriptionRu: 'Особые события' },
    { id: 'yachts', icon: '🛥️', path: '/yachts', labelEn: 'Yachts', labelRu: 'Яхты', descriptionEn: 'Romantic cruise', descriptionRu: 'Романтический круиз' },
  ],
  medical: [
    { id: 'pharmacy', icon: '💊', path: '/pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', descriptionEn: 'Medications', descriptionRu: 'Лекарства' },
    { id: 'services', icon: '🏠', path: '/services', labelEn: 'Home Services', labelRu: 'Домашний уход', descriptionEn: 'Recovery help', descriptionRu: 'Помощь дома' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Safe ride home', descriptionRu: 'Безопасно домой' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Health products', descriptionRu: 'Товары для здоровья' },
  ],
  beauty: [
    { id: 'fitness', icon: '💪', path: '/fitness', labelEn: 'Fitness', labelRu: 'Фитнес', descriptionEn: 'Stay active', descriptionRu: 'Оставайся в форме' },
    { id: 'medical', icon: '🏥', path: '/medical', labelEn: 'Medical', labelRu: 'Медицина', descriptionEn: 'Health check', descriptionRu: 'Проверка здоровья' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Treat yourself', descriptionRu: 'Побалуй себя' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Healthy food', descriptionRu: 'Здоровая еда' },
  ],
  transport: [
    { id: 'tours', icon: '🗺️', path: '/tours', labelEn: 'Tours', labelRu: 'Туры', descriptionEn: 'Explore island', descriptionRu: 'Исследуй остров' },
    { id: 'property', icon: '🏠', path: '/property', labelEn: 'Property', labelRu: 'Жильё', descriptionEn: 'Find a place', descriptionRu: 'Найти жильё' },
    { id: 'water', icon: '🌊', path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Beach fun', descriptionRu: 'Развлечения на воде' },
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Grab a bite', descriptionRu: 'Перекусить' },
  ],
  services: [
    { id: 'property', icon: '🏠', path: '/property', labelEn: 'Property', labelRu: 'Жильё', descriptionEn: 'Find a home', descriptionRu: 'Найти жильё' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Cleaning supplies', descriptionRu: 'Бытовая химия' },
    { id: 'legal', icon: '⚖️', path: '/legal', labelEn: 'Legal', labelRu: 'Юристы', descriptionEn: 'Documents help', descriptionRu: 'Помощь с документами' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', descriptionEn: 'Vehicle rental', descriptionRu: 'Аренда авто' },
  ],
  events: [
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Pre-show dinner', descriptionRu: 'Ужин перед шоу' },
    { id: 'transport', icon: '🚗', path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get there easy', descriptionRu: 'Удобный трансфер' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'For the occasion', descriptionRu: 'К случаю' },
    { id: 'beauty', icon: '💆', path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота', descriptionEn: 'Get ready', descriptionRu: 'Подготовиться' },
  ],
  fitness: [
    { id: 'beauty', icon: '💆', path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Recovery massage', descriptionRu: 'Восстановительный массаж' },
    { id: 'medical', icon: '🏥', path: '/medical', labelEn: 'Medical', labelRu: 'Медицина', descriptionEn: 'Health check', descriptionRu: 'Проверка здоровья' },
    { id: 'tours', icon: '🗺️', path: '/tours', labelEn: 'Tours', labelRu: 'Туры', descriptionEn: 'Active tours', descriptionRu: 'Активные туры' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Sport nutrition', descriptionRu: 'Спортпитание' },
  ],
  delivery: [
    { id: 'restaurants', icon: '🍽️', path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dine in', descriptionRu: 'Поесть в ресторане' },
    { id: 'market', icon: '🛒', path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Groceries', descriptionRu: 'Продукты' },
    { id: 'flowers', icon: '💐', path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Send flowers', descriptionRu: 'Отправить цветы' },
    { id: 'pharmacy', icon: '💊', path: '/pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', descriptionEn: 'Medications', descriptionRu: 'Лекарства' },
  ],
};

export function getCrossSellLinks(vertical: string, maxItems = 4): CrossSellLink[] {
  const links = CROSS_SELL_MATRIX[vertical] || [];
  return links.slice(0, maxItems);
}
