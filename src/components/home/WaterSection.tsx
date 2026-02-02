import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, ArrowRight, Star, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { useWaterActivities } from '@/hooks/useWaterActivities';

export function WaterSection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { activities, isLoading } = useWaterActivities({ featured: true, limit: 3 });

  if (isLoading || activities.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold">{t('water.title')}</h2>
        </div>
        <button 
          onClick={() => navigate('/water')}
          className="text-sm text-primary flex items-center gap-1"
        >
          {t('action.viewAll')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            onClick={() => navigate(`/water/${activity.id}`)}
            className="flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="relative h-36">
              <img 
                src={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                loading="lazy"
              />
              {activity.is_certified && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                  <Shield className="w-3 h-3 mr-0.5" /> {t('badge.certified')}
                </Badge>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-1">
                {language === 'ru' ? activity.title_ru : activity.title_en}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {activity.rating}
                </span>
                <span>•</span>
                <span>{activity.duration_minutes}min</span>
              </div>
              <p className="text-primary font-bold mt-2">฿{activity.price?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}