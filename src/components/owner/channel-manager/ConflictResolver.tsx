import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingConflicts, ConflictInfo } from '@/hooks/useChannelHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ConflictResolverProps {
  propertyId: string;
  propertyName?: string;
}

export function ConflictResolver({ propertyId, propertyName }: ConflictResolverProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const navigate = useNavigate();

  const { data: conflicts, isLoading } = useBookingConflicts(propertyId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-success" />
          <p className="font-medium text-success">
            {isRu ? 'Нет конфликтов бронирований' : 'No booking conflicts'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu 
              ? 'Все даты бронирований не пересекаются' 
              : 'All booking dates are conflict-free'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">
          {isRu 
            ? `${conflicts.length} конфликт${conflicts.length > 1 ? 'а' : ''} обнаружен${conflicts.length > 1 ? 'о' : ''}` 
            : `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} detected`}
        </h3>
      </div>

      {conflicts.map((conflict, index) => (
        <ConflictCard 
          key={`${conflict.bookingId1}-${conflict.bookingId2}`}
          conflict={conflict}
          isRu={isRu}
          locale={locale}
          onNavigate={(bookingId) => navigate(`/owner/bookings/${bookingId}`)}
        />
      ))}
    </div>
  );
}

function ConflictCard({ 
  conflict, 
  isRu, 
  locale,
  onNavigate 
}: { 
  conflict: ConflictInfo; 
  isRu: boolean; 
  locale: any;
  onNavigate: (bookingId: string) => void;
}) {
  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="destructive" className="text-xs">
            {conflict.overlapDays} {isRu ? 'дн. пересечения' : 'days overlap'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Booking 1 */}
          <BookingConflictItem
            guestName={conflict.guestName1}
            source={conflict.source1}
            checkIn={conflict.checkIn1}
            checkOut={conflict.checkOut1}
            isRu={isRu}
            locale={locale}
            onClick={() => onNavigate(conflict.bookingId1)}
          />

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </div>

          {/* Booking 2 */}
          <BookingConflictItem
            guestName={conflict.guestName2}
            source={conflict.source2}
            checkIn={conflict.checkIn2}
            checkOut={conflict.checkOut2}
            isRu={isRu}
            locale={locale}
            onClick={() => onNavigate(conflict.bookingId2)}
          />
        </div>

        <div className="mt-3 pt-3 border-t border-warning/20">
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? 'Рекомендация: Отмените одно из бронирований или свяжитесь с гостями для переноса дат.'
              : 'Recommendation: Cancel one booking or contact guests to reschedule.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingConflictItem({
  guestName,
  source,
  checkIn,
  checkOut,
  isRu,
  locale,
  onClick
}: {
  guestName: string;
  source: string;
  checkIn: string;
  checkOut: string;
  isRu: boolean;
  locale: any;
  onClick: () => void;
}) {
  return (
    <div 
      className="p-3 bg-background rounded-lg border cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm truncate">{guestName}</span>
        <Badge variant="outline" className="text-xs shrink-0">
          {source}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          {format(new Date(checkIn), 'dd MMM', { locale })}
          <ArrowRight className="h-3 w-3 inline mx-1" />
          {format(new Date(checkOut), 'dd MMM', { locale })}
        </span>
      </div>
    </div>
  );
}

// Compact conflict alert for dashboard
export function ConflictAlert({ 
  propertyId, 
  compact = false 
}: { 
  propertyId: string; 
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const { data: conflicts } = useBookingConflicts(propertyId);

  if (!conflicts || conflicts.length === 0) return null;

  if (compact) {
    return (
      <Badge 
        variant="destructive" 
        className="cursor-pointer"
        onClick={() => navigate(`/owner/properties/${propertyId}/calendar`)}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {conflicts.length}
      </Badge>
    );
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-sm text-destructive">
              {conflicts.length} {isRu ? 'конфликт' : 'conflict'}{conflicts.length > 1 ? (isRu ? 'а' : 's') : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Пересекающиеся даты бронирований' : 'Overlapping booking dates'}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate(`/owner/properties/${propertyId}/calendar`)}
          >
            {isRu ? 'Исправить' : 'Resolve'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
