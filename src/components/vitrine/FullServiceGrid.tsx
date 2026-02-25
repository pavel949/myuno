import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plane, Ship, Compass, Car, Utensils, Calendar,
  Sparkles, Dumbbell, Flower2, Heart, Stethoscope, Shield,
  GraduationCap, Baby, PawPrint, Pill, Scale, Waves, CheckCircle, Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServiceCounts } from '@/hooks/useServiceCounts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CategoryDef {
  id: string;
  icon: React.ElementType;
  nameEn: string;
  nameRu: string;
  route: string;
}

const CATEGORIES: CategoryDef[] = [
  // Arrival
  { id: 'property', icon: Plane, nameEn: 'Villas & Condos', nameRu: 'Виллы и квартиры', route: '/property' },
  { id: 'yacht', icon: Ship, nameEn: 'Yacht Charters', nameRu: 'Яхт-чартер', route: '/yachts' },
  { id: 'experience', icon: Compass, nameEn: 'Tours & Activities', nameRu: 'Туры и экскурсии', route: '/experiences' },
  { id: 'vehicle', icon: Car, nameEn: 'Car & Scooter', nameRu: 'Авто и скутеры', route: '/transport' },
  // Experience
  { id: 'restaurant', icon: Utensils, nameEn: 'Restaurants', nameRu: 'Рестораны', route: '/restaurants' },
  { id: 'water', icon: Waves, nameEn: 'Water Sports', nameRu: 'Водный спорт', route: '/experiences?type=activity' },
  { id: 'event', icon: Calendar, nameEn: 'Events', nameRu: 'События', route: '/events' },
  { id: 'salon', icon: Sparkles, nameEn: 'Spa & Beauty', nameRu: 'Спа и красота', route: '/beauty' },
  // Lifestyle
  { id: 'gym', icon: Dumbbell, nameEn: 'Gyms & Fitness', nameRu: 'Фитнес', route: '/fitness' },
  { id: 'flower', icon: Flower2, nameEn: 'Flowers & Gifts', nameRu: 'Цветы и подарки', route: '/flowers' },
  { id: 'cleaning', icon: Heart, nameEn: 'Cleaning', nameRu: 'Клининг', route: '/cleaning' },
  { id: 'babysitter', icon: Baby, nameEn: 'Babysitters', nameRu: 'Няни', route: '/babysitter' },
  // Professional
  { id: 'legal', icon: Scale, nameEn: 'Legal Services', nameRu: 'Юридические услуги', route: '/legal' },
  { id: 'clinic', icon: Stethoscope, nameEn: 'Clinics & Medical', nameRu: 'Клиники', route: '/medical' },
  { id: 'insurance', icon: Shield, nameEn: 'Insurance', nameRu: 'Страхование', route: '/insurance' },
  { id: 'education', icon: GraduationCap, nameEn: 'Education', nameRu: 'Образование', route: '/education' },
  // More
  { id: 'pet', icon: PawPrint, nameEn: 'Pet Services', nameRu: 'Для питомцев', route: '/pets' },
  { id: 'pharmacy', icon: Pill, nameEn: 'Pharmacy', nameRu: 'Аптеки', route: '/pharmacy' },
];

export function FullServiceGrid() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: counts, isLoading } = useServiceCounts();

  return (
    <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <h2 className="text-xl lg:text-2xl font-bold text-foreground text-center mb-2 font-display">
        {isRu ? 'Всё, что нужно на Пхукете' : 'Everything You Need in Phuket'}
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-md mx-auto">
        {isRu ? '18+ проверенных категорий. Только верифицированные провайдеры.' : '18+ verified categories. Only vetted providers.'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const countData = counts?.[cat.id];
          const count = countData?.count ?? 0;
          const minPrice = countData?.minPrice;
          const isEmpty = !isLoading && count === 0;

          return (
            <Link
              key={cat.id}
              to={isEmpty ? '#' : cat.route}
              onClick={e => isEmpty && e.preventDefault()}
              className={cn(
                "group relative bg-card rounded-xl p-4 border border-border/40 transition-all duration-200",
                isEmpty
                  ? "opacity-50 cursor-default"
                  : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {!isEmpty && !isLoading && (
                  <div className="flex items-center gap-1 text-[11px] text-success font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>{isRu ? 'Проверено' : 'Verified'}</span>
                  </div>
                )}
                {isEmpty && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {isRu ? 'Скоро' : 'Soon'}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-1 leading-tight">
                {isRu ? cat.nameRu : cat.nameEn}
              </h3>

              {isLoading ? (
                <Skeleton className="h-3 w-24 mt-1" />
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {count > 0 && (
                    <span>{count} {isRu ? 'опций' : 'options'}</span>
                  )}
                  {minPrice && count > 0 && (
                    <>
                      <span className="text-border">·</span>
                      <span>{isRu ? 'от' : 'From'} ฿{minPrice.toLocaleString()}</span>
                    </>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
