import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTours } from '@/hooks/useTours';
import { useWaterActivities } from '@/hooks/useWaterActivities';
import { cn } from '@/lib/utils';

interface CarouselItem {
  id: string;
  type: 'tour' | 'water' | 'featured';
  image: string;
  title: string;
  titleRu: string;
  rating?: number;
  price?: number;
  location?: string;
  locationRu?: string;
  duration?: string;
  path: string;
}

export function RecommendedCarousel() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { tours, isLoading: toursLoading } = useTours({ category: undefined });
  const { activities, isLoading: waterLoading } = useWaterActivities({});

  // Combine and shuffle items
  const items: CarouselItem[] = [
    ...tours.slice(0, 4).map(tour => ({
      id: tour.id,
      type: 'tour' as const,
      image: tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400',
      title: tour.title_en,
      titleRu: tour.title_ru,
      rating: tour.rating ?? undefined,
      price: tour.price ?? undefined,
      location: tour.meeting_point ?? undefined,
      locationRu: tour.meeting_point ?? undefined,
      duration: tour.duration_hours ? `${tour.duration_hours}h` : undefined,
      path: `/tours/${tour.id}`,
    })),
    ...activities.slice(0, 4).map(activity => ({
      id: activity.id,
      type: 'water' as const,
      image: activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
      title: activity.title_en,
      titleRu: activity.title_ru,
      rating: activity.rating ?? undefined,
      price: activity.price ?? undefined,
      location: activity.location_name ?? undefined,
      locationRu: activity.location_name ?? undefined,
      duration: activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h` : undefined,
      path: `/water/${activity.id}`,
    })),
  ].sort(() => Math.random() - 0.5).slice(0, 8);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (toursLoading || waterLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-64 h-48 rounded-2xl bg-muted animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {language === 'ru' ? 'Рекомендуем' : 'Recommended'}
        </h2>
        <button 
          onClick={() => navigate('/discover')}
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          {language === 'ru' ? 'Все' : 'View All'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Scroll buttons */}
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

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => navigate(item.path)}
              className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all group/card text-left"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={item.image}
                  alt={language === 'ru' ? item.titleRu : item.title}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Type badge */}
                <span className={cn(
                  "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white uppercase",
                  item.type === 'tour' ? "bg-amber-500" : "bg-cyan-500"
                )}>
                  {item.type === 'tour' 
                    ? (language === 'ru' ? 'Тур' : 'Tour') 
                    : (language === 'ru' ? 'Активность' : 'Activity')}
                </span>

                {/* Price */}
                {item.price && (
                  <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/90 backdrop-blur-sm text-sm font-bold">
                    ฿{item.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-medium text-foreground line-clamp-1 mb-1">
                  {language === 'ru' ? item.titleRu : item.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {language === 'ru' ? item.locationRu : item.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
