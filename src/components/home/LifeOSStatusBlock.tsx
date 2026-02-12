/**
 * LifeOSStatusBlock — Shows contextual status when a life situation is active
 * Displays: progress, checklist summary, next steps
 * Core of the "dashboard" experience
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useLifeSituations } from '@/hooks/useLifeOS';
import { useTripChecklist } from '@/hooks/useTripChecklist';
import { CheckCircle2, Circle, ArrowRight, ListChecks } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Quick actions per situation context
const CONTEXT_ACTIONS: Record<string, Array<{
  labelEn: string;
  labelRu: string;
  path: string;
  icon: string;
}>> = {
  arrival: [
    { labelEn: 'Trip planner', labelRu: 'Планировщик', path: '/trip-planner', icon: 'ListChecks' },
    { labelEn: 'Airport transfer', labelRu: 'Трансфер', path: '/transfer', icon: 'Plane' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
  ],
  living: [
    { labelEn: 'Find housing', labelRu: 'Найти жильё', path: '/property', icon: 'Home' },
    { labelEn: 'Healthcare', labelRu: 'Медицина', path: '/medical', icon: 'Stethoscope' },
    { labelEn: 'Visa & docs', labelRu: 'Виза', path: '/visa', icon: 'FileText' },
  ],
  health: [
    { labelEn: 'Find clinic', labelRu: 'Найти клинику', path: '/medical', icon: 'Stethoscope' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
    { labelEn: 'Pharmacy', labelRu: 'Аптека', path: '/pharmacy', icon: 'Pill' },
  ],
  family: [
    { labelEn: 'Childcare', labelRu: 'Няни', path: '/babysitter', icon: 'Baby' },
    { labelEn: 'Education', labelRu: 'Образование', path: '/education', icon: 'GraduationCap' },
    { labelEn: 'Healthcare', labelRu: 'Медицина', path: '/medical', icon: 'Stethoscope' },
  ],
  leisure: [
    { labelEn: 'Things to do', labelRu: 'Чем заняться', path: '/experiences', icon: 'Compass' },
    { labelEn: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants', icon: 'UtensilsCrossed' },
    { labelEn: 'Yacht charter', labelRu: 'Яхты', path: '/yachts', icon: 'Anchor' },
  ],
  property: [
    { labelEn: 'Real estate', labelRu: 'Недвижимость', path: '/property', icon: 'Building2' },
    { labelEn: 'Legal help', labelRu: 'Юридическая помощь', path: '/legal', icon: 'Scale' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
  ],
  business: [
    { labelEn: 'Coworking', labelRu: 'Коворкинг', path: '/services?category=coworking', icon: 'Building' },
    { labelEn: 'Legal help', labelRu: 'Юрист', path: '/legal', icon: 'Scale' },
    { labelEn: 'Banks', labelRu: 'Банки', path: '/banks', icon: 'Landmark' },
  ],
  relocation: [
    { labelEn: 'Visa & docs', labelRu: 'Виза', path: '/visa', icon: 'FileText' },
    { labelEn: 'Find housing', labelRu: 'Жильё', path: '/property', icon: 'Home' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
  ],
  pets: [
    { labelEn: 'Vet clinic', labelRu: 'Ветклиника', path: '/pets', icon: 'Stethoscope' },
    { labelEn: 'Pet shops', labelRu: 'Зоомагазин', path: '/pets', icon: 'ShoppingBag' },
    { labelEn: 'Pet sitting', labelRu: 'Передержка', path: '/pets', icon: 'Heart' },
  ],
  education: [
    { labelEn: 'Schools', labelRu: 'Школы', path: '/education', icon: 'School' },
    { labelEn: 'Tutors', labelRu: 'Репетиторы', path: '/services?category=tutors', icon: 'BookOpen' },
    { labelEn: 'Courses', labelRu: 'Курсы', path: '/services?category=courses', icon: 'GraduationCap' },
  ],
  shopping: [
    { labelEn: 'Markets', labelRu: 'Маркеты', path: '/market', icon: 'ShoppingCart' },
    { labelEn: 'Delivery', labelRu: 'Доставка', path: '/services?category=delivery', icon: 'Truck' },
    { labelEn: 'Flowers', labelRu: 'Цветы', path: '/flowers', icon: 'Flower2' },
  ],
  nightlife: [
    { labelEn: 'Clubs & bars', labelRu: 'Клубы и бары', path: '/nightlife', icon: 'Music' },
    { labelEn: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants', icon: 'UtensilsCrossed' },
    { labelEn: 'Taxi', labelRu: 'Такси', path: '/transport/taxi', icon: 'Car' },
  ],
  sports: [
    { labelEn: 'Gyms', labelRu: 'Залы', path: '/fitness', icon: 'Dumbbell' },
    { labelEn: 'Water sports', labelRu: 'Водный спорт', path: '/experiences?type=activity', icon: 'Waves' },
    { labelEn: 'Yoga', labelRu: 'Йога', path: '/fitness', icon: 'Leaf' },
  ],
  visa_travel: [
    { labelEn: 'Visa services', labelRu: 'Визовые услуги', path: '/visa', icon: 'FileText' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
    { labelEn: 'Airport transfer', labelRu: 'Трансфер', path: '/transfer', icon: 'Plane' },
  ],
  planning: [
    { labelEn: 'Trip planner', labelRu: 'Планировщик', path: '/trip-planner', icon: 'ListChecks' },
    { labelEn: 'Housing', labelRu: 'Жильё', path: '/property', icon: 'Home' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
  ],
  wedding_event: [
    { labelEn: 'Venues', labelRu: 'Площадки', path: '/restaurants', icon: 'MapPin' },
    { labelEn: 'Flowers', labelRu: 'Цветы', path: '/flowers', icon: 'Flower2' },
    { labelEn: 'Events', labelRu: 'Организация', path: '/events', icon: 'PartyPopper' },
  ],
  retirement_living: [
    { labelEn: 'Healthcare', labelRu: 'Медицина', path: '/medical', icon: 'Stethoscope' },
    { labelEn: 'Housing', labelRu: 'Жильё', path: '/property', icon: 'Home' },
    { labelEn: 'Insurance', labelRu: 'Страховка', path: '/insurance', icon: 'Shield' },
  ],
};

export const LifeOSStatusBlock = memo(function LifeOSStatusBlock() {
  const { activeCode, activeTitle, activeColor } = useLifeSituationContext();
  const { data: situations } = useLifeSituations();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const tripChecklist = useTripChecklist();
  const isRu = language === 'ru';

  if (!activeCode) return null;

  const activeSituation = situations?.find(s => s.code === activeCode);
  const getIcon = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.Compass;
  };

  const actions = CONTEXT_ACTIONS[activeCode] || [];
  const isArrival = activeCode === 'arrival';

  return (
    <section className="space-y-4">
      {/* Status card */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          backgroundColor: `${activeColor}06`,
          borderColor: `${activeColor}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeSituation && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${activeColor}12` }}
              >
                {React.createElement(getIcon(activeSituation.icon), {
                  className: "w-4 h-4",
                  style: { color: activeColor || undefined },
                })}
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-foreground">{activeTitle}</p>
              <p className="text-[11px] text-muted-foreground">
                {isRu ? 'Активный контекст' : 'Active context'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/life/${activeCode}`)}
            className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
          >
            {isRu ? 'Подробнее' : 'Details'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Arrival checklist progress */}
        {isArrival && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5" />
                {isRu ? 'Готовность к поездке' : 'Trip readiness'}
              </span>
              <span className="font-medium text-foreground">
                {tripChecklist.completedCount}/{tripChecklist.totalCount}
              </span>
            </div>
            <Progress value={tripChecklist.progress} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Context actions — "What's next" */}
      {actions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Что дальше' : "What's next"}
          </p>
          <div className="space-y-1.5">
            {actions.map((action) => {
              const Icon = getIcon(action.icon);
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-card border border-border/50 hover:border-border text-left transition-all active:scale-[0.98]"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-[13px] font-medium text-foreground flex-1">
                    {isRu ? action.labelRu : action.labelEn}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
});

export default LifeOSStatusBlock;
