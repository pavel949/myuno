import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Service } from '@/hooks/useServices';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface FeaturedServicesGalleryProps {
  services: Service[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  viewAllPath?: string;
}

export const FeaturedServicesGallery = memo(function FeaturedServicesGallery({
  services,
  isLoading,
  title,
  subtitle,
  viewAllPath = '/services',
}: FeaturedServicesGalleryProps) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const displayTitle = title || (language === 'ru' ? 'Популярные услуги' : 'Popular Services');
  const displaySubtitle = subtitle || (language === 'ru' ? 'Топ провайдеров' : 'Top providers');

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[200px] h-[180px] rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (services.length === 0) return null;

  // Get top 6 services by rating
  const topServices = [...services]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  const handleServiceClick = (service: Service) => {
    const slug = service.category?.slug || 'services';
    const pathMap: Record<string, string> = {
      'beauty-spa': '/beauty',
      'restaurants': '/restaurants',
      'fitness': '/fitness',
      'medical': '/medical',
      'kids-education': '/education',
      'real-estate': '/property',
      'transport': '/transport',
      'events': '/events',
      'cleaning': '/cleaning',
    };
    navigate(pathMap[slug] || '/services');
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{displayTitle}</h2>
            <p className="text-xs text-muted-foreground">{displaySubtitle}</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(viewAllPath)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {language === 'ru' ? 'Все' : 'View all'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Horizontal Scroll */}
      <ScrollArea className="-mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {topServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              language={language}
              onClick={() => handleServiceClick(service)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </section>
  );
});

interface ServiceCardProps {
  service: Service;
  language: string;
  onClick: () => void;
}

const ServiceCard = memo(function ServiceCard({
  service,
  language,
  onClick,
}: ServiceCardProps) {
  const name = language === 'ru' ? service.name_ru : service.name_en;
  const description = language === 'ru' ? service.description_ru : service.description_en;
  const providerName = service.provider?.name || '';
  const image = service.images?.[0];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[180px] shrink-0 rounded-2xl overflow-hidden",
        "bg-card border border-border/50",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
        "active:scale-[0.98]",
        "transition-all duration-200",
        "text-left group"
      )}
    >
      {/* Image */}
      <div className="relative h-24 bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="w-8 h-8 text-primary/40" />
          </div>
        )}
        
        {/* Rating badge */}
        {service.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/90 backdrop-blur-sm text-[10px] font-medium">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {service.rating.toFixed(1)}
          </div>
        )}
        
        {/* Verified badge */}
        {service.provider?.is_verified && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-bold">
            ✓
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h4>
        
        {providerName && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {providerName}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-1">
          {service.price && (
            <span className="text-sm font-bold text-primary">
              {service.price.toLocaleString()} {service.currency || '฿'}
            </span>
          )}
          
          {service.duration_minutes && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {service.duration_minutes} min
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
