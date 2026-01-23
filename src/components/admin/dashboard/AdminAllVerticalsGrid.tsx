import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Ship, Home, Utensils, Scissors, MapPin, Dumbbell, 
  Stethoscope, Calendar, Car, GraduationCap, Scale, 
  PawPrint, SprayCan, Baby, Flower2, Pill, Store, Shield, Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_VERTICALS = [
  { key: 'yachts', icon: Ship, label: 'Yachts', labelRu: 'Яхты', href: '/admin/yachts', color: 'text-info' },
  { key: 'properties', icon: Home, label: 'Properties', labelRu: 'Недвижимость', href: '/admin/properties', color: 'text-success' },
  { key: 'tours', icon: MapPin, label: 'Tours', labelRu: 'Туры', href: '/admin/tours', color: 'text-warning' },
  { key: 'restaurants', icon: Utensils, label: 'Restaurants', labelRu: 'Рестораны', href: '/admin/restaurants', color: 'text-destructive' },
  { key: 'salons', icon: Scissors, label: 'Salons', labelRu: 'Салоны', href: '/admin/salons', color: 'text-purple-500' },
  { key: 'clinics', icon: Stethoscope, label: 'Clinics', labelRu: 'Клиники', href: '/admin/clinics', color: 'text-pink-500' },
  { key: 'gyms', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', href: '/admin/gyms', color: 'text-orange-500' },
  { key: 'events', icon: Calendar, label: 'Events', labelRu: 'События', href: '/admin/events', color: 'text-cyan-500' },
  { key: 'vehicles', icon: Car, label: 'Transport', labelRu: 'Транспорт', href: '/admin/vehicles', color: 'text-slate-500' },
  { key: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Образование', href: '/admin/education', color: 'text-indigo-500' },
  { key: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юридические', href: '/admin/legal', color: 'text-amber-600' },
  { key: 'pets', icon: PawPrint, label: 'Pets', labelRu: 'Питомцы', href: '/admin/pets', color: 'text-rose-500' },
  { key: 'cleaning', icon: SprayCan, label: 'Cleaning', labelRu: 'Уборка', href: '/admin/cleaning', color: 'text-teal-500' },
  { key: 'babysitters', icon: Baby, label: 'Babysitters', labelRu: 'Няни', href: '/admin/babysitters', color: 'text-violet-500' },
  { key: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', href: '/admin/flowers', color: 'text-pink-400' },
  { key: 'pharmacies', icon: Pill, label: 'Pharmacies', labelRu: 'Аптеки', href: '/admin/pharmacies', color: 'text-green-600' },
  { key: 'stores', icon: Store, label: 'Stores', labelRu: 'Магазины', href: '/admin/stores', color: 'text-blue-600' },
  { key: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страхование', href: '/admin/insurance', color: 'text-emerald-500' },
  { key: 'waterActivities', icon: Waves, label: 'Water', labelRu: 'Вода', href: '/admin/water-activities', color: 'text-sky-500' },
];

export function AdminAllVerticalsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const getCount = (key: string): number => {
    if (!data) return 0;
    const stats = data as unknown as Record<string, number>;
    return stats[key] || 0;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">
          {isRu ? 'Все вертикали' : 'All Verticals'}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {ALL_VERTICALS.reduce((sum, v) => sum + getCount(v.key), 0)} {isRu ? 'всего' : 'total'}
        </Badge>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
        {ALL_VERTICALS.map((vertical) => {
          const Icon = vertical.icon;
          const count = getCount(vertical.key);
          
          return (
            <div
              key={vertical.key}
              className="flex flex-col items-center p-2 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-center"
              onClick={() => navigate(vertical.href)}
            >
              <div className={cn("mb-1", vertical.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{count}</p>
              <p className="text-[9px] text-muted-foreground truncate w-full">
                {isRu ? vertical.labelRu : vertical.label}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
