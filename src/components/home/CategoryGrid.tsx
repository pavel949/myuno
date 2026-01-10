import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Car, UtensilsCrossed, Compass, Waves, Ship, Sparkles,
  Dumbbell, Stethoscope, GraduationCap, Ticket, Flower2, Pill, 
  PawPrint, Wrench, Scale, Baby, Shirt, Package, Bike
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { Badge } from '@/components/ui/badge';

interface CategoryGroup {
  id: string;
  titleEn: string;
  titleRu: string;
  categories: Category[];
}

interface Category {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
  color: string;
  isNew?: boolean;
  isPopular?: boolean;
}

const categoryGroups: CategoryGroup[] = [
  {
    id: 'lifestyle',
    titleEn: 'Lifestyle',
    titleRu: 'Образ жизни',
    categories: [
      { id: 'property', icon: Home, labelEn: 'Property', labelRu: 'Жильё', path: '/property', color: 'from-teal-500 to-emerald-500', isPopular: true },
      { id: 'restaurants', icon: UtensilsCrossed, labelEn: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants', color: 'from-orange-500 to-red-500', isPopular: true },
      { id: 'beauty', icon: Sparkles, labelEn: 'Beauty & Spa', labelRu: 'Красота', path: '/beauty', color: 'from-pink-500 to-purple-500' },
      { id: 'fitness', icon: Dumbbell, labelEn: 'Fitness', labelRu: 'Фитнес', path: '/fitness', color: 'from-blue-500 to-cyan-500' },
    ],
  },
  {
    id: 'transport',
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    categories: [
      { id: 'transport', icon: Car, labelEn: 'Cars & Bikes', labelRu: 'Авто и мото', path: '/transport', color: 'from-indigo-500 to-blue-500', isPopular: true },
      { id: 'yachts', icon: Ship, labelEn: 'Yachts', labelRu: 'Яхты', path: '/yachts', color: 'from-cyan-500 to-blue-500', isNew: true },
      { id: 'delivery', icon: Package, labelEn: 'Delivery', labelRu: 'Доставка', path: '/delivery', color: 'from-orange-500 to-amber-500', isNew: true },
    ],
  },
  {
    id: 'activities',
    titleEn: 'Activities',
    titleRu: 'Активности',
    categories: [
      { id: 'tours', icon: Compass, labelEn: 'Tours', labelRu: 'Туры', path: '/tours', color: 'from-amber-500 to-orange-500', isPopular: true },
      { id: 'water', icon: Waves, labelEn: 'Water Sports', labelRu: 'Водные', path: '/water', color: 'from-cyan-500 to-blue-500' },
      { id: 'events', icon: Ticket, labelEn: 'Events', labelRu: 'Мероприятия', path: '/events', color: 'from-purple-500 to-pink-500' },
    ],
  },
  {
    id: 'services',
    titleEn: 'Services',
    titleRu: 'Услуги',
    categories: [
      { id: 'cleaning', icon: Shirt, labelEn: 'Cleaning', labelRu: 'Уборка', path: '/cleaning', color: 'from-emerald-500 to-green-500', isNew: true },
      { id: 'babysitter', icon: Baby, labelEn: 'Babysitters', labelRu: 'Няни', path: '/babysitter', color: 'from-pink-500 to-rose-500', isNew: true },
      { id: 'pets', icon: PawPrint, labelEn: 'Pets', labelRu: 'Питомцы', path: '/pets', color: 'from-amber-500 to-orange-500' },
      { id: 'services', icon: Wrench, labelEn: 'Home Services', labelRu: 'Для дома', path: '/services', color: 'from-slate-500 to-zinc-600' },
    ],
  },
  {
    id: 'health',
    titleEn: 'Health & Education',
    titleRu: 'Здоровье и образование',
    categories: [
      { id: 'medical', icon: Stethoscope, labelEn: 'Medical', labelRu: 'Медицина', path: '/medical', color: 'from-emerald-500 to-green-500' },
      { id: 'pharmacy', icon: Pill, labelEn: 'Pharmacy', labelRu: 'Аптека', path: '/pharmacy', color: 'from-green-500 to-emerald-500' },
      { id: 'education', icon: GraduationCap, labelEn: 'Education', labelRu: 'Образование', path: '/education', color: 'from-yellow-500 to-orange-500' },
      { id: 'legal', icon: Scale, labelEn: 'Legal', labelRu: 'Юридические', path: '/legal', color: 'from-indigo-500 to-blue-600' },
    ],
  },
  {
    id: 'other',
    titleEn: 'Other',
    titleRu: 'Другое',
    categories: [
      { id: 'flowers', icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы', path: '/flowers', color: 'from-rose-500 to-pink-500' },
    ],
  },
];

interface CategoryGridProps {
  showAll?: boolean;
  compact?: boolean;
}

export function CategoryGrid({ showAll = false, compact = false }: CategoryGridProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Flatten all categories for compact view
  const allCategories = categoryGroups.flatMap(g => g.categories);
  const displayCategories = showAll ? allCategories : allCategories.slice(0, 12);

  if (compact) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {displayCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={(e) => {
                triggerRipple(e);
                navigate(cat.path);
              }}
              className="relative flex flex-col items-center p-2 rounded-xl hover:bg-card/50 transition-all group active:scale-95"
            >
              {(cat.isNew || cat.isPopular) && (
                <Badge 
                  className={cn(
                    "absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4",
                    cat.isNew ? "bg-green-500" : "bg-amber-500",
                    "text-white border-0"
                  )}
                >
                  {cat.isNew ? (language === 'ru' ? 'NEW' : 'NEW') : (language === 'ru' ? 'ТОП' : 'HOT')}
                </Badge>
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 bg-gradient-to-br",
                cat.color,
                "group-hover:scale-110 transition-transform"
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                {language === 'ru' ? cat.labelRu : cat.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryGroups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {language === 'ru' ? group.titleRu : group.titleEn}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {group.categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    triggerRipple(e);
                    navigate(cat.path);
                  }}
                  className="relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group active:scale-[0.98]"
                >
                  {(cat.isNew || cat.isPopular) && (
                    <Badge 
                      className={cn(
                        "absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5",
                        cat.isNew ? "bg-green-500" : "bg-amber-500",
                        "text-white border-0"
                      )}
                    >
                      {cat.isNew ? 'NEW' : 'HOT'}
                    </Badge>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                    cat.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {language === 'ru' ? cat.labelRu : cat.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
