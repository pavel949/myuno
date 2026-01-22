import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Home, Calendar, MapPin, ChevronRight, BookOpen } from 'lucide-react';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface GuestStayBlockProps {
  booking: {
    id: string;
    check_in: string;
    check_out: string;
    property_id: string;
    property?: {
      title?: string;
      address?: string;
      cover_image?: string;
    };
  } | null;
  loading?: boolean;
}

export function GuestStayBlock({ booking, loading }: GuestStayBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  if (loading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-2 w-full mt-3" />
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
        onClick={() => navigate('/discover')}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Проживание' : 'Stay'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="p-3 rounded-xl bg-muted">
            <Home className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{isRu ? 'Нет активного проживания' : 'No active stay'}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Забронируйте жильё' : 'Book a property'}
            </p>
          </div>
        </div>
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

  const getCheckoutLabel = () => {
    if (isToday(checkOut)) return isRu ? 'Сегодня' : 'Today';
    if (isTomorrow(checkOut)) return isRu ? 'Завтра' : 'Tomorrow';
    return format(checkOut, 'd MMM', { locale });
  };

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        daysRemaining <= 1 && "border-warning/30"
      )}
      onClick={() => navigate(`/property/${booking.property_id}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Проживание' : 'Stay'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Property info */}
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {booking.property?.cover_image ? (
            <img 
              src={booking.property.cover_image} 
              alt="" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-sm">
            {booking.property?.title || (isRu ? 'Бронирование' : 'Booking')}
          </h3>
          {booking.property?.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{booking.property.address}</span>
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(checkIn, 'd MMM', { locale })} — {format(checkOut, 'd MMM', { locale })}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{isRu ? 'Прогресс' : 'Progress'}</span>
          <span className={cn(
            "font-medium",
            daysRemaining <= 1 ? "text-warning" : "text-muted-foreground"
          )}>
            {daysRemaining} {isRu ? 'дн.' : 'd'} → {getCheckoutLabel()}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Quick action */}
      <div 
        className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-primary"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/guest/guide/${booking.property_id}`);
        }}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>{isRu ? 'Открыть гайдбук' : 'Open guidebook'}</span>
      </div>
    </Card>
  );
}
