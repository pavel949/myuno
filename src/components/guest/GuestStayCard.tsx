import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  Home
} from 'lucide-react';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface GuestStayCardProps {
  booking: {
    id: string;
    check_in: string;
    check_out: string;
    property?: {
      id: string;
      name_en?: string;
      name_ru?: string;
      address?: string;
      cover_image?: string;
    };
    status: string;
  } | null;
  loading?: boolean;
}

export function GuestStayCard({ booking, loading }: GuestStayCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
            <Home className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">
            {isRu ? 'Нет активного проживания' : 'No active stay'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Забронируйте жильё для отображения здесь' : 'Book a property to see it here'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const today = new Date();
  
  const totalDays = differenceInDays(checkOut, checkIn);
  const daysElapsed = Math.max(0, differenceInDays(today, checkIn));
  const daysRemaining = Math.max(0, differenceInDays(checkOut, today));
  const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  const propertyName = isRu 
    ? booking.property?.name_ru || booking.property?.name_en 
    : booking.property?.name_en;

  const getCheckoutLabel = () => {
    if (isToday(checkOut)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(checkOut)) return isRu ? 'Завтра' : 'Tomorrow';
    return format(checkOut, 'd MMM', { locale });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Property Info */}
        <div 
          className="p-4 flex gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => booking.property?.id && navigate(APP_ROUTES.PROPERTY_DETAIL(booking.property.id))}
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {booking.property?.cover_image ? (
              <img 
                src={booking.property.cover_image} 
                alt={propertyName || ''} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate">
                {propertyName || (isRu ? 'Бронирование' : 'Booking')}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
            {booking.property?.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{booking.property.address}</span>
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(checkIn, 'd MMM', { locale })} - {format(checkOut, 'd MMM', { locale })}
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {isRu ? 'Прогресс проживания' : 'Stay progress'}
            </span>
            <span className={cn(
              "font-medium",
              daysRemaining <= 1 ? "text-warning" : "text-muted-foreground"
            )}>
              {daysRemaining} {isRu 
                ? (daysRemaining === 1 ? 'день' : 'дней') 
                : (daysRemaining === 1 ? 'day' : 'days')} {isRu ? 'осталось' : 'left'}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{format(checkIn, 'd MMM', { locale })}</span>
            <span className={cn(
              daysRemaining <= 1 && "text-warning font-medium"
            )}>
              {isRu ? 'Выезд' : 'Checkout'}: {getCheckoutLabel()}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate(`/guest/guide/${booking.property?.id}`)}
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            {isRu ? 'Гайд' : 'Guide'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/guest/chat')}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            {isRu ? 'Чат' : 'Chat'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
