import React, { memo } from 'react';
import { Star, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LanguageIndicator } from '@/components/ui/LanguageIndicator';
import { Service } from '@/hooks/useServices';

// Category color strip — unified to primary for brand consistency
const CATEGORY_COLORS: Record<string, string> = {
  'default': 'bg-primary',
};

interface ServiceProviderCardProps {
  service: Service;
  language: string;
  onClick: () => void;
  variant?: 'featured' | 'compact' | 'horizontal';
}

export const ServiceProviderCard = memo(function ServiceProviderCard({
  service,
  language,
  onClick,
  variant = 'featured',
}: ServiceProviderCardProps) {
  const name = language === 'ru' ? service.name_ru : service.name_en;
  const providerName = service.provider?.name || '';
  const image = service.images?.[0];
  const categorySlug = service.category?.slug || 'default';
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  
  // Get provider initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (variant === 'horizontal') {
    return (
      <button
        onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4",
        "bg-card border border-border/50 rounded-2xl",
        "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30",
        "active:scale-[0.99]",
        "transition-all duration-200",
        "text-left group"
      )}
      >
        {/* Circular Avatar */}
        <Avatar className="w-16 h-16 ring-2 ring-primary/20">
          {service.provider?.logo_url ? (
            <AvatarImage src={service.provider.logo_url} alt={providerName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
            {getInitials(providerName || name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h4>
          
          {providerName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm text-muted-foreground line-clamp-1">
                {providerName}
              </span>
              {service.provider?.is_verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            {service.rating && (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                {service.rating.toFixed(1)}
              </span>
            )}
            
            {(service.languages?.length > 0 || service.provider?.has_machine_translation) && (
              <LanguageIndicator
                languages={service.languages || []}
                hasMachineTranslation={service.provider?.has_machine_translation}
                variant="compact"
                maxDisplay={2}
              />
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {service.price && (
            <span className="text-base font-bold text-primary">
              {service.price.toLocaleString()} {service.currency || '฿'}
            </span>
          )}
          {service.duration_minutes && (
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              {service.duration_minutes} min
            </div>
          )}
        </div>
      </button>
    );
  }

  // Featured variant (default) - larger card with category color strip
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[260px] shrink-0 rounded-2xl overflow-hidden",
        "bg-card border border-border/50",
        "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30",
        "active:scale-[0.98]",
        "transition-all duration-200",
        "text-left group"
      )}
    >
      {/* Category Color Strip */}
      <div className={cn("h-1", categoryColor)} />
      
      {/* Image with Avatar Overlay */}
      <div className="relative h-32 bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="w-10 h-10 text-primary/40" />
          </div>
        )}
        
        {/* Rating badge */}
        {service.rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/95 backdrop-blur-sm text-xs font-semibold shadow-sm">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            {service.rating.toFixed(1)}
          </div>
        )}
        
        {/* Provider Avatar - overlapping bottom edge */}
        <div className="absolute -bottom-5 left-4">
          <Avatar className="w-12 h-12 ring-3 ring-card shadow-lg">
            {service.provider?.logo_url ? (
              <AvatarImage src={service.provider.logo_url} alt={providerName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm">
              {getInitials(providerName || name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Verified checkmark on avatar */}
          {service.provider?.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-success rounded-full p-0.5">
              <CheckCircle2 className="w-3 h-3 text-white" fill="currentColor" />
            </div>
          )}
        </div>
      </div>
      
      {/* Content - with padding-top for avatar space */}
      <div className="p-4 pt-7 space-y-2">
        <h4 className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h4>
        
        {providerName && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {providerName}
          </p>
        )}
        
        {/* Language indicators */}
        {(service.languages?.length > 0 || service.provider?.has_machine_translation) && (
          <LanguageIndicator
            languages={service.languages || []}
            hasMachineTranslation={service.provider?.has_machine_translation}
            variant="compact"
            maxDisplay={3}
          />
        )}
        
        {/* Price and Duration */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {service.price ? (
            <span className="text-base font-bold text-primary">
              {service.price.toLocaleString()} {service.currency || '฿'}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'По запросу' : 'On request'}
            </span>
          )}
          
          {service.duration_minutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              <Clock className="w-3 h-3" />
              {service.duration_minutes} {language === 'ru' ? 'мин' : 'min'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
