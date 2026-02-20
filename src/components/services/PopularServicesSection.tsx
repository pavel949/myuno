import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices, Service } from '@/hooks/useServices';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Flame, Star, Clock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PopularServicesSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { services, isLoading } = useServices({ sortBy: 'popular', limit: 10 });
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[180px] h-[200px] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4">
        <UnifiedSectionHeader
          icon={Flame}
          iconColor="text-primary"
          title={isRu ? 'Популярные услуги' : 'Popular Services'}
          viewAllPath="/services?sort=popular"
          viewAllLabel={isRu ? 'Все' : 'All'}
        />
      </div>

      <UnifiedScrollSection>
        {services.map((service) => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            onClick={() => navigate(`/services/provider/${service.provider_id}?service=${service.id}`)}
          />
        ))}
      </UnifiedScrollSection>
    </section>
  );
}

interface ServiceCardProps {
  service: Service;
  onClick?: () => void;
  compact?: boolean;
}

// Category-based fallback images for services without photos
const SERVICE_CATEGORY_IMAGES: Record<string, string> = {
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  gardening: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  repair: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
  transport: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
  default: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400',
};

function getServiceFallbackImage(service: Service): string {
  // If service has images, use them
  if (service.images?.[0]) return service.images[0];
  
  // Try to determine category from service name or category
  const nameLower = (service.name_en || '').toLowerCase();
  const categorySlug = service.category?.slug?.toLowerCase() || '';
  
  if (nameLower.includes('clean') || categorySlug.includes('clean')) return SERVICE_CATEGORY_IMAGES.cleaning;
  if (nameLower.includes('electr') || categorySlug.includes('electr')) return SERVICE_CATEGORY_IMAGES.electrical;
  if (nameLower.includes('plumb') || nameLower.includes('pipe')) return SERVICE_CATEGORY_IMAGES.plumbing;
  if (nameLower.includes('garden') || nameLower.includes('landscape') || nameLower.includes('palm') || nameLower.includes('irrigation')) return SERVICE_CATEGORY_IMAGES.gardening;
  if (nameLower.includes('pool')) return SERVICE_CATEGORY_IMAGES.pool;
  if (nameLower.includes('beauty') || nameLower.includes('spa') || nameLower.includes('nail') || nameLower.includes('hair')) return SERVICE_CATEGORY_IMAGES.beauty;
  if (nameLower.includes('massage')) return SERVICE_CATEGORY_IMAGES.massage;
  if (nameLower.includes('fitness') || nameLower.includes('gym') || nameLower.includes('yoga')) return SERVICE_CATEGORY_IMAGES.fitness;
  if (nameLower.includes('repair') || nameLower.includes('fix')) return SERVICE_CATEGORY_IMAGES.repair;
  if (nameLower.includes('transport') || nameLower.includes('taxi') || nameLower.includes('driver')) return SERVICE_CATEGORY_IMAGES.transport;
  
  return SERVICE_CATEGORY_IMAGES.default;
}

export function ServiceCard({ service, onClick, compact = false }: ServiceCardProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const name = isRu ? service.name_ru : service.name_en;
  const image = getServiceFallbackImage(service);

  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 snap-center text-left",
        "bg-card rounded-2xl border border-border overflow-hidden",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "transition-all duration-200 group touch-manipulation",
        compact ? "w-[140px]" : "w-[180px]"
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden",
        compact ? "h-[100px]" : "h-[110px]"
      )}>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Provider verified badge */}
        {service.provider?.is_verified && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-3", compact && "p-2")}>
        <h4 className={cn(
          "font-medium line-clamp-2 leading-tight",
          compact ? "text-xs min-h-[2rem]" : "text-sm min-h-[2.5rem]"
        )}>
          {name}
        </h4>
        
        {/* Provider */}
        {service.provider && !compact && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {service.provider.name}
          </p>
        )}
        
        {/* Price & Duration */}
        <div className="flex items-center justify-between mt-2">
          <span className={cn(
            "font-bold text-primary",
            compact ? "text-sm" : "text-base"
          )}>
            {service.price ? formatPrice(service.price) : (isRu ? 'По запросу' : 'On request')}
          </span>
          
          {service.duration_minutes && !compact && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {service.duration_minutes}m
            </Badge>
          )}
        </div>
        
        {/* Rating */}
        {service.rating && !compact && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="text-xs font-medium">{service.rating.toFixed(1)}</span>
            {service.review_count && (
              <span className="text-[10px] text-muted-foreground">({service.review_count})</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
