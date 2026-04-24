import React, { memo } from 'react';
import { Star, Clock, CheckCircle2, Shield, Zap, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryById, type ProviderType } from '@/lib/taxonomies';

export interface HomeServiceProviderData {
  id: string;
  name: string;
  description_en: string | null;
  description_ru: string | null;
  business_category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  provider_type?: ProviderType;
  response_time_minutes?: number | null;
  has_insurance?: boolean | null;
  has_guarantee?: boolean | null;
  languages?: string[];
}

interface HomeServiceProviderCardProps {
  provider: HomeServiceProviderData;
  onClick: () => void;
  imageUrl?: string;
}

export const HomeServiceProviderCard = memo(function HomeServiceProviderCard({
  provider,
  onClick,
  imageUrl,
}: HomeServiceProviderCardProps) {
  const { language } = useLanguage();
  
  const isIndividual = provider.provider_type === 'individual';
  const category = getCategoryById(provider.business_category);
  const description = language === 'ru' ? provider.description_ru : provider.description_en;
  
  // Get provider initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-4",
        "bg-card border border-border/50 rounded-none",
        "hover:shadow-lg hover:border-primary/30",
        "",
        "transition-all duration-200",
        "text-left group"
      )}
    >
      {/* Avatar/Logo */}
      <Avatar className={cn(
        "w-14 h-14 ring-2 shrink-0 ring-border"
      )}>
        {imageUrl || provider.logo_url ? (
          <AvatarImage src={imageUrl || provider.logo_url || ''} alt={provider.name} />
        ) : null}
        <AvatarFallback className="font-semibold text-sm bg-muted text-muted-foreground">
          {getInitials(provider.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name + Rating row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {provider.name}
            </h4>
          </div>
          
          {provider.rating && (
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
              <span className="font-medium">{provider.rating.toFixed(1)}</span>
              {provider.review_count && (
                <span className="text-muted-foreground">({provider.review_count})</span>
              )}
            </div>
          )}
        </div>

        {/* Type + Category row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Provider type badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs px-2 py-0",
              isIndividual 
                ? "border-accent/40 text-accent dark:text-accent" 
                : "border-primary/50 text-primary"
            )}
          >
            {isIndividual ? '👤' : '🏢'} {isIndividual 
              ? (language === 'ru' ? 'Мастер' : 'Master') 
              : (language === 'ru' ? 'Компания' : 'Company')}
          </Badge>
          
          {/* Category */}
          {category && (
            <span className="text-xs text-muted-foreground">
              {category.icon} {language === 'ru' ? category.labelRu : category.labelEn}
            </span>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {provider.is_verified && (
            <span className="flex items-center gap-0.5 text-xs text-success dark:text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'ru' ? 'Проверен' : 'Verified'}
            </span>
          )}
          
          {provider.has_insurance && (
            <span className="flex items-center gap-0.5 text-xs text-primary dark:text-primary">
              <Shield className="w-3.5 h-3.5" />
              {language === 'ru' ? 'Страховка' : 'Insured'}
            </span>
          )}
          
          {provider.has_guarantee && (
            <span className="flex items-center gap-0.5 text-xs text-primary dark:text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'ru' ? 'Гарантия' : 'Guaranteed'}
            </span>
          )}
          
          {provider.response_time_minutes && provider.response_time_minutes <= 30 && (
            <span className="flex items-center gap-0.5 text-xs text-accent dark:text-accent">
              <Zap className="w-3.5 h-3.5" />
              {provider.response_time_minutes} {language === 'ru' ? 'мин' : 'min'}
            </span>
          )}
          
          {provider.languages && provider.languages.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Languages className="w-3.5 h-3.5" />
              {provider.languages.slice(0, 2).map(l => 
                l === 'en' ? '🇬🇧' : l === 'ru' ? '🇷🇺' : l === 'th' ? '🇹🇭' : l
              ).join(' ')}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {description}
          </p>
        )}
      </div>
    </button>
  );
});
