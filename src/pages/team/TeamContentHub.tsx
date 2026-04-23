import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyUnoPermissions, VERTICAL_LABELS, type Vertical } from '@/hooks/useUnoTeamPermissions';
import { TeamLayout } from '@/components/team/TeamLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ship, MapPin, Building, UtensilsCrossed, Sparkles, Calendar,
  Stethoscope, Dumbbell, Waves, Brush, Baby, GraduationCap,
  Flower, PawPrint, Car, Shield, Plus, ExternalLink, Lock
} from 'lucide-react';

const VERTICAL_ICONS: Record<Vertical, typeof Ship> = {
  yachts: Ship,
  tours: MapPin,
  properties: Building,
  restaurants: UtensilsCrossed,
  salons: Sparkles,
  events: Calendar,
  clinics: Stethoscope,
  gyms: Dumbbell,
  water_activities: Waves,
  cleaning: Brush,
  babysitters: Baby,
  education: GraduationCap,
  flowers: Flower,
  pets: PawPrint,
  vehicles: Car,
  insurance: Shield,
};

const VERTICAL_ROUTES: Partial<Record<Vertical, string>> = {
  yachts: '/vendor/yachts',
  tours: '/vendor/tours',
  properties: '/vendor/properties',
  restaurants: '/vendor/restaurants',
  salons: '/vendor/beauty',
  events: '/vendor/events',
  clinics: '/vendor/clinics',
  gyms: '/vendor/fitness',
  cleaning: '/vendor/cleaning',
  babysitters: '/vendor/babysitters',
  education: '/vendor/education',
  flowers: '/vendor/flowers',
  pets: '/vendor/pets',
  vehicles: '/vendor/transport',
};

export default function TeamContentHub() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { permissions, allowedVerticals, isLoading, canAccess } = useMyUnoPermissions();

  if (isLoading) {
    return (
      <TeamLayout title={isRu ? 'Контент' : 'Content'}>
        <div className="py-6 px-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </TeamLayout>
    );
  }

  const allVerticals = Object.keys(VERTICAL_LABELS) as Vertical[];

  return (
    <TeamLayout title={isRu ? 'Контент' : 'Content'}>
      <div className="py-6 px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {isRu ? 'Добавление контента' : 'Content Management'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Добавляйте товары, услуги и объекты для отправки на модерацию' 
              : 'Add products, services, and listings for moderation review'}
          </p>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Plus className="h-3 w-3" />
                {allowedVerticals.length} {isRu ? 'доступных вертикалей' : 'available verticals'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Контент будет отправлен на утверждение администратору'
                  : 'Content will be sent for admin approval'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Verticals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allVerticals.map(vertical => {
            const Icon = VERTICAL_ICONS[vertical];
            const hasAccess = canAccess(vertical, 'create');
            const route = VERTICAL_ROUTES[vertical];
            const label = VERTICAL_LABELS[vertical];

            return (
              <Card 
                key={vertical}
                className={`transition-all ${
                  hasAccess 
                    ? 'hover:border-primary/50 hover:shadow-md cursor-pointer' 
                    : 'opacity-50'
                }`}
                onClick={() => hasAccess && route && navigate(`${route}?uno_team=true`)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-none ${
                    hasAccess 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {hasAccess ? (
                      <Icon className="h-6 w-6" />
                    ) : (
                      <Lock className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{isRu ? label.ru : label.en}</p>
                    {hasAccess ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRu ? 'Добавить' : 'Add new'}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRu ? 'Нет доступа' : 'No access'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help */}
        {allowedVerticals.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">
                {isRu ? 'Нет назначенных прав' : 'No permissions assigned'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isRu 
                  ? 'Обратитесь к администратору для получения доступа к добавлению контента в нужных категориях.'
                  : 'Contact an administrator to get access to add content in the required categories.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TeamLayout>
  );
}
