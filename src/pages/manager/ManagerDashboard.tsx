/**
 * @module ManagerDashboard
 * @description Main dashboard for Property Managers — focused on "what to do today"
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAssignedProperties } from '@/hooks/useAssignedProperties';
import { CalendarTodayTasks } from '@/components/owner/CalendarTodayTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Home,
  LogIn,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Property Card Component
function PropertyCard({ 
  property,
  isRu,
  onClick,
}: { 
  property: ReturnType<typeof useAssignedProperties>['properties'][0];
  isRu: boolean;
  onClick: () => void;
}) {
  const statusConfig = {
    available: { 
      icon: CheckCircle2, 
      labelEn: 'Available', 
      labelRu: 'Свободно',
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    occupied: { 
      icon: Users, 
      labelEn: 'Occupied', 
      labelRu: 'Занято',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    checkin: { 
      icon: LogIn, 
      labelEn: 'Check-in today', 
      labelRu: 'Заезд сегодня',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    },
    checkout: { 
      icon: LogOut, 
      labelEn: 'Check-out today', 
      labelRu: 'Выезд сегодня',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
  };

  const status = statusConfig[property.today_status];
  const StatusIcon = status.icon;

  return (
    <Card 
      className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            {property.cover_image ? (
              <img 
                src={property.cover_image} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {isRu ? property.title_ru : property.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {property.district || property.address || (isRu ? 'Адрес не указан' : 'No address')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={cn("gap-1 text-xs", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {isRu ? status.labelRu : status.labelEn}
              </Badge>
              {property.upcoming_bookings_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {property.upcoming_bookings_count} {isRu ? 'брон.' : 'bookings'}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors self-center" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ isRu }: { isRu: boolean }) {
  const navigate = useNavigate();
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">
          {isRu ? 'Нет назначенных объектов' : 'No Properties Assigned'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          {isRu 
            ? 'Вам пока не назначены объекты. Свяжитесь с владельцем или администратором.'
            : 'No properties are assigned to you yet. Contact the owner or administrator.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/support')}>
          {isRu ? 'Связаться с поддержкой' : 'Contact Support'}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { properties, stats, isLoading, hasProperties } = useAssignedProperties();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isRu ? 'Панель управляющего' : 'Property Manager'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {isRu 
            ? 'Управляйте назначенными объектами и бронированиями' 
            : 'Manage assigned properties and bookings'}
        </p>
        <Button onClick={() => navigate('/auth')} size="lg">
          {isRu ? 'Войти' : 'Sign In'}
        </Button>
      </div>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  // Summary line
  const summaryParts: string[] = [];
  if (stats.totalProperties > 0) {
    summaryParts.push(`${stats.totalProperties} ${isRu ? 'объект' + (stats.totalProperties > 1 ? (stats.totalProperties < 5 ? 'а' : 'ов') : '') : 'propert' + (stats.totalProperties > 1 ? 'ies' : 'y')}`);
  }
  if (stats.upcomingCheckIns > 0) {
    summaryParts.push(`${stats.upcomingCheckIns} ${isRu ? 'заезд сегодня' : 'check-in today'}`);
  }
  if (stats.currentGuests > 0) {
    summaryParts.push(`${stats.currentGuests} ${isRu ? 'гостей сейчас' : 'guests now'}`);
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
    if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
    return isRu ? 'Добрый вечер' : 'Good evening';
  })();

  return (
    <div className="p-4 pb-24 space-y-5 max-w-full overflow-x-hidden">
      {/* Greeting + summary */}
      <div>
        <h1 className="text-xl font-bold">{greeting}!</h1>
        {summaryParts.length > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {summaryParts.join(' · ')}
          </p>
        )}
      </div>

      {/* Today's tasks — reused from Owner module */}
      {hasProperties && <CalendarTodayTasks />}

      {/* Properties Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            {isRu ? 'Мои объекты' : 'My Properties'}
          </h2>
          {hasProperties && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => navigate('/manager/properties')}
            >
              {isRu ? 'Все' : 'View all'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {!hasProperties ? (
          <EmptyState isRu={isRu} />
        ) : (
          <div className="space-y-3">
            {properties.slice(0, 5).map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                isRu={isRu}
                onClick={() => navigate(`/manager/properties/${property.property_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
