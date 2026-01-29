import { 
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Home, Car, Ticket, Flower2, Waves,
  Pill, Compass, Scale, Wrench, Anchor,
  Baby, Brush, ShoppingBag, PawPrint, LucideIcon
} from 'lucide-react';

export interface SearchItem {
  id: string;
  type: string;
  title_en: string;
  title_ru: string;
  image: string;
  price: number;
  location: string;
  location_ru: string;
  rating: number;
  path: string;
}

export interface TypeConfig {
  icon: LucideIcon;
  label: { en: string; ru: string };
  color: string;
}

/**
 * Centralized search demo data - single source of truth
 */
export const searchDemoData: SearchItem[] = [
  // Beauty & Spa
  { id: 'salon-1', type: 'beauty', title_en: 'Orchid Spa & Wellness', title_ru: 'Орхидея СПА и Велнес', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=400', price: 1500, location: 'Kata Beach', location_ru: 'Ката Бич', rating: 4.9, path: '/beauty/salon/1' },
  { id: 'salon-2', type: 'beauty', title_en: 'Lotus Nail Studio', title_ru: 'Лотус Маникюр Студио', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', price: 800, location: 'Patong', location_ru: 'Патонг', rating: 4.7, path: '/beauty/salon/2' },
  { id: 'salon-3', type: 'beauty', title_en: 'Thai Massage Center', title_ru: 'Тайский массажный центр', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', price: 500, location: 'Rawai', location_ru: 'Равай', rating: 4.8, path: '/beauty/salon/3' },
  
  // Food & Restaurants (updated to /restaurants paths)
  { id: 'rest-1', type: 'food', title_en: 'Ocean View Restaurant', title_ru: 'Ресторан с видом на океан', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', price: 500, location: 'Rawai', location_ru: 'Равай', rating: 4.8, path: '/restaurants/rest-1' },
  { id: 'rest-2', type: 'food', title_en: 'Thai Street Kitchen', title_ru: 'Тайская уличная кухня', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', price: 200, location: 'Phuket Town', location_ru: 'Пхукет Таун', rating: 4.6, path: '/restaurants/rest-2' },
  { id: 'rest-3', type: 'food', title_en: 'Seafood Paradise', title_ru: 'Рай морепродуктов', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', price: 800, location: 'Patong', location_ru: 'Патонг', rating: 4.9, path: '/restaurants/rest-3' },
  
  // Fitness
  { id: 'gym-1', type: 'fitness', title_en: 'Tiger Muay Thai', title_ru: 'Тигр Муай Тай', image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400', price: 800, location: 'Chalong', location_ru: 'Чалонг', rating: 4.9, path: '/fitness/gym/1' },
  { id: 'gym-2', type: 'fitness', title_en: 'Phuket Yoga Center', title_ru: 'Пхукет Йога Центр', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', price: 500, location: 'Kamala', location_ru: 'Камала', rating: 4.8, path: '/fitness/gym/2' },
  
  // Medical
  { id: 'clinic-1', type: 'medical', title_en: 'Bangkok Hospital Phuket', title_ru: 'Бангкок Госпиталь Пхукет', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', price: 1500, location: 'Phuket Town', location_ru: 'Пхукет Таун', rating: 4.9, path: '/medical/clinic/1' },
  { id: 'clinic-2', type: 'medical', title_en: 'Phuket Dental Clinic', title_ru: 'Пхукет Стоматология', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400', price: 1000, location: 'Patong', location_ru: 'Патонг', rating: 4.7, path: '/medical/clinic/2' },
  
  // Education
  { id: 'course-1', type: 'education', title_en: 'English for Kids', title_ru: 'Английский для детей', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', price: 150, location: 'Patong', location_ru: 'Патонг', rating: 4.9, path: '/education/course/1' },
  { id: 'tutor-1', type: 'education', title_en: 'Sarah Johnson - English Teacher', title_ru: 'Сара Джонсон - Преподаватель английского', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', price: 500, location: 'Patong', location_ru: 'Патонг', rating: 4.9, path: '/education/tutor/t1' },
  
  // Property
  { id: 'prop-1', type: 'property', title_en: 'Luxury Ocean View Villa', title_ru: 'Роскошная вилла с видом на океан', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400', price: 85000, location: 'Kamala', location_ru: 'Камала', rating: 4.9, path: '/property/prop-1' },
  { id: 'prop-2', type: 'property', title_en: 'Modern Condo Patong', title_ru: 'Современная квартира Патонг', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', price: 25000, location: 'Patong', location_ru: 'Патонг', rating: 4.6, path: '/property/prop-2' },
  
  // Transport
  { id: 'car-1', type: 'transport', title_en: 'Toyota Camry 2023', title_ru: 'Тойота Камри 2023', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400', price: 1500, location: 'Patong', location_ru: 'Патонг', rating: 4.8, path: '/transport/vehicle/car-1' },
  { id: 'bike-1', type: 'transport', title_en: 'Honda PCX 160', title_ru: 'Хонда PCX 160', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', price: 300, location: 'Various', location_ru: 'Разные', rating: 4.7, path: '/transport/vehicle/bike-1' },
  
  // Tours & Events
  { id: 'tour-1', type: 'tours', title_en: 'Phi Phi Islands Tour', title_ru: 'Тур на острова Пхи-Пхи', image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400', price: 2500, location: 'Rassada Pier', location_ru: 'Пирс Рассада', rating: 4.9, path: '/tours/tour-1' },
  { id: 'tour-2', type: 'tours', title_en: 'James Bond Island Trip', title_ru: 'Экскурсия на остров Джеймса Бонда', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400', price: 2200, location: 'Ao Po', location_ru: 'Ао По', rating: 4.8, path: '/tours/tour-2' },
  { id: 'event-1', type: 'events', title_en: 'Phuket Night Market', title_ru: 'Ночной рынок Пхукета', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', price: 0, location: 'Old Town', location_ru: 'Старый город', rating: 4.5, path: '/events/event-1' },
  
  // Water Activities & Yachts
  { id: 'water-1', type: 'water', title_en: 'Scuba Diving Experience', title_ru: 'Дайвинг с аквалангом', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', price: 3500, location: 'Chalong', location_ru: 'Чалонг', rating: 4.9, path: '/water/water-1' },
  { id: 'yacht-1', type: 'yachts', title_en: 'Luxury Yacht Charter', title_ru: 'Аренда люксовой яхты', image: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=400', price: 45000, location: 'Ao Po Marina', location_ru: 'Марина Ао По', rating: 4.9, path: '/yachts' },
  { id: 'yacht-2', type: 'yachts', title_en: 'Catamaran Experience', title_ru: 'Катамаран прогулка', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400', price: 25000, location: 'Royal Phuket Marina', location_ru: 'Рояль Пхукет Марина', rating: 4.8, path: '/yachts' },
  { id: 'yacht-3', type: 'yachts', title_en: 'Sunset Yacht Cruise', title_ru: 'Яхта на закате', image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=400', price: 15000, location: 'Chalong Bay', location_ru: 'Залив Чалонг', rating: 4.7, path: '/yachts' },
  
  // Legal & Business
  { id: 'legal-1', type: 'legal', title_en: 'Thai Legal Experts', title_ru: 'Тайские юристы', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400', price: 2000, location: 'Phuket Town', location_ru: 'Пхукет Таун', rating: 4.8, path: '/legal/provider/1' },
  { id: 'legal-2', type: 'legal', title_en: 'Phuket Visa Services', title_ru: 'Визовые услуги Пхукета', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', price: 1500, location: 'Patong', location_ru: 'Патонг', rating: 4.7, path: '/legal/provider/2' },
  
  // Pharmacy & Flowers
  { id: 'pharmacy-1', type: 'pharmacy', title_en: 'Boots Pharmacy', title_ru: 'Аптека Бутс', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', price: 0, location: 'Patong', location_ru: 'Патонг', rating: 4.6, path: '/pharmacy/1' },
  { id: 'flowers-1', type: 'flowers', title_en: 'Orchid Garden Florist', title_ru: 'Флорист Орхидея', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400', price: 500, location: 'Phuket Town', location_ru: 'Пхукет Таун', rating: 4.8, path: '/flowers/shop/1' },
  
  // Services
  { id: 'service-1', type: 'services', title_en: 'Home Cleaning Service', title_ru: 'Уборка дома', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', price: 800, location: 'All areas', location_ru: 'Все районы', rating: 4.7, path: '/services/provider/1' },
];

/**
 * Category type configuration for search UI
 */
export const searchTypeConfig: Record<string, TypeConfig> = {
  category: { icon: Compass, label: { en: 'Category', ru: 'Категория' }, color: 'from-primary to-primary/70' },
  beauty: { icon: Sparkles, label: { en: 'Beauty', ru: 'Красота' }, color: 'from-pink-500 to-purple-500' },
  food: { icon: UtensilsCrossed, label: { en: 'Food', ru: 'Еда' }, color: 'from-orange-500 to-red-500' },
  fitness: { icon: Dumbbell, label: { en: 'Fitness', ru: 'Фитнес' }, color: 'from-blue-500 to-cyan-500' },
  medical: { icon: Stethoscope, label: { en: 'Medical', ru: 'Медицина' }, color: 'from-emerald-500 to-green-500' },
  education: { icon: GraduationCap, label: { en: 'Education', ru: 'Образование' }, color: 'from-yellow-500 to-orange-500' },
  property: { icon: Home, label: { en: 'Property', ru: 'Недвижимость' }, color: 'from-teal-500 to-emerald-500' },
  transport: { icon: Car, label: { en: 'Transport', ru: 'Транспорт' }, color: 'from-indigo-500 to-blue-500' },
  tours: { icon: Compass, label: { en: 'Tours', ru: 'Туры' }, color: 'from-amber-500 to-orange-500' },
  events: { icon: Ticket, label: { en: 'Events', ru: 'События' }, color: 'from-purple-500 to-pink-500' },
  water: { icon: Waves, label: { en: 'Water Sports', ru: 'Водный спорт' }, color: 'from-cyan-500 to-blue-500' },
  yachts: { icon: Anchor, label: { en: 'Yachts', ru: 'Яхты' }, color: 'from-blue-600 to-indigo-600' },
  legal: { icon: Scale, label: { en: 'Legal', ru: 'Юридические' }, color: 'from-indigo-500 to-blue-600' },
  pharmacy: { icon: Pill, label: { en: 'Pharmacy', ru: 'Аптеки' }, color: 'from-green-500 to-emerald-500' },
  flowers: { icon: Flower2, label: { en: 'Flowers', ru: 'Цветы' }, color: 'from-rose-500 to-pink-500' },
  services: { icon: Wrench, label: { en: 'Services', ru: 'Услуги' }, color: 'from-slate-500 to-zinc-600' },
  cleaning: { icon: Brush, label: { en: 'Cleaning', ru: 'Уборка' }, color: 'from-sky-500 to-blue-500' },
  babysitter: { icon: Baby, label: { en: 'Babysitter', ru: 'Няня' }, color: 'from-pink-400 to-rose-500' },
  pets: { icon: PawPrint, label: { en: 'Pets', ru: 'Питомцы' }, color: 'from-amber-500 to-yellow-500' },
  market: { icon: ShoppingBag, label: { en: 'Market', ru: 'Магазины' }, color: 'from-violet-500 to-purple-500' },
  product: { icon: ShoppingBag, label: { en: 'Product', ru: 'Товар' }, color: 'from-violet-500 to-purple-600' },
  marketCategory: { icon: ShoppingBag, label: { en: 'Shop Category', ru: 'Категория товаров' }, color: 'from-purple-500 to-violet-600' },
};

/**
 * Trending/popular search terms by language
 */
export const trendingSearches: Record<string, string[]> = {
  en: ['beach villa', 'thai massage', 'scooter rental', 'phi phi tour', 'yacht', 'dentist'],
  ru: ['вилла на пляже', 'тайский массаж', 'аренда скутера', 'тур пхи-пхи', 'яхты', 'стоматолог'],
  th: ['วิลล่าชายหาด', 'นวดแผนไทย', 'เช่ามอเตอร์ไซค์', 'ทัวร์พีพี', 'เรือยอชท์', 'ทันตแพทย์'],
};

/**
 * Get all category types for filters
 */
export const getSearchCategories = () => Object.keys(searchTypeConfig);

/**
 * Filter search items by query and type
 */
export function filterSearchItems(
  items: SearchItem[],
  query: string,
  selectedType: string | null,
  language: 'en' | 'ru'
): SearchItem[] {
  let results = items;
  
  if (selectedType) {
    results = results.filter(item => item.type === selectedType);
  }
  
  if (query.trim()) {
    const searchLower = query.toLowerCase();
    results = results.filter(item => {
      const title = language === 'ru' ? item.title_ru : item.title_en;
      const location = language === 'ru' ? item.location_ru : item.location;
      return (
        title.toLowerCase().includes(searchLower) ||
        location.toLowerCase().includes(searchLower) ||
        item.type.includes(searchLower)
      );
    });
  }
  
  return results;
}
