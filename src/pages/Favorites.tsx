import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  GraduationCap, 
  User, 
  Trash2, 
  Ticket, 
  Home, 
  Car, 
  Stethoscope, 
  Dumbbell,
  FolderHeart,
  Grid3X3,
  List,
  StickyNote,
  Share2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUserCollections } from '@/hooks/useUserCollections';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { EmptyState } from '@/components/uno/EmptyState';
import { SectionCard } from '@/components/uno/SectionCard';
import { AnimatedList, AnimatedItem } from '@/components/layout/AnimatedList';
import { FavoriteCollections } from '@/components/favorites/FavoriteCollections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

type FilterType = 'all' | 'course' | 'tutor' | 'event' | 'property' | 'vehicle' | 'clinic' | 'gym' | 'tour' | 'water_activity' | 'restaurant';
type ViewMode = 'grid' | 'list';

export default function Favorites() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite, refetch } = useUserCollections();
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [activeTab, setActiveTab] = useState<'items' | 'collections'>('items');

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const filters: { value: FilterType; label: string; labelRu: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'All', labelRu: 'Все', icon: Heart },
    { value: 'restaurant', label: 'Restaurants', labelRu: 'Рестораны', icon: Heart },
    { value: 'tour', label: 'Tours', labelRu: 'Туры', icon: Heart },
    { value: 'course', label: 'Courses', labelRu: 'Курсы', icon: GraduationCap },
    { value: 'tutor', label: 'Tutors', labelRu: 'Репетиторы', icon: User },
    { value: 'event', label: 'Events', labelRu: 'События', icon: Ticket },
    { value: 'property', label: 'Property', labelRu: 'Недвижимость', icon: Home },
    { value: 'vehicle', label: 'Transport', labelRu: 'Транспорт', icon: Car },
    { value: 'clinic', label: 'Clinics', labelRu: 'Клиники', icon: Stethoscope },
    { value: 'gym', label: 'Fitness', labelRu: 'Фитнес', icon: Dumbbell },
  ];

  const filteredFavorites = filter === 'all' 
    ? favorites 
    : favorites.filter(f => f.item_type === filter);

  const handleNavigate = (item: { item_type: string; item_id: string }) => {
    if (item.item_type === 'property') {
      navigate(APP_ROUTES.PROPERTY_DETAIL(item.item_id));
      return;
    }
    const routes: Record<string, string> = {
      course: `/education/course/${item.item_id}`,
      tutor: `/education/tutor/${item.item_id}`,
      event: `/events/${item.item_id}`,
      vehicle: `/transport/vehicle/${item.item_id}`,
      clinic: `/medical/clinic/${item.item_id}`,
      gym: `/fitness/gym/${item.item_id}`,
      tour: `/experiences/${item.item_id}`,
      water_activity: `/experiences/${item.item_id}`,
      restaurant: `/restaurants/${item.item_id}`,
      yacht: `/yachts/${item.item_id}`,
      salon: `/beauty/salon/${item.item_id}`,
      experience: `/experiences/${item.item_id}`,
      transfer: `/transfer`,
      flower_shop: `/flowers/shop/${item.item_id}`,
      babysitter: `/babysitter/${item.item_id}`,
      legal_service: `/legal/provider/${item.item_id}`,
      pet_service: `/pets/${item.item_id}`,
      marketplace_product: `/market/product/${item.item_id}`,
      cleaning: `/cleaning/${item.item_id}`,
      coworking: `/services/provider/${item.item_id}`,
    };
    const route = routes[item.item_type];
    if (route) navigate(route);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      course: { en: 'Course', ru: 'Курс' },
      tutor: { en: 'Tutor', ru: 'Репетитор' },
      event: { en: 'Event', ru: 'Событие' },
      property: { en: 'Property', ru: 'Недвижимость' },
      vehicle: { en: 'Vehicle', ru: 'Транспорт' },
      clinic: { en: 'Clinic', ru: 'Клиника' },
      gym: { en: 'Gym', ru: 'Фитнес' },
      tour: { en: 'Tour', ru: 'Тур' },
      water_activity: { en: 'Water Activity', ru: 'Водный спорт' },
      restaurant: { en: 'Restaurant', ru: 'Ресторан' },
    };
    return labels[type]?.[language] || type;
  };

  const handleRemove = async (item: { item_type: string; item_id: string }) => {
    await toggleFavorite(item.item_type as any, item.item_id);
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-0 flex-1 h-[calc(100vh-8rem)]">
        <PageContainer>
          <PageHeader 
            title={language === 'ru' ? 'Избранное' : 'Favorites'} 
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            }
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'items' | 'collections')} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="items" className="flex-1 gap-2">
                <Heart className="w-4 h-4" />
                {language === 'ru' ? 'Элементы' : 'Items'}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {favorites.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex-1 gap-2">
                <FolderHeart className="w-4 h-4" />
                {language === 'ru' ? 'Коллекции' : 'Collections'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collections" className="mt-4">
              <FavoriteCollections
                favorites={favorites}
                onSelectCollection={(id) => {
                  setSelectedCollection(id);
                  setActiveTab('items');
                }}
                selectedCollection={selectedCollection}
              />
            </TabsContent>

            <TabsContent value="items" className="mt-4 space-y-4">
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide touch-pan-y">
                {filters.map((f) => (
                  <Button
                    key={f.value}
                    variant={filter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f.value)}
                    className="flex-shrink-0 rounded-none"
                  >
                    <f.icon className="h-4 w-4 mr-1" />
                    {language === 'ru' ? f.labelRu : f.label}
                  </Button>
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {/* Empty state */}
              {!loading && filteredFavorites.length === 0 && (
                <EmptyState
                  icon={Heart}
                  title={language === 'ru' ? 'Пока пусто' : 'No favorites yet'}
                  description={language === 'ru' 
                    ? 'Добавляйте понравившиеся курсы и услуги, нажимая на сердечко' 
                    : 'Add your favorite courses and services by tapping the heart icon'}
                  action={
                    <Button onClick={() => navigate('/discover')}>
                      {language === 'ru' ? 'Начать поиск' : 'Browse Services'}
                    </Button>
                  }
                />
              )}

              {/* Favorites list */}
              {!loading && filteredFavorites.length > 0 && viewMode === 'list' && (
                <AnimatedList className="space-y-3">
                  {filteredFavorites.map((item) => {
                    const data = item.item_data || {};
                    const title = language === 'ru' 
                      ? (data.title_ru || data.name || 'Без названия')
                      : (data.title_en || data.name || 'Untitled');
                    const subtitle = language === 'ru'
                      ? (data.specialty_ru || data.category || '')
                      : (data.specialty_en || data.category || '');

                    return (
                      <AnimatedItem key={item.id}>
                        <SectionCard 
                          noPadding 
                          className="overflow-hidden flex"
                        >
                          <button
                            className="flex-1 flex items-center gap-3 p-4"
                            onClick={() => handleNavigate(item)}
                          >
                            <img
                              src={data.image || data.images?.[0] || '/placeholder.svg'}
                              alt={title}
                              className="w-16 h-16 rounded-none object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {getTypeLabel(item.item_type)}
                                </Badge>
                              </div>
                              <h3 className="font-semibold truncate">{title}</h3>
                              {subtitle && (
                                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                              )}
                              {data.price && (
                                <p className="text-sm font-medium text-primary mt-1">
                                  {data.currency || '฿'}{data.price}
                                  {item.item_type === 'tutor' && (language === 'ru' ? '/час' : '/hour')}
                                </p>
                              )}
                            </div>
                          </button>
                          <div className="flex flex-col border-l border-border">
                            <button
                              onClick={() => handleRemove(item)}
                              className="flex-1 px-4 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </SectionCard>
                      </AnimatedItem>
                    );
                  })}
                </AnimatedList>
              )}

              {/* Grid view */}
              {!loading && filteredFavorites.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-2 gap-3">
                  {filteredFavorites.map((item) => {
                    const data = item.item_data || {};
                    const title = language === 'ru' 
                      ? (data.title_ru || data.name || 'Без названия')
                      : (data.title_en || data.name || 'Untitled');

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNavigate(item)}
                        className="bg-card rounded-none overflow-hidden border hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={data.image || data.images?.[0] || '/placeholder.svg'}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(item);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm"
                          >
                            {getTypeLabel(item.item_type)}
                          </Badge>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2">{title}</h3>
                          {data.price && (
                            <p className="text-sm font-bold text-primary mt-1">
                              {formatPrice(data.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </PageContainer>
      </PullToRefresh>
    </AppLayout>
  );
}
