import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyCalendar, AvailabilityEntry } from '@/components/property/PropertyCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Link2, ExternalLink } from 'lucide-react';
import type { SeasonalPricingRule } from '@/lib/pricingEngine';

interface CalendarSectionProps {
  availability: AvailabilityEntry[];
  onChange: (availability: AvailabilityEntry[]) => void;
  basePrice: number;
  currency: string;
  seasonalPricing?: SeasonalPricingRule[];
}

export function PropertyManageCalendarSection({
  availability,
  onChange,
  basePrice,
  currency,
  seasonalPricing,
}: CalendarSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Count blocked and booked days
  const blockedDays = availability.filter(a => a.status === 'blocked').length;
  const bookedDays = availability.filter(a => a.status === 'booked').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isRu ? 'Календарь доступности' : 'Availability Calendar'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu 
            ? 'Управляйте датами бронирования и ценами для каждого дня' 
            : 'Manage booking dates and prices for each day'}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-3 py-1">
          {isRu ? 'Заблокировано:' : 'Blocked:'} {blockedDays}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          {isRu ? 'Забронировано:' : 'Booked:'} {bookedDays}
        </Badge>
      </div>

      {/* Calendar */}
      <PropertyCalendar
        availability={availability}
        onChange={onChange}
        basePrice={basePrice}
        currency={currency}
        seasonalPricing={seasonalPricing}
      />

      {/* iCal Sync Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {isRu ? 'Синхронизация календаря' : 'Calendar Sync'}
          </CardTitle>
          <CardDescription>
            {isRu 
              ? 'Синхронизируйте с Airbnb, Booking.com и другими платформами' 
              : 'Sync with Airbnb, Booking.com and other platforms'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {isRu ? 'Импорт iCal' : 'Import iCal'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {isRu ? 'Экспорт iCal' : 'Export iCal'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? 'Вставьте ссылку iCal с другой платформы для автоматической синхронизации занятости' 
              : 'Paste an iCal link from another platform to automatically sync availability'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
