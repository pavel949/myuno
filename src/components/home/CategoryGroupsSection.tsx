import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Car, UtensilsCrossed, Compass, Waves, Stethoscope, 
  Sparkles, Dumbbell, GraduationCap, Ticket, Scale, Wrench,
  Pill, Flower2, PawPrint, Anchor, Bike, Plane, Baby, 
  Package, Brush, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface CategoryGroup {
  id: string;
  title: string;
  titleRu: string;
  categories: {
    id: string;
    icon: React.ElementType;
    label: string;
    labelRu: string;
    path: string;
    color: string;
    isNew?: boolean;
    isHot?: boolean;
  }[];
}

const categoryGroups: CategoryGroup[] = [
  {
    id: 'lifestyle',
    title: 'Lifestyle & Leisure',
    titleRu: 'Стиль жизни',
    categories: [
      { id: 'restaurants', icon: UtensilsCrossed, label: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants', color: 'from-orange-500 to-red-500', isHot: true },
      { id: 'beauty', icon: Sparkles, label: 'Beauty & Spa', labelRu: 'Красота и СПА', path: '/beauty', color: 'from-pink-500 to-purple-500' },
      { id: 'fitness', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', path: '/fitness', color: 'from-blue-500 to-cyan-500' },
      { id: 'events', icon: Ticket, label: 'Events', labelRu: 'События', path: '/events', color: 'from-purple-500 to-pink-500' },
      { id: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', path: '/flowers', color: 'from-rose-500 to-pink-500' },
    ],
  },
  {
    id: 'travel',
    title: 'Travel & Transport',
    titleRu: 'Путешествия и транспорт',
    categories: [
      { id: 'tours', icon: Compass, label: 'Tours', labelRu: 'Экскурсии', path: '/tours', color: 'from-amber-500 to-orange-500', isHot: true },
      { id: 'transport', icon: Car, label: 'Car Rental', labelRu: 'Аренда авто', path: '/transport', color: 'from-indigo-500 to-blue-500' },
      { id: 'bikes', icon: Bike, label: 'Bike Rental', labelRu: 'Аренда байков', path: '/transport?type=motorbike', color: 'from-green-500 to-emerald-500' },
      { id: 'yachts', icon: Anchor, label: 'Yachts & Boats', labelRu: 'Яхты и лодки', path: '/water?category=yacht', color: 'from-sky-500 to-blue-500', isNew: true },
      { id: 'airport', icon: Plane, label: 'Airport Transfer', labelRu: 'Трансфер', path: '/transport/airport', color: 'from-slate-500 to-zinc-600' },
    ],
  },
  {
    id: 'water',
    title: 'Water Activities',
    titleRu: 'На воде',
    categories: [
      { id: 'water', icon: Waves, label: 'All Activities', labelRu: 'Все активности', path: '/water', color: 'from-cyan-500 to-blue-500' },
      { id: 'diving', icon: Waves, label: 'Diving', labelRu: 'Дайвинг', path: '/water?category=diving', color: 'from-blue-600 to-indigo-600' },
      { id: 'yachts-water', icon: Anchor, label: 'Yachts', labelRu: 'Яхты', path: '/water?category=yacht', color: 'from-sky-500 to-blue-500' },
    ],
  },
  {
    id: 'health',
    title: 'Health & Care',
    titleRu: 'Здоровье',
    categories: [
      { id: 'medical', icon: Stethoscope, label: 'Medical', labelRu: 'Медицина', path: '/medical', color: 'from-emerald-500 to-green-500' },
      { id: 'pharmacy', icon: Pill, label: 'Pharmacy', labelRu: 'Аптека', path: '/pharmacy', color: 'from-green-500 to-emerald-500' },
      { id: 'pets', icon: PawPrint, label: 'Pet Care', labelRu: 'Питомцы', path: '/pets', color: 'from-amber-500 to-orange-500', isNew: true },
    ],
  },
  {
    id: 'home',
    title: 'Home & Services',
    titleRu: 'Дом и услуги',
    categories: [
      { id: 'property', icon: Home, label: 'Property', labelRu: 'Недвижимость', path: '/property', color: 'from-teal-500 to-emerald-500' },
      { id: 'services', icon: Wrench, label: 'Home Services', labelRu: 'Домашние услуги', path: '/services', color: 'from-slate-500 to-zinc-600' },
      { id: 'cleaning', icon: Brush, label: 'Cleaning', labelRu: 'Уборка', path: '/cleaning', color: 'from-cyan-500 to-blue-500' },
      { id: 'babysitting', icon: Baby, label: 'Babysitting', labelRu: 'Няни', path: '/babysitter', color: 'from-pink-500 to-rose-500', isNew: true },
      { id: 'delivery', icon: Package, label: 'Delivery', labelRu: 'Доставка', path: '/delivery', color: 'from-orange-500 to-amber-500' },
      { id: 'market', icon: Package, label: 'Market', labelRu: 'Магазин', path: '/market', color: 'from-emerald-500 to-teal-500', isNew: true },
    ],
  },
  {
    id: 'professional',
    title: 'Professional',
    titleRu: 'Профессиональные',
    categories: [
      { id: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юридические', path: '/legal', color: 'from-indigo-500 to-blue-600' },
      { id: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Образование', path: '/education', color: 'from-yellow-500 to-orange-500' },
    ],
  },
];

interface CategoryGroupsSectionProps {
  expanded?: boolean;
  showAll?: boolean;
}

export function CategoryGroupsSection({ expanded = false, showAll = false }: CategoryGroupsSectionProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const displayGroups = showAll ? categoryGroups : categoryGroups.slice(0, 3);

  return (
    <div className="space-y-6">
      {displayGroups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {language === 'ru' ? group.titleRu : group.title}
          </h3>
          <div className={cn(
            "grid gap-2",
            expanded ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5" : "grid-cols-4"
          )}>
            {group.categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.path)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl",
                    "bg-card border border-border/50",
                    "hover:border-primary/30 hover:shadow-sm",
                    "transition-all active:scale-[0.97] group"
                  )}
                >
                  {(cat.isNew || cat.isHot) && (
                    <span className={cn(
                      "absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-medium",
                      cat.isNew ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
                    )}>
                      {cat.isNew ? (language === 'ru' ? 'NEW' : 'NEW') : (language === 'ru' ? 'ТОП' : 'HOT')}
                    </span>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-1.5",
                    "bg-gradient-to-br shadow-sm",
                    cat.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
                    {language === 'ru' ? cat.labelRu : cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {!showAll && (
        <button
          onClick={() => navigate('/discover')}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:underline"
        >
          {language === 'ru' ? 'Все категории' : 'All categories'}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
