import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Waves, Star, Shield, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/IconBadge';
import { EmptyState } from '@/components/uno/EmptyState';
import { 
  useExperiences, 
  formatDuration,
  ExperienceType,
  Experience
} from '@/hooks/useExperiences';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { ExperienceFiltersKlook, SortOption, CategoryOption, DatePreset } from '@/components/experiences/ExperienceFiltersKlook';
import { cn } from '@/lib/utils';
import { isToday, isTomorrow, isThisWeek, isSameDay } from 'date-fns';

type ViewType = 'all' | 'tour' | 'activity';

const ExperienceCard = React.forwardRef<HTMLDivElement, { experience: Experience; language: string }>(
  ({ experience, language }, ref) => {
    const navigate = useNavigate();
    const isTour = experience.experience_type === 'tour';
    const isRu = language === 'ru';
    
    return (
      <motion.div
        ref={ref}
        data-testid="experience-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card rounded-2xl overflow-hidden border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        onClick={() => navigate(`/experiences/${experience.id}`)}
      >
        <div className="relative h-44 overflow-hidden">
          <OptimizedImage
            src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
            alt={isRu ? experience.title_ru : experience.title_en}
            width={400}
            height={176}
            className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
            quality={80}
          />
          
          {/* Type badge - using semantic tokens */}
          <Badge 
            className={cn(
              "absolute top-3 left-3 text-xs",
              isTour 
                ? "bg-warning text-warning-foreground" 
                : "bg-info text-info-foreground"
            )}
          >
            {isTour ? (
              <>
                <Compass className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Тур' : 'Tour'}
              </>
            ) : (
              <>
                <Waves className="w-3.5 h-3.5 mr-1" />
                {isRu ? 'Активность' : 'Activity'}
              </>
            )}
          </Badge>
          
          {/* Certified badge */}
          {experience.is_certified && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {isRu ? 'Сертификат' : 'Certified'}
            </Badge>
          )}
          
          {/* Featured badge - using semantic gradient */}
          {experience.is_featured && (
            <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-warning to-primary text-primary-foreground text-xs">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {isRu ? 'Топ' : 'Featured'}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">
            {isRu ? experience.title_ru : experience.title_en}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {experience.rating.toFixed(1)}
              <span className="text-xs">({experience.review_count})</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(experience.duration_minutes, language)}
            </span>
            {experience.location_name && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[120px]">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {experience.location_name}
                </span>
              </>
            )}
          </div>
          
          {/* Difficulty badge */}
          {experience.difficulty && (
            <Badge variant="outline" className="mb-3 text-xs">
              {experience.difficulty === 'easy' && '🟢'}
              {experience.difficulty === 'moderate' && '🟡'}
              {experience.difficulty === 'challenging' && '🟠'}
              {experience.difficulty === 'expert' && '🔴'}
              {' '}
              {isRu 
                ? experience.difficulty === 'easy' ? 'Легкий' : experience.difficulty === 'moderate' ? 'Средний' : experience.difficulty === 'challenging' ? 'Сложный' : 'Эксперт'
                : experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1)
              }
            </Badge>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-primary font-bold text-lg">
              ฿{experience.price?.toLocaleString()}
              {experience.price_per && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /{isRu ? 'чел' : 'person'}
                </span>
              )}
            </p>
            <Button size="sm" variant="outline" className="text-xs">
              {isRu ? 'Подробнее' : 'Details'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
);

ExperienceCard.displayName = 'ExperienceCard';

export default function ExperiencesIndex() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  // Get initial values from URL
  const initialType = (searchParams.get('type') as ViewType) || 'all';
  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = (searchParams.get('sort') as SortOption) || 'rating';
  
  const [viewType, setViewType] = useState<ViewType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 480]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  
  const { experiences, isLoading } = useExperiences({
    type: viewType === 'all' ? undefined : viewType as ExperienceType,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  // Fetch dynamic categories from DB
  const experienceTypeForCategories = viewType === 'all' ? undefined : viewType as 'tour' | 'activity';
  const { data: dbCategories = [] } = useExperienceCategories(experienceTypeForCategories);
  
  // Transform DB categories to filter options format
  const categoryOptions: CategoryOption[] = useMemo(() => {
    return dbCategories.map(cat => ({
      id: cat.slug,
      labelEn: cat.name_en,
      labelRu: cat.name_ru,
      icon: cat.icon,
    }));
  }, [dbCategories]);
  
  // Filter and sort experiences
  const filteredExperiences = useMemo(() => {
    let result = experiences.filter(exp => {
      // Price filter
      const price = exp.price || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Duration filter
      const duration = exp.duration_minutes || 0;
      if (duration < durationRange[0] || duration > durationRange[1]) return false;
      
      // Date filter - check if experience is available on selected date
      if (selectedDate) {
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const availableDays = exp.available_days || [];
        // If no available_days specified, assume available every day
        if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
          return false;
        }
      }
      
      // Date preset filter
      if (datePreset === 'today') {
        // Filter to experiences available today
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const availableDays = exp.available_days || [];
        if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
          return false;
        }
      } else if (datePreset === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const availableDays = exp.available_days || [];
        if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
          return false;
        }
      }
      // 'this-week' and 'any' show all experiences
      
      return true;
    });
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'duration':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'rating':
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });
    
    return result;
  }, [experiences, sortBy, priceRange, durationRange, selectedDate, datePreset]);
  
  // Handle type change
  const handleTypeChange = (type: ViewType) => {
    setViewType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', type);
    }
    setSearchParams(newParams);
  };
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };
  
  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'rating') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sort);
    }
    setSearchParams(newParams);
  };
  
  // Stats for type toggle
  const stats = useMemo(() => {
    const tours = experiences.filter(e => e.experience_type === 'tour').length;
    const activities = experiences.filter(e => e.experience_type === 'activity').length;
    return { total: experiences.length, tours, activities };
  }, [experiences]);

  return (
    <MiniAppLayout
      title={isRu ? 'Туры и Активности' : 'Tours & Activities'}
      fallbackPath="/"
      showHero={false}
      showFilter={false}
      showCategories={false}
    >
      <div className="space-y-4 pb-24">
        {/* Hero Section - using semantic tokens */}
        <div className="bg-gradient-to-br from-primary/10 via-info/10 to-warning/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <IconBadge 
              icon={Compass} 
              size="lg" 
              variant="gradient"
              className="w-12 h-12"
            />
            <div>
              <h1 className="font-bold text-xl">
                {isRu ? 'Откройте Пхукет' : 'Explore Phuket'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? `${filteredExperiences.length} впечатлений доступно`
                  : `${filteredExperiences.length} experiences available`
                }
              </p>
            </div>
          </div>
          
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-background/50 rounded-xl">
            {[
              { id: 'all', labelEn: 'All', labelRu: 'Все', count: stats.total },
              { id: 'tour', labelEn: 'Tours', labelRu: 'Туры', count: stats.tours, icon: Compass },
              { id: 'activity', labelEn: 'Activities', labelRu: 'Активности', count: stats.activities, icon: Waves },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id as ViewType)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                  viewType === type.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background"
                )}
              >
                {type.icon && <type.icon className="w-4 h-4" />}
                {isRu ? type.labelRu : type.labelEn}
              </button>
            ))}
          </div>
        </div>
        
        {/* Klook-style Filters */}
        <ExperienceFiltersKlook
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          durationRange={durationRange}
          onDurationRangeChange={setDurationRange}
          selectedInterests={selectedInterests}
          onInterestsChange={setSelectedInterests}
          selectedFeatures={selectedFeatures}
          onFeaturesChange={setSelectedFeatures}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          resultsCount={filteredExperiences.length}
          language={language}
        />
        
        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredExperiences.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={isRu ? 'Ничего не найдено' : 'No experiences found'}
            description={isRu 
              ? 'Попробуйте изменить фильтры'
              : 'Try adjusting your filters'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id} 
                  experience={experience} 
                  language={language} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Cross-sell */}
        <CrossSellSection currentVertical="experiences" />
      </div>
    </MiniAppLayout>
  );
}
