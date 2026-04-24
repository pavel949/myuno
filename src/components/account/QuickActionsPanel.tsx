import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Car, Flower2, UtensilsCrossed, Sparkles, 
  Plane, Home, ShoppingBag, Heart 
} from 'lucide-react';

const ACTIONS = [
  { icon: Home, path: '/properties', labelEn: 'Rent', labelRu: 'Аренда', color: 'bg-info/15 text-info' },
  { icon: Car, path: '/transfers', labelEn: 'Transfer', labelRu: 'Трансфер', color: 'bg-accent-teal/15 text-accent-teal' },
  { icon: Flower2, path: '/flowers', labelEn: 'Flowers', labelRu: 'Цветы', color: 'bg-accent-pink/15 text-accent-pink' },
  { icon: UtensilsCrossed, path: '/restaurants', labelEn: 'Food', labelRu: 'Еда', color: 'bg-accent-amber/15 text-accent-amber' },
  { icon: Sparkles, path: '/beauty', labelEn: 'Beauty', labelRu: 'Красота', color: 'bg-accent-purple/15 text-accent-purple' },
  { icon: Plane, path: '/airport', labelEn: 'Airport', labelRu: 'Аэропорт', color: 'bg-primary/15 text-primary' },
  { icon: ShoppingBag, path: '/market', labelEn: 'Market', labelRu: 'Маркет', color: 'bg-success/15 text-success' },
  { icon: Heart, path: '/experiences', labelEn: 'Activities', labelRu: 'Досуг', color: 'bg-destructive/15 text-destructive' },
];

export function QuickActionsPanel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{isRu ? 'Быстрые действия' : 'Quick Actions'}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none lg:grid lg:grid-cols-4 lg:mx-0 lg:px-0 lg:overflow-visible">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 min-w-[72px] group"
            >
              <div className={`w-14 h-14 rounded-none flex items-center justify-center transition-transform ${action.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {isRu ? action.labelRu : action.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
