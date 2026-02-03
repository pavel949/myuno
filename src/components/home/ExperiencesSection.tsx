import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, Star, Shield, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { useExperiences, formatDuration } from '@/hooks/useExperiences';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { CARD_STYLES, IMAGE_STYLES, BADGE_STYLES } from '@/lib/designTokens';

export function ExperiencesSection() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { experiences, isLoading } = useExperiences({ featured: true, limit: 6 });
  const isRu = language === 'ru';

  if (isLoading || experiences.length === 0) return null;

  return (
    <div className="relative -mx-4 px-4 py-5 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-transparent dark:from-amber-950/20 dark:via-orange-950/10 dark:to-transparent rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {language === 'ru' ? 'Туры и Активности' : 'Tours & Activities'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Лучшие впечатления Пхукета' : 'Best experiences in Phuket'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/experiences')}
          className="text-sm text-primary flex items-center gap-1 font-semibold hover:underline"
        >
          {t('action.viewAll')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {experiences.map((experience, index) => {
          const isTour = experience.experience_type === 'tour';
          const isHero = index === 0;
          
          return (
            <div 
              key={experience.id}
              onClick={() => navigate(`/experiences/${experience.id}`)}
              className={cn(
                CARD_STYLES.interactive, 
                "flex-shrink-0",
                isHero ? "w-80" : "w-64"
              )}
            >
              <div className={cn(
                "relative overflow-hidden",
                isHero ? "h-48" : "h-36"
              )}>
                <OptimizedImage 
                  src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'} 
                  alt={language === 'ru' ? experience.title_ru : experience.title_en}
                  width={isHero ? 320 : 256}
                  height={isHero ? 192 : 144}
                  className={IMAGE_STYLES.hover}
                  quality={75}
                  sizes={isHero ? "320px" : "256px"}
                />
                
                {/* Hero badge */}
                {isHero && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] z-10 shadow-lg">
                    <Star className="w-3 h-3 mr-0.5 fill-white" />
                    {language === 'ru' ? 'Рекомендуем' : 'Featured'}
                  </Badge>
                )}
                
                {/* Type badge */}
                <Badge 
                  className={cn(
                    "absolute top-2 left-2 text-[10px] z-10",
                    isTour 
                      ? "bg-amber-500 text-white" 
                      : "bg-cyan-500 text-white"
                  )}
                >
                  {isTour ? (
                    <>
                      <Compass className="w-3 h-3 mr-0.5" />
                      {language === 'ru' ? 'Тур' : 'Tour'}
                    </>
                  ) : (
                    <>
                      <Waves className="w-3 h-3 mr-0.5" />
                      {language === 'ru' ? 'Активность' : 'Activity'}
                    </>
                  )}
                </Badge>
                
                {/* Certified badge for activities */}
                {experience.is_certified && !isHero && (
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] z-10">
                    <Shield className="w-3 h-3 mr-0.5" /> 
                    {language === 'ru' ? 'Серт.' : 'Cert.'}
                  </Badge>
                )}
                
                {/* Gradient overlay for hero */}
                {isHero && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                )}
              </div>
              <div className={cn("p-3", isHero && "relative -mt-12 z-10")}>
                <h3 className={cn(
                  "font-semibold line-clamp-1",
                  isHero ? "text-base text-white drop-shadow-lg mb-2" : "text-sm"
                )}>
                  {language === 'ru' ? experience.title_ru : experience.title_en}
                </h3>
                <div className={cn(
                  "flex items-center gap-2 text-xs mt-1",
                  isHero ? "text-white/90" : "text-muted-foreground"
                )}>
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
  );
}
