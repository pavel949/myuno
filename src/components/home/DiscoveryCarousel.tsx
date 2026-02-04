import React, { useRef, useState, useCallback, memo, forwardRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Compass, Waves, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useExperiences, formatDuration } from '@/hooks/useExperiences';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { UnifiedSectionHeader } from '@/components/shared/UnifiedSectionHeader';
import { cn } from '@/lib/utils';
import { 
  CARD_STYLES, 
  IMAGE_STYLES, 
  BADGE_SYSTEM,
  CAROUSEL_CARD_WIDTHS,
  CAROUSEL_IMAGE_HEIGHTS 
} from '@/lib/designTokens';

// Category mappings for each persona
const PERSONA_CATEGORY_SLUGS: Record<UserPersona, Set<string>> = {
  tourist: new Set(['tours', 'tour', 'yachts', 'yacht', 'transport', 'restaurants', 'events', 'water-activities', 'diving', 'snorkeling']),
  resident: new Set(['visa', 'medical', 'legal', 'banking', 'insurance', 'education', 'fitness', 'pharmacy']),
  property_owner: new Set(['cleaning', 'maintenance', 'property-management', 'legal', 'insurance']),
  investor: new Set(['investment', 'real-estate', 'property', 'offplan', 'hotel', 'business']),
};

// Get card size tier based on index
const getCardSize = (index: number): 'hero' | 'medium' | 'standard' => {
  if (index === 0) return 'hero';
  if (index === 1) return 'medium';
  return 'standard';
};

/**
 * DiscoveryCarousel - Unified carousel replacing ExperiencesSection + RecommendedCarousel
 * Features:
 * - Hero card (first item, larger)
 * - Standard cards (remaining items)
 * - Unified design tokens
 * - Smooth scroll with navigation buttons
 */
export const DiscoveryCarousel = memo(forwardRef<HTMLDivElement, object>(function DiscoveryCarousel(_, ref) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { personas } = useUserPersonas();
  
  const { experiences, isLoading } = useExperiences({ featured: true, limit: 12 });
  const isRu = language === 'ru';

  // Filter and prioritize experiences based on selected personas
  const filteredExperiences = useMemo(() => {
    if (personas.length === 0) {
      // No personas selected - show all experiences
      return experiences;
    }

    // Get all relevant categories from selected personas
    const relevantCategories = new Set<string>();
    personas.forEach(persona => {
      PERSONA_CATEGORY_SLUGS[persona]?.forEach(cat => relevantCategories.add(cat));
    });

    // Prioritize experiences matching persona categories
    const matching: typeof experiences = [];
    const other: typeof experiences = [];

    experiences.forEach(exp => {
      const expType = exp.experience_type?.toLowerCase() || '';
      const category = exp.category?.toLowerCase() || '';
      
      // Check if experience matches any relevant category
      const isRelevant = relevantCategories.has(expType) || 
                         relevantCategories.has(category) ||
                         (expType === 'tour' && relevantCategories.has('tours'));
      
      if (isRelevant) {
        matching.push(exp);
      } else {
        other.push(exp);
      }
    });

    // Return matching first, then others
    return [...matching, ...other].slice(0, 8);
  }, [experiences, personas]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="flex gap-4 overflow-hidden">
          <div className="w-80 h-56 rounded-2xl bg-muted animate-pulse flex-shrink-0" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-64 h-48 rounded-2xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (filteredExperiences.length === 0) return null;

  // Dynamic title based on personas
  const getTitle = () => {
    if (personas.length === 0) return isRu ? 'Лучшее на Пхукете' : 'Best of Phuket';
    if (personas.includes('tourist') && !personas.includes('resident')) {
      return isRu ? 'Для туристов' : 'For Tourists';
    }
    if (personas.includes('resident') && !personas.includes('tourist')) {
      return isRu ? 'Для резидентов' : 'For Residents';
    }
    return isRu ? 'Рекомендации для вас' : 'Recommended for You';
  };

  return (
    <div ref={ref} className="space-y-4">
      {/* Section Header */}
      <UnifiedSectionHeader
        icon={Compass}
        iconColor="text-amber-500"
        title={getTitle()}
        count={filteredExperiences.length}
        viewAllPath="/experiences"
        viewAllLabel={isRu ? 'Все' : 'All'}
      />

      {/* Carousel Container */}
      <div className="relative group">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 touch-pan-x"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {filteredExperiences.map((experience, index) => {
            const cardSize = getCardSize(index);
            const isHero = cardSize === 'hero';
            const isTour = experience.experience_type === 'tour';
            const title = isRu ? experience.title_ru : experience.title_en;
            
            // Check if this experience matches selected personas (for visual hint)
            const isPersonaMatch = personas.length > 0 && personas.some(persona => {
              const categories = PERSONA_CATEGORY_SLUGS[persona];
              const expType = experience.experience_type?.toLowerCase() || '';
              const category = experience.category?.toLowerCase() || '';
              return categories?.has(expType) || categories?.has(category);
            });
            
            // Size-specific values
            const imageWidths = { hero: 320, medium: 288, standard: 256 };
            const imageHeights = { hero: 192, medium: 168, standard: 144 };
            
            return (
              <div
                key={experience.id}
                onClick={() => navigate(`/experiences/${experience.id}`)}
                className={cn(
                  CARD_STYLES.interactive,
                  "flex-shrink-0 cursor-pointer",
                  CAROUSEL_CARD_WIDTHS[cardSize]
                )}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Image Container */}
                <div className={cn(
                  "relative overflow-hidden",
                  CAROUSEL_IMAGE_HEIGHTS[cardSize]
                )}>
                  <OptimizedImage
                    src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                    alt={title}
                    width={imageWidths[cardSize]}
                    height={imageHeights[cardSize]}
                    className={IMAGE_STYLES.hover}
                    quality={75}
                    sizes={`${imageWidths[cardSize]}px`}
                  />
                  
                  {/* Gradient overlay for hero */}
                  {isHero && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  )}

                  {/* Hero Featured Badge */}
                  {isHero && (
                    <Badge className={cn(
                      "absolute top-2 right-2 z-10 shadow-lg",
                      BADGE_SYSTEM.featured
                    )}>
                      <Star className="w-3 h-3 mr-0.5 fill-white" />
                      {isRu ? 'Рекомендуем' : 'Featured'}
                    </Badge>
                  )}

                  {/* Type Badge */}
                  <Badge className={cn(
                    "absolute top-2 left-2 z-10",
                    isTour ? BADGE_SYSTEM.tour : BADGE_SYSTEM.activity
                  )}>
                    {isTour ? (
                      <>
                        <Compass className="w-3 h-3 mr-0.5" />
                        {isRu ? 'Тур' : 'Tour'}
                      </>
                    ) : (
                      <>
                        <Waves className="w-3 h-3 mr-0.5" />
                        {isRu ? 'Активность' : 'Activity'}
                      </>
                    )}
                  </Badge>

                  {/* Certified Badge (non-hero only) */}
                  {experience.is_certified && !isHero && (
                    <Badge className={cn(
                      "absolute top-2 right-2 z-10",
                      BADGE_SYSTEM.new
                    )}>
                      <Shield className="w-3 h-3 mr-0.5" />
                      {isRu ? 'Серт.' : 'Cert.'}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className={cn("p-3", isHero && "relative -mt-12 z-10")}>
                  <h3 className={cn(
                    "font-semibold line-clamp-1",
                    isHero ? "text-base text-white drop-shadow-lg mb-2" : "text-sm"
                  )}>
                    {title}
                  </h3>
                  
                  <div className={cn(
                    "flex items-center gap-2 text-xs mt-1",
                    isHero ? "text-white/90" : "text-muted-foreground"
                  )}>
                    {/* Rating */}
                    <div className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                      isHero ? "bg-white/20 backdrop-blur-sm" : "bg-amber-100 dark:bg-amber-900/30"
                    )}>
                      <Star className={cn(
                        "w-2.5 h-2.5",
                        isHero ? "fill-white text-white" : "fill-amber-500 text-amber-500"
                      )} />
                      <span className={cn(
                        "text-[10px] font-semibold",
                        isHero ? "text-white" : "text-amber-700 dark:text-amber-400"
                      )}>
                        {experience.rating.toFixed(1)}
                      </span>
                    </div>
                    
                    <span>•</span>
                    <span>{formatDuration(experience.duration_minutes, language)}</span>
                  </div>

                  {/* Price */}
                  <p className={cn(
                    "font-bold mt-2",
                    isHero ? "text-lg text-white drop-shadow-lg" : "text-primary"
                  )}>
                    {formatPrice(experience.price || 0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}));
