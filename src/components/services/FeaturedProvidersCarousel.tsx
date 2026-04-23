import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeServices } from '@/hooks/useHomeServices';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { Star, Shield, Clock, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function FeaturedProvidersCarousel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { providers, isLoading, getProviderImage } = useHomeServices();
  const isRu = language === 'ru';

  // Get top-rated verified providers
  const featuredProviders = providers
    .filter(p => p.is_verified && (p.rating || 0) >= 4.0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[200px] h-[220px] rounded-none shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredProviders.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4">
        <UnifiedSectionHeader
          icon={Star}
          iconColor="text-primary"
          title={isRu ? 'Топ мастера' : 'Top Professionals'}
          viewAllPath="/services?sort=rating"
          viewAllLabel={isRu ? 'Все' : 'All'}
        />
      </div>

      <UnifiedScrollSection>
        {featuredProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => navigate(`/services/provider/${provider.id}?category=${provider.business_category}`)}
            className={cn(
              "w-[200px] shrink-0 snap-center",
              "bg-card rounded-none border border-border overflow-hidden",
              "shadow-sm hover:shadow-md hover:-translate-y-0.5",
              "transition-all duration-200 group touch-manipulation text-left"
            )}
          >
            {/* Provider Image */}
            <div className="relative h-[120px] overflow-hidden">
              <img
                src={getProviderImage(provider)}
                alt={provider.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Verified badge */}
              {provider.is_verified && (
                <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {isRu ? 'Проверен' : 'Verified'}
                </div>
              )}
              
              {/* Rating */}
              {provider.rating && (
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-none flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="text-xs font-bold">{provider.rating.toFixed(1)}</span>
                  {provider.review_count && (
                    <span className="text-[10px] text-muted-foreground">({provider.review_count})</span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <h4 className="font-semibold text-sm line-clamp-1">{provider.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {isRu ? provider.description_ru : provider.description_en}
              </p>
              
              {/* Social proof: clients served */}
              <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span className="text-[10px]">
                  {(provider.review_count ?? 0) + 20}+ {isRu ? 'клиентов' : 'clients'}
                </span>
              </div>
              
              {/* Trust Badges */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {provider.response_time_minutes && provider.response_time_minutes <= 30 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {provider.response_time_minutes}m
                  </Badge>
                )}
                {provider.has_insurance && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {isRu ? 'Застрахован' : 'Insured'}
                  </Badge>
                )}
                {provider.has_guarantee && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground">
                    {isRu ? 'Гарантия' : 'Guaranteed'}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </UnifiedScrollSection>
    </section>
  );
}
