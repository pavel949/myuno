/**
 * PropertySleepingArrangements — public "Where you'll sleep" block (Airbnb parity).
 * Renders the structured `properties.rooms` jsonb captured by the PropertyRooms
 * editor: one card per bedroom with its bed configuration.
 */
import { Bed } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type BedType = 'king' | 'queen' | 'double' | 'single' | 'sofa_bed' | 'bunk';

interface RoomBed {
  type: BedType | string;
  count?: number;
}

interface RoomLike {
  id?: string;
  type?: string;
  name?: string;
  nameRu?: string;
  beds?: RoomBed[];
}

const BED_LABELS: Record<BedType, { en: string; ru: string; th: string }> = {
  king: { en: 'king bed', ru: 'кровать king', th: 'เตียงคิง' },
  queen: { en: 'queen bed', ru: 'кровать queen', th: 'เตียงควีน' },
  double: { en: 'double bed', ru: 'двуспальная кровать', th: 'เตียงคู่' },
  single: { en: 'single bed', ru: 'односпальная кровать', th: 'เตียงเดี่ยว' },
  sofa_bed: { en: 'sofa bed', ru: 'диван-кровать', th: 'โซฟาเบด' },
  bunk: { en: 'bunk bed', ru: 'двухъярусная кровать', th: 'เตียงสองชั้น' },
};

interface PropertySleepingArrangementsProps {
  /** Raw `properties.rooms` value (jsonb). */
  rooms?: unknown;
}

export function PropertySleepingArrangements({ rooms }: PropertySleepingArrangementsProps = {}) {
  const { language } = useLanguage();
  const locale = language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en';

  const sleepingRooms = normalizeRooms(rooms)
    .map((room) => ({ ...room, beds: normalizeBeds(room.beds) }))
    .filter((room) => room.beds.length > 0);

  if (sleepingRooms.length === 0) return null;

  const title =
    locale === 'ru' ? 'Где вы будете спать' : locale === 'th' ? 'ที่นอน' : "Where you'll sleep";

  return (
    <section>
      <h2 className="text-xl lg:text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sleepingRooms.map((room, index) => (
          <div
            key={room.id ?? `${room.name ?? 'room'}-${index}`}
            className="border border-border/60 p-4 space-y-2"
          >
            <Bed className="w-5 h-5 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">
              {(locale === 'ru' ? room.nameRu || room.name : room.name || room.nameRu) ||
                fallbackRoomName(locale, index)}
            </p>
            <p className="text-sm text-muted-foreground">
              {room.beds
                .map((bed) => {
                  const raw = Number(bed.count);
                  const count = Number.isFinite(raw) && raw > 0 ? raw : 1;
                  const label =
                    BED_LABELS[bed.type as BedType]?.[locale] ?? String(bed.type ?? '').replace(/_/g, ' ');
                  return label ? `${count} ${label}` : String(count);
                })
                .join(', ')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function fallbackRoomName(locale: 'ru' | 'en' | 'th', index: number): string {
  if (locale === 'ru') return `Спальня ${index + 1}`;
  if (locale === 'th') return `ห้องนอน ${index + 1}`;
  return `Bedroom ${index + 1}`;
}

function normalizeRooms(rooms: unknown): RoomLike[] {
  const raw = (() => {
    if (!rooms) return [];
    if (Array.isArray(rooms)) return rooms;
    if (typeof rooms === 'string') {
      try {
        const parsed = JSON.parse(rooms);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    // Some records store rooms as an object map keyed by room id.
    if (typeof rooms === 'object') return Object.values(rooms as Record<string, unknown>);
    return [];
  })();

  return raw.filter(
    (room): room is RoomLike => !!room && typeof room === 'object' && !Array.isArray(room),
  );
}

/** Keep only bed entries that can safely be rendered. */
function normalizeBeds(beds: unknown): RoomBed[] {
  const raw = (() => {
    if (Array.isArray(beds)) return beds;
    if (typeof beds === 'string') {
      try {
        const parsed = JSON.parse(beds);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  return raw
    .filter((bed): bed is RoomBed => !!bed && typeof bed === 'object' && !Array.isArray(bed))
    .filter((bed) => bed.type !== null && bed.type !== undefined && bed.type !== '');
}
