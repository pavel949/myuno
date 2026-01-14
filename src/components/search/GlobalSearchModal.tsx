import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, Clock, TrendingUp, Star,
  Sparkles, UtensilsCrossed, Dumbbell, Stethoscope, 
  GraduationCap, Home, Car, Ticket, Flower2, Waves,
  Pill, Compass, Scale, Wrench, ArrowRight, Anchor,
  Baby, Brush, ShoppingBag, PawPrint, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extended search data with more categories
const searchData = [
  // Beauty & Spa
  { id: 'salon-1', type: 'beauty', titleEn: 'Orchid Spa & Wellness', titleRu: 'Орхидея СПА и Велнес', image: 'https://images.unsplash.com/photo-1540555700478-4c7edcad34c4?w=100', price: 1500, locationEn: 'Kata Beach', locationRu: 'Ката Бич', rating: 4.9, path: '/beauty/salon/1' },
  { id: 'salon-2', type: 'beauty', titleEn: 'Lotus Nail Studio', titleRu: 'Лотус Маникюр Студио', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=100', price: 800, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.7, path: '/beauty/salon/2' },
  { id: 'salon-3', type: 'beauty', titleEn: 'Thai Massage Center', titleRu: 'Тайский массажный центр', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100', price: 500, locationEn: 'Rawai', locationRu: 'Равай', rating: 4.8, path: '/beauty/salon/3' },
  
  // Restaurants
  { id: 'rest-1', type: 'food', titleEn: 'Ocean View Restaurant', titleRu: 'Ресторан с видом на океан', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100', price: 500, locationEn: 'Rawai', locationRu: 'Равай', rating: 4.8, path: '/food/restaurant/1' },
  { id: 'rest-2', type: 'food', titleEn: 'Thai Street Kitchen', titleRu: 'Тайская уличная кухня', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100', price: 200, locationEn: 'Phuket Town', locationRu: 'Пхукет Таун', rating: 4.6, path: '/food/restaurant/2' },
  { id: 'rest-3', type: 'food', titleEn: 'Seafood Paradise', titleRu: 'Рай морепродуктов', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=100', price: 800, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.9, path: '/food/restaurant/3' },
  
  // Fitness
  { id: 'gym-1', type: 'fitness', titleEn: 'Tiger Muay Thai', titleRu: 'Тигр Муай Тай', image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100', price: 800, locationEn: 'Chalong', locationRu: 'Чалонг', rating: 4.9, path: '/fitness/gym/1' },
  { id: 'gym-2', type: 'fitness', titleEn: 'Phuket Yoga Center', titleRu: 'Пхукет Йога Центр', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100', price: 500, locationEn: 'Kamala', locationRu: 'Камала', rating: 4.8, path: '/fitness/gym/2' },
  
  // Medical
  { id: 'clinic-1', type: 'medical', titleEn: 'Bangkok Hospital Phuket', titleRu: 'Бангкок Госпиталь Пхукет', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100', price: 1500, locationEn: 'Phuket Town', locationRu: 'Пхукет Таун', rating: 4.9, path: '/medical/clinic/1' },
  { id: 'clinic-2', type: 'medical', titleEn: 'Phuket Dental Clinic', titleRu: 'Пхукет Стоматология', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=100', price: 1000, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.7, path: '/medical/clinic/2' },
  
  // Property
  { id: 'prop-1', type: 'property', titleEn: 'Luxury Ocean View Villa', titleRu: 'Роскошная вилла с видом на океан', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=100', price: 85000, locationEn: 'Kamala', locationRu: 'Камала', rating: 4.9, path: '/property/prop-1' },
  { id: 'prop-2', type: 'property', titleEn: 'Modern Condo Patong', titleRu: 'Современная квартира Патонг', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100', price: 25000, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.6, path: '/property/prop-2' },
  
  // Transport
  { id: 'car-1', type: 'transport', titleEn: 'Toyota Camry 2023', titleRu: 'Тойота Камри 2023', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=100', price: 1500, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.8, path: '/transport/vehicle/car-1' },
  { id: 'bike-1', type: 'transport', titleEn: 'Honda PCX 160', titleRu: 'Хонда PCX 160', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100', price: 300, locationEn: 'Various', locationRu: 'Разные', rating: 4.7, path: '/transport/vehicle/bike-1' },
  
  // Tours
  { id: 'tour-1', type: 'tours', titleEn: 'Phi Phi Islands Tour', titleRu: 'Тур на острова Пхи-Пхи', image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=100', price: 2500, locationEn: 'Rassada Pier', locationRu: 'Пирс Рассада', rating: 4.9, path: '/tours/tour-1' },
  { id: 'tour-2', type: 'tours', titleEn: 'James Bond Island Trip', titleRu: 'Экскурсия на остров Джеймса Бонда', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=100', price: 2200, locationEn: 'Ao Po', locationRu: 'Ао По', rating: 4.8, path: '/tours/tour-2' },
  
  // Water Activities
  { id: 'water-1', type: 'water', titleEn: 'Scuba Diving Experience', titleRu: 'Дайвинг с аквалангом', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100', price: 3500, locationEn: 'Chalong', locationRu: 'Чалонг', rating: 4.9, path: '/water/water-1' },
  
  // Yachts
  { id: 'yacht-1', type: 'yachts', titleEn: 'Luxury Yacht Charter', titleRu: 'Аренда люксовой яхты', image: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=100', price: 45000, locationEn: 'Ao Po Marina', locationRu: 'Марина Ао По', rating: 4.9, path: '/yachts' },
  { id: 'yacht-2', type: 'yachts', titleEn: 'Catamaran Experience', titleRu: 'Катамаран прогулка', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=100', price: 25000, locationEn: 'Royal Phuket Marina', locationRu: 'Рояль Пхукет Марина', rating: 4.8, path: '/yachts' },
  { id: 'yacht-3', type: 'yachts', titleEn: 'Sunset Yacht Cruise', titleRu: 'Яхта на закате', image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=100', price: 15000, locationEn: 'Chalong Bay', locationRu: 'Залив Чалонг', rating: 4.7, path: '/yachts' },
  
  // Legal & Business
  { id: 'legal-1', type: 'legal', titleEn: 'Thai Legal Experts', titleRu: 'Тайские юристы', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100', price: 2000, locationEn: 'Phuket Town', locationRu: 'Пхукет Таун', rating: 4.8, path: '/legal/provider/1' },
  { id: 'legal-2', type: 'legal', titleEn: 'Phuket Visa Services', titleRu: 'Визовые услуги Пхукета', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100', price: 1500, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.7, path: '/legal/provider/2' },
  
  // Pharmacy
  { id: 'pharmacy-1', type: 'pharmacy', titleEn: 'Boots Pharmacy', titleRu: 'Аптека Бутс', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=100', price: 0, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.6, path: '/pharmacy/1' },
  
  // Flowers
  { id: 'flowers-1', type: 'flowers', titleEn: 'Orchid Garden Florist', titleRu: 'Флорист Орхидея', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=100', price: 500, locationEn: 'Phuket Town', locationRu: 'Пхукет Таун', rating: 4.8, path: '/flowers/shop/1' },
  
  // Education
  { id: 'edu-1', type: 'education', titleEn: 'English for Kids', titleRu: 'Английский для детей', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100', price: 150, locationEn: 'Patong', locationRu: 'Патонг', rating: 4.9, path: '/education/course/1' },
  
  // Services
  { id: 'service-1', type: 'services', titleEn: 'Home Cleaning Service', titleRu: 'Уборка дома', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100', price: 800, locationEn: 'All areas', locationRu: 'Все районы', rating: 4.7, path: '/services/provider/1' },
];

const typeConfig: Record<string, { icon: any; labelEn: string; labelRu: string; color: string }> = {
  beauty: { icon: Sparkles, labelEn: 'Beauty', labelRu: 'Красота', color: 'from-pink-500 to-purple-500' },
  food: { icon: UtensilsCrossed, labelEn: 'Food', labelRu: 'Еда', color: 'from-orange-500 to-red-500' },
  fitness: { icon: Dumbbell, labelEn: 'Fitness', labelRu: 'Фитнес', color: 'from-blue-500 to-cyan-500' },
  medical: { icon: Stethoscope, labelEn: 'Medical', labelRu: 'Медицина', color: 'from-emerald-500 to-green-500' },
  education: { icon: GraduationCap, labelEn: 'Education', labelRu: 'Обучение', color: 'from-yellow-500 to-orange-500' },
  property: { icon: Home, labelEn: 'Property', labelRu: 'Жильё', color: 'from-teal-500 to-emerald-500' },
  transport: { icon: Car, labelEn: 'Transport', labelRu: 'Транспорт', color: 'from-indigo-500 to-blue-500' },
  tours: { icon: Compass, labelEn: 'Tours', labelRu: 'Туры', color: 'from-amber-500 to-orange-500' },
  water: { icon: Waves, labelEn: 'Water', labelRu: 'Вода', color: 'from-cyan-500 to-blue-500' },
  yachts: { icon: Anchor, labelEn: 'Yachts', labelRu: 'Яхты', color: 'from-blue-600 to-indigo-600' },
  legal: { icon: Scale, labelEn: 'Legal', labelRu: 'Юридические', color: 'from-indigo-500 to-blue-600' },
  pharmacy: { icon: Pill, labelEn: 'Pharmacy', labelRu: 'Аптеки', color: 'from-green-500 to-emerald-500' },
  flowers: { icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы', color: 'from-rose-500 to-pink-500' },
  services: { icon: Wrench, labelEn: 'Services', labelRu: 'Услуги', color: 'from-slate-500 to-zinc-600' },
  events: { icon: Ticket, labelEn: 'Events', labelRu: 'События', color: 'from-purple-500 to-pink-500' },
  cleaning: { icon: Brush, labelEn: 'Cleaning', labelRu: 'Уборка', color: 'from-sky-500 to-blue-500' },
  babysitter: { icon: Baby, labelEn: 'Babysitter', labelRu: 'Няня', color: 'from-pink-400 to-rose-500' },
  pets: { icon: PawPrint, labelEn: 'Pets', labelRu: 'Питомцы', color: 'from-amber-500 to-yellow-500' },
  market: { icon: ShoppingBag, labelEn: 'Market', labelRu: 'Магазины', color: 'from-violet-500 to-purple-500' },
};

const trendingSearches: Record<string, string[]> = {
  en: ['beach villa', 'thai massage', 'scooter rental', 'phi phi tour', 'yacht', 'dentist'],
  ru: ['вилла на пляже', 'тайский массаж', 'аренда скутера', 'тур пхи-пхи', 'яхты', 'стоматолог'],
  th: ['วิลล่าชายหาด', 'นวดแผนไทย', 'เช่ามอเตอร์ไซค์', 'ทัวร์พีพี', 'เรือยอชท์', 'ทันตแพทย์'],
};

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('myuno-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  // Use real database search
  const { results: dbResults, isLoading } = useGlobalSearch(query, open);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSelect = (item: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('myuno-recent-searches', JSON.stringify(newRecent));
    
    onOpenChange(false);
    setQuery('');
    navigate(item.path);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('myuno-recent-searches');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[80vh] overflow-hidden" hideCloseButton aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={language === 'ru' ? 'Поиск услуг, мест, событий...' : 'Search services, places, events...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {query ? (
              // Search Results
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2"
              >
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                    <p className="text-muted-foreground">
                      {language === 'ru' ? 'Поиск...' : 'Searching...'}
                    </p>
                  </div>
                ) : dbResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dbResults.map((item, index) => {
                      const config = typeConfig[item.type];
                      const Icon = config?.icon || Search;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0", config?.color || 'from-gray-500 to-gray-600')}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                <Icon className="w-3 h-3 mr-0.5" />
                                {language === 'ru' ? config?.labelRu : config?.labelEn}
                              </Badge>
                              {item.rating && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                            <p className="font-medium truncate text-sm">
                              {language === 'ru' ? item.titleRu : item.titleEn}
                            </p>
                            {(item.locationEn || item.locationRu) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {language === 'ru' ? item.locationRu : item.locationEn}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              // Suggestions
              <motion.div
                key="suggestions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-6"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {language === 'ru' ? 'Недавние' : 'Recent'}
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {language === 'ru' ? 'Очистить' : 'Clear'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickSearch(search)}
                          className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    {language === 'ru' ? 'Популярное' : 'Trending'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(trendingSearches[language as keyof typeof trendingSearches] || trendingSearches.en).map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(search)}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Categories */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {language === 'ru' ? 'Категории' : 'Categories'}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(typeConfig).slice(0, 8).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/${key === 'property' ? 'property' : key}`);
                          }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                            config.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                            {language === 'ru' ? config.labelRu : config.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
