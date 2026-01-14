import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useTours } from '@/hooks/useTours';

export function ToursSection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { tours, isLoading } = useTours({ featured: true, limit: 3 });

  if (isLoading || tours.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold">{t('tours.title')}</h2>
        </div>
        <button 
          onClick={() => navigate('/tours')}
          className="text-sm text-primary flex items-center gap-1"
        >
          {t('action.viewAll')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {tours.map((tour) => (
          <div 
            key={tour.id}
            onClick={() => navigate(`/tours/${tour.id}`)}
            className="flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="relative h-36">
              <img 
                src={tour.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {tour.is_featured && (
                <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                  <Star className="w-3 h-3 mr-0.5" /> {t('badge.featured')}
                </Badge>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-1">
                {language === 'ru' ? tour.title_ru : tour.title_en}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {tour.rating}
                </span>
                <span>•</span>
                <span>{tour.duration_hours}h</span>
              </div>
              <p className="text-primary font-bold mt-2">฿{tour.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}