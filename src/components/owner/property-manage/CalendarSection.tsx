import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyCalendar, AvailabilityEntry, ActivityLogEntry } from '@/components/property/PropertyCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Link2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SeasonalPricingRule } from '@/lib/pricingEngine';

interface CalendarSectionProps {
  availability: AvailabilityEntry[];
  onChange: (availability: AvailabilityEntry[]) => void;
  basePrice: number;
  currency: string;
  seasonalPricing?: SeasonalPricingRule[];
  propertyId?: string;
}

export function PropertyManageCalendarSection({
  availability,
  onChange,
  basePrice,
  currency,
  seasonalPricing,
  propertyId,
}: CalendarSectionProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const blockedDays = availability.filter(a => a.status === 'blocked').length;
  const bookedDays = availability.filter(a => a.status === 'booked').length;

  const handleLogActivity = async (entry: ActivityLogEntry) => {
    if (!propertyId || !user) return;
    try {
      await supabase.from('property_activity_log').insert({
        property_id: propertyId,
        actor_id: user.id,
        actor_role: 'owner',
        action: entry.action,
        entity_type: entry.entity_type || null,
        entity_id: entry.entity_id || null,
        details: entry.details as any,
      });
    } catch (err) {
      logger.error('Failed to log activity:', err);
    }
  };

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
        onLogActivity={propertyId ? handleLogActivity : undefined}
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
