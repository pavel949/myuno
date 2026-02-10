/**
 * @module ManagerCalendar
 * @description Calendar page for Property Manager — reuses Owner's Airbnb calendar
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAssignedProperties } from '@/hooks/useAssignedProperties';
import { AirbnbCalendarGrid } from '@/components/owner/AirbnbCalendarGrid';
import { CalendarTodayTasks } from '@/components/owner/CalendarTodayTasks';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function ManagerCalendar() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams] = useSearchParams();
  const { properties, isLoading } = useAssignedProperties();

  const initialPropertyId = searchParams.get('property') || properties[0]?.property_id || '';
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId);

  // Sync selection when properties load
  const effectiveId = selectedPropertyId || properties[0]?.property_id || '';

  // Adapt AssignedProperty[] to the shape PropertyThumbnailSelector / AirbnbCalendarGrid needs
  const propertyRefs = useMemo(() => 
    properties.map(p => ({
      id: p.property_id,
      title: p.title,
      title_ru: p.title_ru,
      cover_image: p.cover_image,
    })),
    [properties]
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-16 bg-muted animate-pulse rounded-xl" />
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {isRu ? 'Нет назначенных объектов' : 'No properties assigned'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Property selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {properties.map(p => (
          <button
            key={p.property_id}
            onClick={() => setSelectedPropertyId(p.property_id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm whitespace-nowrap transition-colors shrink-0",
              effectiveId === p.property_id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            {p.cover_image ? (
              <img src={p.cover_image} alt="" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium">{isRu ? p.title_ru : p.title}</span>
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <AirbnbCalendarGrid propertyId={effectiveId} properties={propertyRefs as any} />

      {/* Today's tasks */}
      <CalendarTodayTasks propertyId={effectiveId} />
    </div>
  );
}
