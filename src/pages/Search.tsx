import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search as SearchIcon, X, Sparkles, UtensilsCrossed, Dumbbell, 
  Stethoscope, GraduationCap, Home, Car, Ticket, ArrowLeft
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedList, AnimatedItem, AnimatedGrid, AnimatedCard } from '@/components/layout/AnimatedList';

// Combined demo data from all mini-apps
const allItems = [
  // Beauty & Spa
  { id: 'salon-1', type: 'beauty', title_en: 'Orchid Spa & Wellness', title_ru: 'Орхидея СПА и Велнес', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=400', price: 1500, location: 'Kata Beach', location_ru: 'Ката Бич', rating: 4.9, path: '/beauty/salon/1' },
  { id: 'salon-2', type: 'beauty', title_en: 'Lotus Nail Studio', title_ru: 'Лотус Маникюр Студио', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', price: 800, location: 'Patong', location_ru: 'Патонг', rating: 4.7, path: '/beauty/salon/2' },
  
  // Food & Restaurants
  { id: 'rest-1', type: 'food', title_en: 'Ocean View Restaurant', title_ru: 'Ресторан с видом на океан', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', price: 500, location: 'Rawai', location_ru: 'Равай', rating: 4.8, path: '/food/restaurant/1' },
  { id: 'rest-2', type: 'food', title_en: 'Thai Street Kitchen', title_ru: 'Тайская уличная кухня', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', price: 200, location: 'Phuket Town', location_ru: 'Пхукет Таун', rating: 4.6, path: '/food/restaurant/2' },
  
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
  
  // Events
  { id: 'event-1', type: 'events', title_en: 'Phi Phi Islands Tour', title_ru: 'Тур на острова Пхи-Пхи', image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400', price: 2500, location: 'Rassada Pier', location_ru: 'Пирс Рассада', rating: 4.9, path: '/events/event-1' },
  { id: 'event-2', type: 'events', title_en: 'Phuket Night Market', title_ru: 'Ночной рынок Пхукета', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', price: 0, location: 'Old Town', location_ru: 'Старый город', rating: 4.5, path: '/events/event-2' },
];

const typeConfig: Record<string, { icon: any; label: { en: string; ru: string }; color: string }> = {
  beauty: { icon: Sparkles, label: { en: 'Beauty', ru: 'Красота' }, color: 'from-pink-500 to-purple-500' },
  food: { icon: UtensilsCrossed, label: { en: 'Food', ru: 'Еда' }, color: 'from-orange-500 to-red-500' },
  fitness: { icon: Dumbbell, label: { en: 'Fitness', ru: 'Фитнес' }, color: 'from-blue-500 to-cyan-500' },
  medical: { icon: Stethoscope, label: { en: 'Medical', ru: 'Медицина' }, color: 'from-emerald-500 to-green-500' },
  education: { icon: GraduationCap, label: { en: 'Education', ru: 'Образование' }, color: 'from-yellow-500 to-orange-500' },
  property: { icon: Home, label: { en: 'Property', ru: 'Недвижимость' }, color: 'from-teal-500 to-emerald-500' },
  transport: { icon: Car, label: { en: 'Transport', ru: 'Транспорт' }, color: 'from-indigo-500 to-blue-500' },
  events: { icon: Ticket, label: { en: 'Events', ru: 'События' }, color: 'from-purple-500 to-pink-500' },
};

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredResults = useMemo(() => {
    let results = allItems;
    
    // Filter by type
    if (selectedType) {
      results = results.filter(item => item.type === selectedType);
    }
    
    // Filter by search query
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
  }, [query, selectedType, language]);

  const recentSearches = ['massage', 'villa', 'thai food', 'english course'];
  const popularCategories = Object.keys(typeConfig);

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Search Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === 'ru' ? 'Поиск услуг, мест...' : 'Search services, places...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4">
            <Button
              variant={selectedType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="flex-shrink-0"
            >
              {language === 'ru' ? 'Все' : 'All'}
            </Button>
            {popularCategories.map(type => {
              const config = typeConfig[type];
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="flex-shrink-0"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label[language]}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {/* Show suggestions when no query */}
          {!query && !selectedType && (
            <div className="space-y-6">
              {/* Recent Searches */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ru' ? 'Недавние поиски' : 'Recent Searches'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(search => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ru' ? 'Популярные категории' : 'Popular Categories'}
                </h3>
                <AnimatedGrid className="grid grid-cols-2 gap-3" staggerDelay={0.06}>
                  {popularCategories.slice(0, 6).map(type => {
                    const config = typeConfig[type];
                    const Icon = config.icon;
                    return (
                      <AnimatedCard key={type}>
                        <button
                          onClick={() => setSelectedType(type)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                            config.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{config.label[language]}</span>
                        </button>
                      </AnimatedCard>
                    );
                  })}
                </AnimatedGrid>
              </div>
            </div>
          )}

          {/* Search Results */}
          {(query || selectedType) && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'ru' 
                  ? `Найдено ${filteredResults.length} результатов` 
                  : `Found ${filteredResults.length} results`}
              </p>
              
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">
                    {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'Попробуйте изменить запрос или фильтры' 
                      : 'Try different keywords or filters'}
                  </p>
                </div>
              ) : (
                <AnimatedList className="space-y-3">
                  {filteredResults.map(item => {
                    const config = typeConfig[item.type];
                    const Icon = config.icon;
                    return (
                      <AnimatedItem key={item.id}>
                        <div
                          onClick={() => navigate(item.path)}
                          className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                        >
                          <img
                            src={item.image}
                            alt={language === 'ru' ? item.title_ru : item.title_en}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs gap-1")}
                              >
                                <Icon className="w-3 h-3" />
                                {config.label[language]}
                              </Badge>
                            </div>
                            <h3 className="font-semibold truncate">
                              {language === 'ru' ? item.title_ru : item.title_en}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {language === 'ru' ? item.location_ru : item.location}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-medium text-primary">
                                {item.price > 0 ? `฿${item.price.toLocaleString()}` : (language === 'ru' ? 'Бесплатно' : 'Free')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ⭐ {item.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AnimatedItem>
                    );
                  })}
                </AnimatedList>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}