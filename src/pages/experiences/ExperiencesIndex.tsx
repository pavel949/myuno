import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Waves, Star, Shield, Clock, MapPin, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useExperiences, 
  EXPERIENCE_CATEGORIES, 
  formatDuration,
  ExperienceType,
  Experience
} from '@/hooks/useExperiences';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tour' | 'activity';

const ExperienceCard = ({ experience, language }: { experience: Experience; language: string }) => {
  const navigate = useNavigate();
  const isTour = experience.experience_type === 'tour';
  const isRu = language === 'ru';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => navigate(`/experiences/${experience.id}`)}
    >
      <div className="relative h-44 overflow-hidden">
        <OptimizedImage
          src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
          alt={isRu ? experience.title_ru : experience.title_en}
          width={400}
          height={176}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          quality={80}
        />
        
        {/* Type badge */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 text-xs",
            isTour 
              ? "bg-amber-500 text-white" 
              : "bg-cyan-500 text-white"
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
        
        {/* Featured badge */}
        {experience.is_featured && (
          <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
            <Star className="w-3 h-3 mr-1 fill-white" />
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
};

export default function ExperiencesIndex() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  // Get initial type from URL
  const initialType = (searchParams.get('type') as ViewType) || 'all';
  const initialCategory = searchParams.get('category') || 'all';
  
  const [viewType, setViewType] = useState<ViewType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  const { experiences, isLoading } = useExperiences({
    type: viewType === 'all' ? undefined : viewType as ExperienceType,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });
  
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
  
  // Stats
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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-cyan-500/10 to-amber-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-cyan-500 flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">
                {isRu ? 'Откройте Пхукет' : 'Explore Phuket'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? `${stats.total} впечатлений доступно`
                  : `${stats.total} experiences available`
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
        
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {EXPERIENCE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{category.icon}</span>
              <span>{isRu ? category.labelRu : category.labelEn}</span>
            </button>
          ))}
        </div>
        
        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12">
            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {isRu ? 'Ничего не найдено' : 'No experiences found'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isRu 
                ? 'Попробуйте изменить фильтры'
                : 'Try adjusting your filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {experiences.map((experience) => (
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
