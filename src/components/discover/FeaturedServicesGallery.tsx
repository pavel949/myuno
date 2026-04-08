import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Service } from '@/hooks/useServices';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceProviderCard } from '@/components/services/ServiceProviderCard';

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
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[260px] h-[240px] rounded-2xl shrink-0" />
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
          <div className="p-2 bg-gradient-to-br from-warning/20 to-warning/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-warning" />
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
      
      {/* Horizontal Scroll - Larger cards */}
      <div 
        className="-mx-4 px-4 overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory'
        }}
      >
        <div className="flex gap-4 pb-2">
          {topServices.map((service) => (
            <div 
              key={service.id} 
              className="shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ServiceProviderCard
                service={service}
                language={language}
                onClick={() => handleServiceClick(service)}
                variant="featured"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
