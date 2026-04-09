import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyCalendar, AvailabilityEntry, ActivityLogEntry } from '@/components/property/PropertyCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { SeasonalPricingRule } from '@/lib/pricingEngine';
import { useExternalCalendars } from '@/hooks/useExternalCalendars';
import { useStaysUnifiedCalendar } from '@/hooks/useStaysUnifiedCalendar';

import { toast } from 'sonner';
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

  const { calendars, syncAllCalendars, isSyncing } = useExternalCalendars(propertyId);
  const { data: unifiedData } = useStaysUnifiedCalendar(propertyId);

  const blockedDays = availability.filter((a) => a.status === 'blocked').length;
  const bookedDays = availability.filter((a) => a.status === 'booked').length;

  const activeChannelCount = calendars?.filter(
    (c) => c.property_id === propertyId && c.is_active !== false,
  ).length ?? 0;

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
        details: entry.details as unknown as Json,
      });
    } catch {
      /* non-fatal */
    }
  };

  const handleSyncAll = async () => {
    if (!propertyId) return;
    try {
      const result = await syncAllCalendars(propertyId);
      if (result && typeof result === 'object' && 'skipped' in result && result.skipped) {
        toast.error(isRu ? 'Нет каналов' : 'No channels', {
          description: isRu
            ? 'Добавьте активный iCal канал для этого объекта.'
            : 'Add an active iCal channel for this property first.',
        });
        return;
      }
      toast(isRu ? 'Синхронизация запущена' : 'Sync started', {
        description: isRu
          ? 'Календари обновляются. Данные появятся через несколько секунд.'
          : 'Calendars are updating. Data will refresh shortly.',
      });
    } catch (e) {
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: e instanceof Error ? e.message : 'Sync failed',
      });
    }
  };

  const unifiedDayMeta = propertyId ? unifiedData?.unifiedDayMeta : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isRu ? 'Календарь доступности' : 'Availability Calendar'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRu
            ? 'Все каналы (OTA и вручную) на одном календаре. Конфликты подсвечены красным.'
            : 'All channels (OTA and manual) in one view. Conflicts are highlighted in red.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="secondary" className="px-3 py-1">
          {isRu ? 'Заблокировано:' : 'Blocked:'} {blockedDays}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          {isRu ? 'Забронировано (лист):' : 'Booked (sheet):'} {bookedDays}
        </Badge>
        {propertyId && (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2 ml-auto"
            disabled={isSyncing || activeChannelCount === 0}
            onClick={handleSyncAll}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isRu ? 'Синхронизировать все' : 'Sync all channels'}
          </Button>
        )}
      </div>

      <PropertyCalendar
        availability={availability}
        onChange={onChange}
        basePrice={basePrice}
        currency={currency}
        seasonalPricing={seasonalPricing}
        onLogActivity={propertyId ? handleLogActivity : undefined}
        unifiedDayMeta={unifiedDayMeta}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {isRu ? 'Каналы iCal' : 'iCal channels'}
          </CardTitle>
          <CardDescription>
            {isRu
              ? `Активных каналов: ${activeChannelCount}. Управление каналами — в настройках канал-менеджера.`
              : `Active channels: ${activeChannelCount}. Manage links in channel manager settings.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {isRu
            ? 'Кнопка «Синхронизировать все» вызывает edge function ical-sync для каждого активного канала этого объекта.'
            : '“Sync all channels” invokes the ical-sync edge function for each active calendar of this property.'}
        </CardContent>
      </Card>
    </div>
  );
}
