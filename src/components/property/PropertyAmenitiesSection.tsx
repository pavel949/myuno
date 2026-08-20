/**
 * PropertyAmenitiesSection — public amenity block grouped by catalogue category
 * (Airbnb "What this place offers" parity).
 *
 * Reads structured `property_amenities` rows; when a listing has none yet it
 * falls back to the legacy `properties.amenities` string array so nothing
 * disappears from older listings.
 */
import { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  amenityName,
  usePropertyAmenities,
  type MediaLocale,
  type PropertyAmenityItem,
} from '@/hooks/usePropertyListingQuality';

const CATEGORY_LABELS: Record<string, { en: string; ru: string; th: string }> = {
  essentials: { en: 'Essentials', ru: 'Основное', th: 'สิ่งจำเป็น' },
  kitchen: { en: 'Kitchen & dining', ru: 'Кухня и питание', th: 'ครัว' },
  outdoor: { en: 'Outdoor', ru: 'На улице', th: 'พื้นที่ภายนอก' },
  views: { en: 'Views', ru: 'Виды', th: 'วิว' },
  building: { en: 'Building & complex', ru: 'Дом и комплекс', th: 'อาคาร' },
  parking: { en: 'Parking', ru: 'Парковка', th: 'ที่จอดรถ' },
  safety: { en: 'Safety', ru: 'Безопасность', th: 'ความปลอดภัย' },
  access: { en: 'Arrival & access', ru: 'Заселение и доступ', th: 'การเข้าพัก' },
  family: { en: 'Family', ru: 'Для семьи с детьми', th: 'ครอบครัว' },
  accessibility: { en: 'Accessibility', ru: 'Доступность', th: 'การเข้าถึง' },
  policies: { en: 'Policies', ru: 'Правила', th: 'นโยบาย' },
  services: { en: 'Services', ru: 'Услуги', th: 'บริการ' },
};

const VISIBLE_LIMIT = 10;

interface PropertyAmenitiesSectionProps {
  propertyId?: string;
  /** Legacy `properties.amenities` values, used when no structured rows exist. */
  fallbackAmenities?: string[];
}

export function PropertyAmenitiesSection({
  propertyId,
  fallbackAmenities = [],
}: PropertyAmenitiesSectionProps) {
  const { language } = useLanguage();
  const locale = (language === 'ru' ? 'ru' : language === 'th' ? 'th' : 'en') as MediaLocale;
  const { data: amenities = [], isLoading } = usePropertyAmenities(propertyId);
  const [expanded, setExpanded] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, PropertyAmenityItem[]>();
    amenities.forEach((item) => {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [amenities]);

  const title =
    locale === 'ru' ? 'Удобства' : locale === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities';

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-6 w-40 bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-5 bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Legacy fallback: plain list, no categories available.
  if (amenities.length === 0) {
    if (fallbackAmenities.length === 0) return null;
    return (
      <section>
        <h2 className="text-xl lg:text-2xl font-semibold mb-4">{title}</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {fallbackAmenities.map((name) => (
            <li key={name} className="flex items-start gap-2 text-sm lg:text-base">
              <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden />
              <span className="text-foreground">{name}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const totalCount = amenities.length;
  const shownGroups = expanded ? grouped : limitGroups(grouped, VISIBLE_LIMIT);

  return (
    <section>
      <h2 className="text-xl lg:text-2xl font-semibold mb-4">{title}</h2>
      <div className="space-y-5">
        {shownGroups.map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {CATEGORY_LABELS[category]?.[locale] ?? category}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {items.map((item) => {
                const note = locale === 'ru' ? item.note_ru || item.note_en : item.note_en || item.note_ru;
                return (
                  <li key={item.code} className="flex items-start gap-2 text-sm lg:text-base">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden />
                    <span className="text-foreground">
                      {amenityName(item, locale)}
                      {note && <span className="text-muted-foreground"> — {note}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {!expanded && totalCount > VISIBLE_LIMIT && (
        <Button variant="outline" className="mt-4" onClick={() => setExpanded(true)}>
          {locale === 'ru'
            ? `Показать все удобства (${totalCount})`
            : locale === 'th'
              ? `ดูทั้งหมด (${totalCount})`
              : `Show all ${totalCount} amenities`}
          <ChevronDown className="w-4 h-4 ml-1" aria-hidden />
        </Button>
      )}
    </section>
  );
}

/** Trim groups so the collapsed view shows about `limit` amenities in total. */
function limitGroups(
  groups: Array<[string, PropertyAmenityItem[]]>,
  limit: number,
): Array<[string, PropertyAmenityItem[]]> {
  const out: Array<[string, PropertyAmenityItem[]]> = [];
  let budget = limit;
  for (const [category, items] of groups) {
    if (budget <= 0) break;
    out.push([category, items.slice(0, budget)]);
    budget -= items.length;
  }
  return out;
}
