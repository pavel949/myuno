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
  { path: '/transport/taxi', icon: '🚕', labelEn: 'Taxi', labelRu: 'Такси', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { path: '/experiences', icon: '🏝️', labelEn: 'Tours', labelRu: 'Туры', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { path: '/beauty', icon: '💆', labelEn: 'Beauty', labelRu: 'Красота', color: 'bg-pink-100 dark:bg-pink-900/30' },
  { path: '/cleaning', icon: '🧹', labelEn: 'Cleaning', labelRu: 'Уборка', color: 'bg-green-100 dark:bg-green-900/30' },
  { path: '/restaurants', icon: '🍽️', labelEn: 'Food', labelRu: 'Еда', color: 'bg-orange-100 dark:bg-orange-900/30' },
  { path: '/yachts', icon: '🚤', labelEn: 'Charters', labelRu: 'Чартер', color: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { path: '/events', icon: '🎫', labelEn: 'Events', labelRu: 'События', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { path: '/discover', icon: '⚡', labelEn: 'More', labelRu: 'Ещё', color: 'bg-gray-100 dark:bg-gray-800' },
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
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors active:scale-95"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl", service.color)}>
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
