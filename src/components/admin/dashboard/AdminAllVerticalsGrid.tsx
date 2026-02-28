import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Ship, Home, Utensils, Scissors, MapPin, Dumbbell, 
  Stethoscope, Calendar, Car, GraduationCap, Scale, 
  PawPrint, SprayCan, Baby, Flower2, Pill, Store, Shield, Waves,
  ChevronDown, Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

const ALL_VERTICALS = [
  { key: 'yachts', icon: Ship, label: 'Charters', labelRu: 'Чартер', href: '/admin/yachts', color: 'text-info' },
  { key: 'properties', icon: Home, label: 'Properties', labelRu: 'Недвижимость', href: '/admin/properties', color: 'text-success' },
  { key: 'tours', icon: MapPin, label: 'Tours', labelRu: 'Туры', href: '/admin/tours', color: 'text-warning' },
  { key: 'restaurants', icon: Utensils, label: 'Restaurants', labelRu: 'Рестораны', href: '/admin/restaurants', color: 'text-destructive' },
  { key: 'salons', icon: Scissors, label: 'Salons', labelRu: 'Салоны', href: '/admin/salons', color: 'text-accent-purple' },
  { key: 'clinics', icon: Stethoscope, label: 'Clinics', labelRu: 'Клиники', href: '/admin/clinics', color: 'text-destructive' },
  { key: 'gyms', icon: Dumbbell, label: 'Fitness', labelRu: 'Фитнес', href: '/admin/gyms', color: 'text-accent-amber' },
  { key: 'events', icon: Calendar, label: 'Events', labelRu: 'События', href: '/admin/events', color: 'text-accent-cyan' },
  { key: 'vehicles', icon: Car, label: 'Transport', labelRu: 'Транспорт', href: '/admin/vehicles', color: 'text-muted-foreground' },
  { key: 'education', icon: GraduationCap, label: 'Education', labelRu: 'Образование', href: '/admin/education', color: 'text-primary' },
  { key: 'legal', icon: Scale, label: 'Legal', labelRu: 'Юридические', href: '/admin/legal', color: 'text-accent-amber' },
  { key: 'pets', icon: PawPrint, label: 'Pets', labelRu: 'Питомцы', href: '/admin/pets', color: 'text-destructive' },
  { key: 'cleaning', icon: SprayCan, label: 'Cleaning', labelRu: 'Уборка', href: '/admin/cleaning', color: 'text-accent-teal' },
  { key: 'babysitters', icon: Baby, label: 'Babysitters', labelRu: 'Няни', href: '/admin/babysitters', color: 'text-accent-purple' },
  { key: 'flowers', icon: Flower2, label: 'Flowers', labelRu: 'Цветы', href: '/admin/flowers', color: 'text-destructive' },
  { key: 'pharmacies', icon: Pill, label: 'Pharmacies', labelRu: 'Аптеки', href: '/admin/pharmacies', color: 'text-success' },
  { key: 'stores', icon: Store, label: 'Stores', labelRu: 'Магазины', href: '/admin/stores', color: 'text-info' },
  { key: 'insurance', icon: Shield, label: 'Insurance', labelRu: 'Страхование', href: '/admin/insurance', color: 'text-success' },
  { key: 'waterActivities', icon: Waves, label: 'Water', labelRu: 'Вода', href: '/admin/water-activities', color: 'text-accent-cyan' },
];

export function AdminAllVerticalsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isLoading) {
    return (
      <Card className="p-3">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
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

  const total = ALL_VERTICALS.reduce((sum, v) => sum + getCount(v.key), 0);
  // Show top verticals (with count > 0) first, then rest in collapsible
  const activeVerticals = ALL_VERTICALS.filter(v => getCount(v.key) > 0);
  const emptyVerticals = ALL_VERTICALS.filter(v => getCount(v.key) === 0);

  return (
    <Card className="p-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 -m-1 p-1 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">
                {isRu ? 'Вертикали' : 'Verticals'}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {total}
              </Badge>
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </div>
        </CollapsibleTrigger>

        {/* Always show active verticals */}
        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5 mt-3">
          {activeVerticals.map((vertical) => {
            const Icon = vertical.icon;
            const count = getCount(vertical.key);
            
            return (
              <div
                key={vertical.key}
                className="flex flex-col items-center p-1.5 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-center"
                onClick={() => navigate(vertical.href)}
              >
                <div className={cn("mb-0.5", vertical.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold">{count}</p>
                <p className="text-[8px] text-muted-foreground truncate w-full leading-tight">
                  {isRu ? vertical.labelRu : vertical.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Collapsible empty verticals */}
        <CollapsibleContent>
          {emptyVerticals.length > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5 mt-1.5">
              {emptyVerticals.map((vertical) => {
                const Icon = vertical.icon;
                return (
                  <div
                    key={vertical.key}
                    className="flex flex-col items-center p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors text-center opacity-50"
                    onClick={() => navigate(vertical.href)}
                  >
                    <div className={cn("mb-0.5", vertical.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold">0</p>
                    <p className="text-[8px] text-muted-foreground truncate w-full leading-tight">
                      {isRu ? vertical.labelRu : vertical.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
