/**
 * RoomTypesSection — guest-facing room picker for a hotel PropertyDetail.
 *
 * Shown only when the hotel exposes bookable room types (Part 5B). Until the
 * room_types table ships, useRoomTypes returns [] and this section renders
 * nothing, so the page falls back to the whole-property "Request to book" flow.
 * Each room's Reserve carries room_type_id + name into PropertyInquiry, which
 * turns it into a room_rental order item.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { BedDouble, Users, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useRoomTypes, hasBookableRoomTypes, type RoomType } from '@/hooks/useRoomTypes';

interface RoomTypesSectionProps {
  propertyId: string;
  dateRange?: DateRange;
  guestCount?: number;
}

function bedSummary(room: RoomType): string {
  if (!room.bed_config.length) return '';
  return room.bed_config
    .map((b) => {
      const label = b.type.charAt(0).toUpperCase() + b.type.slice(1);
      return b.count > 1 ? `${b.count} × ${label}` : label;
    })
    .join(' · ');
}

function RoomTypeRow({
  room,
  onReserve,
}: {
  room: RoomType;
  onReserve: (room: RoomType) => void;
}) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const name = (isRu ? room.name_ru : room.name_en) || room.name_en;
  const description = isRu ? room.description_ru : room.description_en;
  const beds = bedSummary(room);
  const amenities = room.amenities.slice(0, 4);

  return (
    <div className="flex flex-col gap-4 rounded-none border border-border/60 bg-card p-4 sm:flex-row sm:items-stretch">
      {room.images[0] && (
        <div className="h-32 w-full shrink-0 overflow-hidden rounded-none sm:h-auto sm:w-44">
          <img
            src={room.images[0]}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug text-foreground">{name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {isRu ? `До ${room.max_occupancy} гостей` : `Up to ${room.max_occupancy} guests`}
          </span>
          {beds && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {beds}
            </span>
          )}
          {room.refundable && (
            <span className="inline-flex items-center gap-1 text-success">
              <RefreshCcw className="h-3.5 w-3.5" />
              {isRu ? 'Возврат' : 'Refundable'}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {amenities.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {amenities.map((a) => (
              <li key={a} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Check className="h-3 w-3 text-primary" />
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-row items-end justify-between gap-2 sm:flex-col sm:items-end sm:justify-between">
        <div className="text-right">
          {room.base_price_per_night != null ? (
            <>
              <p className="text-lg font-bold leading-none tracking-tight">
                {formatPrice(room.base_price_per_night)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isRu ? 'за ночь' : 'per night'}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Цена по запросу' : 'Price on request'}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => onReserve(room)}>
          {isRu ? 'Забронировать' : 'Reserve'}
        </Button>
      </div>
    </div>
  );
}

export function RoomTypesSection({ propertyId, dateRange, guestCount }: RoomTypesSectionProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: roomTypes = [] } = useRoomTypes(propertyId);

  if (!hasBookableRoomTypes(roomTypes)) return null;

  const bookable = roomTypes
    .filter((r) => r.is_bookable && r.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleReserve = (room: RoomType) => {
    const params = new URLSearchParams();
    if (dateRange?.from && dateRange?.to) {
      params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    }
    if (guestCount) params.set('guests', String(guestCount));
    params.set('roomType', room.id);
    params.set('roomName', (isRu ? room.name_ru : room.name_en) || room.name_en);
    navigate(`${APP_ROUTES.PROPERTY_INQUIRY(propertyId)}?${params.toString()}`);
  };

  return (
    <section aria-labelledby="room-types-heading">
      <h2 id="room-types-heading" className="text-xl lg:text-2xl font-semibold mb-1">
        {isRu ? 'Выберите номер' : 'Choose your room'}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {isRu
          ? 'Тип номера определяет вместимость и цену за ночь.'
          : 'Each room type sets its own capacity and nightly price.'}
      </p>
      <div className="space-y-3">
        {bookable.map((room) => (
          <RoomTypeRow key={room.id} room={room} onReserve={handleReserve} />
        ))}
      </div>
    </section>
  );
}
