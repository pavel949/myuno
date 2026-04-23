import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface QuickService {
  path: string;
  icon: string;
  labelEn: string;
  labelRu: string;
  color: string;
}

const QUICK_SERVICES: QuickService[] = [
  { path: '/transport/taxi', icon: '🚕', labelEn: 'Taxi', labelRu: 'Такси', color: 'bg-warning/10' },
  { path: '/experiences', icon: '🏝️', labelEn: 'Tours', labelRu: 'Туры', color: 'bg-info/10' },
  { path: '/beauty', icon: '💆', labelEn: 'Beauty', labelRu: 'Красота', color: 'bg-accent-coral/10' },
  { path: '/cleaning', icon: '🧹', labelEn: 'Cleaning', labelRu: 'Уборка', color: 'bg-success/10' },
  { path: '/restaurants', icon: '🍽️', labelEn: 'Food', labelRu: 'Еда', color: 'bg-accent-amber/10' },
  { path: '/yachts', icon: '🚤', labelEn: 'Charters', labelRu: 'Чартер', color: 'bg-accent-cyan/10' },
  { path: '/events', icon: '🎫', labelEn: 'Events', labelRu: 'События', color: 'bg-accent-purple/10' },
  { path: '/discover', icon: '⚡', labelEn: 'More', labelRu: 'Ещё', color: 'bg-muted' },
];

export function DashboardQuickServices() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          {isRu ? 'Быстрый доступ' : 'Quick Access'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_SERVICES.map((service) => (
            <button
              key={service.path}
              onClick={() => navigate(service.path)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-none hover:bg-muted/50 transition-colors active:scale-95"
            >
              <div className={cn("w-10 h-10 rounded-none flex items-center justify-center text-xl", service.color)}>
                {service.icon}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
                {isRu ? service.labelRu : service.labelEn}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
