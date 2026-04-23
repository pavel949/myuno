// Cross-sell configuration matrix
// Defines logical connections between verticals for upselling

import type { LucideIcon } from 'lucide-react';
import {
  Ship, UtensilsCrossed, Car, ShoppingCart, Waves, Wine, Flower2, Dumbbell,
  Hospital, Pill, Home, Scale, MapPin, PartyPopper, Smile, Brush, Bike,
  Plane, CreditCard, Baby, Wifi, Sparkles
} from 'lucide-react';

export interface CrossSellLink {
  id: string;
  icon: LucideIcon;
  path: string;
  labelEn: string;
  labelRu: string;
  descriptionEn?: string;
  descriptionRu?: string;
  gradient?: string; // Tailwind gradient classes
}

export const CROSS_SELL_MATRIX: Record<string, CrossSellLink[]> = {
  water: [
    { id: 'yachts', icon: Ship, path: '/yachts', labelEn: 'Boat Charters', labelRu: 'Чартер', descriptionEn: 'Private charters', descriptionRu: 'Приватные туры', gradient: 'from-primary to-primary' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dinner after diving', descriptionRu: 'Ужин после дайвинга', gradient: 'from-accent to-red-500' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get a ride', descriptionRu: 'Заказать машину', gradient: 'from-slate-500 to-slate-700' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Snacks & drinks', descriptionRu: 'Снеки и напитки', gradient: 'from-success to-success' },
  ],
  yachts: [
    { id: 'water', icon: Waves, path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Diving & snorkeling', descriptionRu: 'Дайвинг и снорклинг', gradient: 'from-primary to-primary' },
    { id: 'restaurants', icon: Wine, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Celebrate ashore', descriptionRu: 'Праздник на берегу', gradient: 'from-accent to-accent' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Romantic touch', descriptionRu: 'Романтика', gradient: 'from-accent to-accent' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'To the marina', descriptionRu: 'До причала', gradient: 'from-slate-500 to-slate-700' },
  ],
  property: [
    { id: 'services', icon: Brush, path: '/services', labelEn: 'Home Services', labelRu: 'Домашний сервис', descriptionEn: 'Cleaning & more', descriptionRu: 'Уборка и сервис', gradient: 'from-success to-primary' },
    { id: 'legal', icon: Scale, path: '/legal', labelEn: 'Legal', labelRu: 'Юристы', descriptionEn: 'Contract help', descriptionRu: 'Помощь с договором', gradient: 'from-accent to-accent' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', descriptionEn: 'Vehicle rental', descriptionRu: 'Аренда авто', gradient: 'from-slate-500 to-slate-700' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Home essentials', descriptionRu: 'Товары для дома', gradient: 'from-success to-success' },
  ],
  tours: [
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get there easy', descriptionRu: 'Удобный трансфер', gradient: 'from-slate-500 to-slate-700' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Local cuisine', descriptionRu: 'Местная кухня', gradient: 'from-accent to-red-500' },
    { id: 'events', icon: PartyPopper, path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Whats on', descriptionRu: 'Что происходит', gradient: 'from-primary to-accent' },
    { id: 'water', icon: Waves, path: '/experiences?type=activity', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Beach activities', descriptionRu: 'Активности на воде', gradient: 'from-primary to-primary' },
  ],
  experiences: [
    { id: 'yachts', icon: Ship, path: '/yachts', labelEn: 'Boat Charters', labelRu: 'Чартер', descriptionEn: 'Private charters', descriptionRu: 'Приватные туры', gradient: 'from-primary to-primary' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Local cuisine', descriptionRu: 'Местная кухня', gradient: 'from-accent to-red-500' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get there easy', descriptionRu: 'Удобный трансфер', gradient: 'from-slate-500 to-slate-700' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Snacks & drinks', descriptionRu: 'Снеки и напитки', gradient: 'from-success to-success' },
  ],
  restaurants: [
    { id: 'delivery', icon: Bike, path: '/delivery', labelEn: 'Delivery', labelRu: 'Доставка', descriptionEn: 'Order to home', descriptionRu: 'Заказать домой', gradient: 'from-accent to-red-500' },
    { id: 'events', icon: PartyPopper, path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Shows & parties', descriptionRu: 'Шоу и вечеринки', gradient: 'from-primary to-accent' },
    { id: 'beauty', icon: Smile, path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Relax after', descriptionRu: 'Расслабиться после', gradient: 'from-accent to-accent' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get home safe', descriptionRu: 'Безопасно домой', gradient: 'from-slate-500 to-slate-700' },
  ],
  market: [
    { id: 'delivery', icon: Bike, path: '/delivery', labelEn: 'Delivery', labelRu: 'Доставка', descriptionEn: 'Fast delivery', descriptionRu: 'Быстрая доставка', gradient: 'from-accent to-red-500' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dine out', descriptionRu: 'Поесть вне дома', gradient: 'from-accent to-red-500' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Fresh bouquets', descriptionRu: 'Свежие букеты', gradient: 'from-accent to-accent' },
    { id: 'services', icon: Brush, path: '/services', labelEn: 'Services', labelRu: 'Услуги', descriptionEn: 'Home help', descriptionRu: 'Помощь по дому', gradient: 'from-success to-primary' },
  ],
  flowers: [
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Romantic dinner', descriptionRu: 'Романтический ужин', gradient: 'from-accent to-red-500' },
    { id: 'beauty', icon: Smile, path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Pamper yourself', descriptionRu: 'Побаловать себя', gradient: 'from-accent to-accent' },
    { id: 'events', icon: PartyPopper, path: '/events', labelEn: 'Events', labelRu: 'События', descriptionEn: 'Special occasions', descriptionRu: 'Особые события', gradient: 'from-primary to-accent' },
    { id: 'yachts', icon: Ship, path: '/yachts', labelEn: 'Boat Charters', labelRu: 'Чартер', descriptionEn: 'Romantic cruise', descriptionRu: 'Романтический круиз', gradient: 'from-primary to-primary' },
  ],
  medical: [
    { id: 'pharmacy', icon: Pill, path: '/pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', descriptionEn: 'Medications', descriptionRu: 'Лекарства', gradient: 'from-success to-success' },
    { id: 'services', icon: Home, path: '/services', labelEn: 'Home Services', labelRu: 'Домашний уход', descriptionEn: 'Recovery help', descriptionRu: 'Помощь дома', gradient: 'from-success to-primary' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Safe ride home', descriptionRu: 'Безопасно домой', gradient: 'from-slate-500 to-slate-700' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Health products', descriptionRu: 'Товары для здоровья', gradient: 'from-success to-success' },
  ],
  beauty: [
    { id: 'fitness', icon: Dumbbell, path: '/fitness', labelEn: 'Fitness', labelRu: 'Фитнес', descriptionEn: 'Stay active', descriptionRu: 'Оставайся в форме', gradient: 'from-accent to-red-500' },
    { id: 'medical', icon: Hospital, path: '/medical', labelEn: 'Medical', labelRu: 'Медицина', descriptionEn: 'Health check', descriptionRu: 'Проверка здоровья', gradient: 'from-primary to-primary' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Treat yourself', descriptionRu: 'Побалуй себя', gradient: 'from-accent to-accent' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Healthy food', descriptionRu: 'Здоровая еда', gradient: 'from-accent to-red-500' },
  ],
  transport: [
    { id: 'tours', icon: MapPin, path: '/tours', labelEn: 'Tours', labelRu: 'Туры', descriptionEn: 'Explore island', descriptionRu: 'Исследуй остров', gradient: 'from-success to-success' },
    { id: 'property', icon: Home, path: '/property', labelEn: 'Property', labelRu: 'Жильё', descriptionEn: 'Find a place', descriptionRu: 'Найти жильё', gradient: 'from-primary to-primary' },
    { id: 'water', icon: Waves, path: '/water', labelEn: 'Water Sports', labelRu: 'Водный спорт', descriptionEn: 'Beach fun', descriptionRu: 'Развлечения на воде', gradient: 'from-primary to-primary' },
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Grab a bite', descriptionRu: 'Перекусить', gradient: 'from-accent to-red-500' },
  ],
  services: [
    { id: 'property', icon: Home, path: '/property', labelEn: 'Property', labelRu: 'Жильё', descriptionEn: 'Find a home', descriptionRu: 'Найти жильё', gradient: 'from-primary to-primary' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Cleaning supplies', descriptionRu: 'Бытовая химия', gradient: 'from-success to-success' },
    { id: 'legal', icon: Scale, path: '/legal', labelEn: 'Legal', labelRu: 'Юристы', descriptionEn: 'Documents help', descriptionRu: 'Помощь с документами', gradient: 'from-accent to-accent' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', descriptionEn: 'Vehicle rental', descriptionRu: 'Аренда авто', gradient: 'from-slate-500 to-slate-700' },
  ],
  events: [
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Pre-show dinner', descriptionRu: 'Ужин перед шоу', gradient: 'from-accent to-red-500' },
    { id: 'transport', icon: Car, path: '/transport', labelEn: 'Transport', labelRu: 'Трансфер', descriptionEn: 'Get there easy', descriptionRu: 'Удобный трансфер', gradient: 'from-slate-500 to-slate-700' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'For the occasion', descriptionRu: 'К случаю', gradient: 'from-accent to-accent' },
    { id: 'beauty', icon: Smile, path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота', descriptionEn: 'Get ready', descriptionRu: 'Подготовиться', gradient: 'from-accent to-accent' },
  ],
  fitness: [
    { id: 'beauty', icon: Smile, path: '/beauty', labelEn: 'Beauty & SPA', labelRu: 'Красота и СПА', descriptionEn: 'Recovery massage', descriptionRu: 'Восстановительный массаж', gradient: 'from-accent to-accent' },
    { id: 'medical', icon: Hospital, path: '/medical', labelEn: 'Medical', labelRu: 'Медицина', descriptionEn: 'Health check', descriptionRu: 'Проверка здоровья', gradient: 'from-primary to-primary' },
    { id: 'tours', icon: MapPin, path: '/tours', labelEn: 'Tours', labelRu: 'Туры', descriptionEn: 'Active tours', descriptionRu: 'Активные туры', gradient: 'from-success to-success' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Sport nutrition', descriptionRu: 'Спортпитание', gradient: 'from-success to-success' },
  ],
  delivery: [
    { id: 'restaurants', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Dine in', descriptionRu: 'Поесть в ресторане', gradient: 'from-accent to-red-500' },
    { id: 'market', icon: ShoppingCart, path: '/market', labelEn: 'Market', labelRu: 'Маркет', descriptionEn: 'Groceries', descriptionRu: 'Продукты', gradient: 'from-success to-success' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Send flowers', descriptionRu: 'Отправить цветы', gradient: 'from-accent to-accent' },
    { id: 'pharmacy', icon: Pill, path: '/pharmacy', labelEn: 'Pharmacy', labelRu: 'Аптека', descriptionEn: 'Medications', descriptionRu: 'Лекарства', gradient: 'from-success to-success' },
  ],
  // Post-booking cross-sell for property rentals
  property_booking: [
    { id: 'transfer', icon: Plane, path: '/transport', labelEn: 'Airport Transfer', labelRu: 'Трансфер', descriptionEn: 'Meet & greet', descriptionRu: 'Встреча в аэропорту', gradient: 'from-primary to-primary' },
    { id: 'car_rental', icon: Car, path: '/transport?type=rental', labelEn: 'Rent a Car', labelRu: 'Аренда авто', descriptionEn: 'Cars & bikes', descriptionRu: 'Авто и байки', gradient: 'from-slate-600 to-slate-800' },
    { id: 'grocery', icon: ShoppingCart, path: '/market?category=grocery', labelEn: 'Groceries', labelRu: 'Продукты', descriptionEn: 'Stock fridge', descriptionRu: 'Заполнить холодильник', gradient: 'from-success to-success' },
    { id: 'flowers', icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', descriptionEn: 'Welcome bouquet', descriptionRu: 'Букет к приезду', gradient: 'from-accent to-accent' },
    { id: 'cleaning', icon: Sparkles, path: '/services?type=cleaning', labelEn: 'Extra Cleaning', labelRu: 'Уборка', descriptionEn: 'During stay', descriptionRu: 'Во время проживания', gradient: 'from-success to-primary' },
    { id: 'bank', icon: CreditCard, path: '/banking', labelEn: 'Open Account', labelRu: 'Открыть счёт', descriptionEn: 'Thai bank', descriptionRu: 'Тайский банк', gradient: 'from-accent to-accent' },
    { id: 'restaurant', icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Restaurants', labelRu: 'Рестораны', descriptionEn: 'Book a table', descriptionRu: 'Забронировать столик', gradient: 'from-accent to-red-500' },
    { id: 'babysitter', icon: Baby, path: '/babysitter', labelEn: 'Babysitter', labelRu: 'Няня', descriptionEn: 'Childcare', descriptionRu: 'Присмотр за детьми', gradient: 'from-primary to-primary' },
    { id: 'sim', icon: Wifi, path: '/market?category=sim', labelEn: 'SIM Card', labelRu: 'SIM-карта', descriptionEn: 'Stay connected', descriptionRu: 'Оставайся на связи', gradient: 'from-primary to-primary' },
  ],
};

export function getCrossSellLinks(vertical: string, maxItems = 4): CrossSellLink[] {
  const links = CROSS_SELL_MATRIX[vertical] || [];
  return links.slice(0, maxItems);
}

// Contextual cross-sell for experience categories
export interface ContextualCrossSellItem {
  vertical: string;
  titleEn: string;
  titleRu: string;
}

export const CONTEXTUAL_CROSS_SELL: Record<string, ContextualCrossSellItem[]> = {
  zipline: [
    { vertical: 'restaurants', titleEn: 'Celebrate After Your Adventure!', titleRu: 'Отпразднуйте после приключения!' },
    { vertical: 'tours', titleEn: 'More Adventures Nearby', titleRu: 'Ещё приключения рядом' },
  ],
  adventure: [
    { vertical: 'restaurants', titleEn: 'Celebrate After Your Adventure!', titleRu: 'Отпразднуйте после приключения!' },
    { vertical: 'tours', titleEn: 'More Adventures Nearby', titleRu: 'Ещё приключения рядом' },
  ],
  waterpark: [
    { vertical: 'restaurants', titleEn: 'Hungry After the Slides?', titleRu: 'Проголодались после горок?' },
    { vertical: 'market', titleEn: 'Beach Gear & Sunscreen', titleRu: 'Пляжные товары' },
  ],
  wildlife: [
    { vertical: 'tours', titleEn: 'More Nature Tours', titleRu: 'Ещё туры на природу' },
    { vertical: 'restaurants', titleEn: 'Thai Dinner Nearby', titleRu: 'Тайский ужин рядом' },
  ],
  cooking_class: [
    { vertical: 'restaurants', titleEn: 'Try the Cuisine', titleRu: 'Попробуйте кухню' },
    { vertical: 'market', titleEn: 'Ingredients & Cookware', titleRu: 'Ингредиенты и посуда' },
  ],
  karting: [
    { vertical: 'restaurants', titleEn: 'Refuel After the Race', titleRu: 'Перекусите после гонки' },
    { vertical: 'experiences', titleEn: 'More Thrills', titleRu: 'Ещё адреналин' },
  ],
  surfing: [
    { vertical: 'restaurants', titleEn: 'Refuel After the Waves', titleRu: 'Перекусите после волн' },
    { vertical: 'market', titleEn: 'Surf Gear', titleRu: 'Снаряжение для сёрфинга' },
  ],
  attraction: [
    { vertical: 'restaurants', titleEn: 'Family Dining Nearby', titleRu: 'Семейный ужин рядом' },
    { vertical: 'tours', titleEn: 'Explore More of Phuket', titleRu: 'Ещё больше Пхукета' },
  ],
  playground: [
    { vertical: 'restaurants', titleEn: 'Kid-Friendly Restaurants', titleRu: 'Рестораны для детей' },
    { vertical: 'experiences', titleEn: 'More Family Fun', titleRu: 'Ещё развлечения для семьи' },
  ],
};

export function getContextualCrossSell(category: string | null | undefined): ContextualCrossSellItem[] {
  if (!category) return [];
  return CONTEXTUAL_CROSS_SELL[category] || [];
}
