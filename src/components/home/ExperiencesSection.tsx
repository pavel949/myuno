import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, Star, Shield, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { useExperiences, formatDuration } from '@/hooks/useExperiences';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

export function ExperiencesSection() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { experiences, isLoading } = useExperiences({ featured: true, limit: 6 });
  const isRu = language === 'ru';

  if (isLoading || experiences.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Туры и Активности' : 'Tours & Activities'}
          </h2>
        </div>
        <button 
          onClick={() => navigate('/experiences')}
          className="text-sm text-primary flex items-center gap-1"
        >
          {t('action.viewAll')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {experiences.map((experience) => {
          const isTour = experience.experience_type === 'tour';
          
          return (
            <div 
              key={experience.id}
              onClick={() => navigate(`/experiences/${experience.id}`)}
              className="flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative h-36 overflow-hidden">
                <OptimizedImage 
                  src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'} 
                  alt={language === 'ru' ? experience.title_ru : experience.title_en}
                  width={256}
                  height={144}
                  className="w-full h-full group-hover:scale-105 transition-transform"
                  quality={75}
                  sizes="256px"
                />
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
                {experience.is_certified && (
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] z-10">
                    <Shield className="w-3 h-3 mr-0.5" /> 
                    {language === 'ru' ? 'Серт.' : 'Cert.'}
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {language === 'ru' ? experience.title_ru : experience.title_en}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {experience.rating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{formatDuration(experience.duration_minutes, language)}</span>
                </div>
                <p className="text-primary font-bold mt-2">
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
