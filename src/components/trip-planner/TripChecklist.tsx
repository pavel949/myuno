import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useTripChecklist } from '@/hooks/useTripChecklist';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrivalCardBlock } from './ArrivalCardBlock';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, FileText, Zap, Car, CarFront, Shield,
  PartyPopper, UtensilsCrossed, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChecklistItemConfig {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  action?: 'navigate' | 'external' | 'expand';
  target?: string;
  expandComponent?: 'arrival_card';
}

const CHECKLIST_ITEMS: ChecklistItemConfig[] = [
  {
    id: 'flights',
    icon: Plane,
    labelEn: 'Flights to / from Phuket',
    labelRu: 'Авиабилеты на Пхукет',
    descEn: 'Tips on the best routes and when to book',
    descRu: 'Советы по лучшим маршрутам и когда бронировать',
    action: 'external',
    target: 'https://www.aviasales.ru/',
  },
  {
    id: 'arrival_card',
    icon: FileText,
    labelEn: 'Thailand Arrival Card',
    labelRu: 'Arrival Card Таиланда',
    descEn: 'Fill online or let myUNO help',
    descRu: 'Заполните онлайн или доверьте myUNO',
    action: 'expand',
    expandComponent: 'arrival_card',
  },
  {
    id: 'fast_track',
    icon: Zap,
    labelEn: 'Airport Fast Track',
    labelRu: 'Фаст-трек в аэропорту',
    descEn: 'Skip the queues at immigration',
    descRu: 'Пройдите паспортный контроль без очереди',
    action: 'navigate',
    target: '/transport/fast-track',
  },
  {
    id: 'transfer',
    icon: Car,
    labelEn: 'Airport Transfer',
    labelRu: 'Трансфер из аэропорта',
    descEn: 'Private, family, or premium',
    descRu: 'Приватный, семейный или премиум',
    action: 'navigate',
    target: '/transport/airport-transfer',
  },
  {
    id: 'car_rental',
    icon: CarFront,
    labelEn: 'Car / Bike Rental',
    labelRu: 'Аренда авто / байка',
    descEn: 'Verified local providers',
    descRu: 'Проверенные местные поставщики',
    action: 'navigate',
    target: '/transport',
  },
  {
    id: 'insurance',
    icon: Shield,
    labelEn: 'Travel Insurance',
    labelRu: 'Страховка',
    descEn: "We'll help you pick the right coverage",
    descRu: 'Поможем выбрать подходящую страховку',
    action: 'navigate',
    target: '/insurance/travel',
  },
  {
    id: 'events',
    icon: PartyPopper,
    labelEn: 'Events & Activities',
    labelRu: 'События и активности',
    descEn: "What's happening during your dates",
    descRu: 'Что происходит в ваши даты',
    action: 'navigate',
    target: '/experiences',
  },
  {
    id: 'other_services',
    icon: UtensilsCrossed,
    labelEn: 'Restaurants, Spa, Tours & More',
    labelRu: 'Рестораны, спа, туры и другое',
    descEn: 'Complete your Phuket experience',
    descRu: 'Всё для идеального отдыха',
    action: 'navigate',
    target: '/discover',
  },
];

export function TripChecklist() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { items, toggle, completedCount, totalCount, progress } = useTripChecklist();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleItemAction = (item: ChecklistItemConfig) => {
    if (item.action === 'navigate' && item.target) {
      navigate(item.target);
    } else if (item.action === 'external' && item.target) {
      window.open(item.target, '_blank');
    } else if (item.action === 'expand') {
      setExpandedId(prev => prev === item.id ? null : item.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {isRu ? 'Готовность к поездке' : 'Trip Readiness'}
          </h2>
          <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle2 className="w-4 h-4" />
            {completedCount}/{totalCount}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Reassurance banner */}
      <div className="flex items-center gap-2.5 rounded-xl bg-primary/5 border border-primary/10 px-3.5 py-2.5">
        <Shield className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Мы позаботимся обо всём. Просто отмечайте готовое.'
            : "We've got you covered. Just check off what's done."}
        </p>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isCompleted = items[item.id];
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={cn(
                  'rounded-xl border bg-card transition-all',
                  isCompleted ? 'border-primary/20 bg-primary/5' : 'border-border',
                )}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggle(item.id)}
                    className="shrink-0"
                  />

                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      isCompleted ? 'bg-primary/15' : 'bg-muted'
                    )}
                  >
                    <Icon className={cn('w-4.5 h-4.5', isCompleted ? 'text-primary' : 'text-muted-foreground')} />
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleItemAction(item)}
                  >
                    <p className={cn(
                      'text-sm font-medium leading-tight',
                      isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {isRu ? item.labelRu : item.labelEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRu ? item.descRu : item.descEn}
                    </p>
                  </div>

                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                    onClick={() => handleItemAction(item)}
                  />
                </div>

                {/* Expandable content */}
                <AnimatePresence>
                  {isExpanded && item.expandComponent === 'arrival_card' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5">
                        <ArrivalCardBlock
                          onAssisted={() => {
                            // TODO: navigate to arrival card assistance order flow
                            toggle(item.id);
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
