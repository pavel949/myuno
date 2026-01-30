import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Globe, Landmark, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KnowledgeHubBanner() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currentCity, getCityName } = useLocation();
  const isRu = language === 'ru';

  const cityName = getCityName(language);

  const highlights = [
    { icon: Globe, label: isRu ? 'Обзор' : 'Overview' },
    { icon: Landmark, label: isRu ? 'Культура' : 'Culture' },
    { icon: AlertTriangle, label: isRu ? 'SOS' : 'Emergency' },
  ];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5",
        "border-primary/20 hover:border-primary/40 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10"
      )}
      onClick={() => navigate('/knowledge')}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {isRu ? 'База знаний' : 'Knowledge Hub'}
            <span className="text-primary text-sm">
              {currentCity?.flag} {cityName}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {isRu 
              ? 'Всё о жизни и адаптации в локации' 
              : 'Everything about living and adapting'}
          </p>
          
          {/* Quick highlights */}
          <div className="flex items-center gap-3 mt-2">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                <item.icon className="w-3 h-3" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Card>
  );
}
