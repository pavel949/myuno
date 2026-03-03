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
  yachts: { icon: Anchor, label: { en: 'Charters', ru: 'Чартер' }, color: 'from-blue-600 to-indigo-600' },
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
