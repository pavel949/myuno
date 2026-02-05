/**
 * @module ManagerDashboard
 * @description Main dashboard for Property Managers
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAssignedProperties } from '@/hooks/useAssignedProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Calendar, 
  Users, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Home,
  LogIn,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  className,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
          {trend && (
            <Badge variant="secondary" className="text-xs">
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
          {/* Thumbnail */}
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {isRu ? property.title_ru : property.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {property.district || property.address || (isRu ? 'Адрес не указан' : 'No address')}
            </p>
            
            {/* Status Badge */}
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

          {/* Arrow */}
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors self-center" />
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
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
            ? 'Вы являетесь управляющим, но пока вам не назначены объекты. Свяжитесь с владельцем или администратором.'
            : 'You are a property manager, but no properties are assigned to you yet. Contact the owner or administrator.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/support')}>
          {isRu ? 'Связаться с поддержкой' : 'Contact Support'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Loading State
function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
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

  // Not authenticated
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

  // Loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 space-y-6 max-w-full overflow-x-hidden">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl font-bold">
          {isRu ? 'Добро пожаловать!' : 'Welcome back!'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Обзор ваших назначенных объектов' 
            : 'Overview of your assigned properties'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon={Building2}
          label={isRu ? 'Объектов' : 'Properties'}
          value={stats.totalProperties}
        />
        <StatsCard
          icon={Users}
          label={isRu ? 'Гостей сейчас' : 'Current Guests'}
          value={stats.currentGuests}
        />
        <StatsCard
          icon={LogIn}
          label={isRu ? 'Заезды сегодня' : 'Check-ins Today'}
          value={stats.upcomingCheckIns}
        />
        <StatsCard
          icon={Calendar}
          label={isRu ? 'Активных' : 'Active'}
          value={stats.activeProperties}
        />
      </div>

      {/* Properties Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            {isRu ? 'Ваши объекты' : 'Your Properties'}
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

      {/* Quick Actions */}
      {hasProperties && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isRu ? 'Быстрые действия' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate('/manager/calendar')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">{isRu ? 'Календарь' : 'Calendar'}</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-3 flex-col gap-1"
              onClick={() => navigate('/manager/bookings')}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">{isRu ? 'Бронирования' : 'Bookings'}</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
