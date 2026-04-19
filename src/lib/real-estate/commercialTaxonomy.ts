/**
 * Commercial RE & Land taxonomies — bilingual labels for cards/filters.
 * Property type values stored as plain text in `properties.property_type`,
 * discriminated from residential by `properties.asset_class`.
 */

export type CommercialPropertyType =
  | 'office'
  | 'retail'
  | 'warehouse'
  | 'restaurant_space'
  | 'hotel_building'
  | 'mixed_use'
  | 'medical_clinic'
  | 'coworking'
  | 'showroom';

export type LandPlotType =
  | 'land_residential'
  | 'land_commercial'
  | 'land_agricultural'
  | 'land_beachfront';

export interface TaxonomyLabel {
  id: string;
  labelEn: string;
  labelRu: string;
  icon?: string;
}

export const COMMERCIAL_TYPES: TaxonomyLabel[] = [
  { id: 'office', labelEn: 'Office', labelRu: 'Офис', icon: '🏢' },
  { id: 'retail', labelEn: 'Retail', labelRu: 'Ритейл', icon: '🛍️' },
  { id: 'warehouse', labelEn: 'Warehouse', labelRu: 'Склад', icon: '🏬' },
  { id: 'restaurant_space', labelEn: 'Restaurant / Café', labelRu: 'Ресторан / Кафе', icon: '🍽️' },
  { id: 'hotel_building', labelEn: 'Hotel Building', labelRu: 'Отель', icon: '🏨' },
  { id: 'mixed_use', labelEn: 'Mixed-use', labelRu: 'Смешанного назначения', icon: '🏙️' },
  { id: 'medical_clinic', labelEn: 'Medical / Clinic', labelRu: 'Клиника', icon: '⚕️' },
  { id: 'coworking', labelEn: 'Coworking', labelRu: 'Коворкинг', icon: '💼' },
  { id: 'showroom', labelEn: 'Showroom', labelRu: 'Шоу-рум', icon: '🪑' },
];

export const LAND_TYPES: TaxonomyLabel[] = [
  { id: 'land_residential', labelEn: 'Residential land', labelRu: 'Жилое назначение', icon: '🏘️' },
  { id: 'land_commercial', labelEn: 'Commercial land', labelRu: 'Коммерческое назначение', icon: '🏢' },
  { id: 'land_agricultural', labelEn: 'Agricultural', labelRu: 'Сельхоз', icon: '🌾' },
  { id: 'land_beachfront', labelEn: 'Beachfront', labelRu: 'У моря', icon: '🏖️' },
];

export const TITLE_DEED_TYPES: TaxonomyLabel[] = [
  { id: 'chanote', labelEn: 'Chanote (Nor Sor 4)', labelRu: 'Чаноте (Nor Sor 4)' },
  { id: 'nor_sor_3_gor', labelEn: 'Nor Sor 3 Gor', labelRu: 'Nor Sor 3 Gor' },
  { id: 'nor_sor_3', labelEn: 'Nor Sor 3', labelRu: 'Nor Sor 3' },
  { id: 'sor_kor_1', labelEn: 'Sor Kor 1', labelRu: 'Sor Kor 1' },
  { id: 'condo_freehold', labelEn: 'Condo Freehold', labelRu: 'Кондо фрихолд' },
  { id: 'leasehold', labelEn: 'Leasehold', labelRu: 'Лизхолд' },
];

export function getCommercialTypeLabel(id: string, isRu: boolean): string {
  const t = COMMERCIAL_TYPES.find((x) => x.id === id);
  if (!t) return id;
  return isRu ? t.labelRu : t.labelEn;
}

export function getLandTypeLabel(id: string, isRu: boolean): string {
  const t = LAND_TYPES.find((x) => x.id === id);
  if (!t) return id;
  return isRu ? t.labelRu : t.labelEn;
}

export function getTitleDeedLabel(id: string | null | undefined, isRu: boolean): string | null {
  if (!id) return null;
  const t = TITLE_DEED_TYPES.find((x) => x.id === id);
  if (!t) return id;
  return isRu ? t.labelRu : t.labelEn;
}

/** rai · ngan · wah from sqm. 1 rai = 1600 m², 1 ngan = 400 m², 1 sq.wah = 4 m². */
export function formatLandSize(sqm: number, isRu: boolean): string {
  if (!sqm || sqm <= 0) return '';
  const rai = Math.floor(sqm / 1600);
  const remainAfterRai = sqm - rai * 1600;
  const ngan = Math.floor(remainAfterRai / 400);
  const remainAfterNgan = remainAfterRai - ngan * 400;
  const wah = Math.round(remainAfterNgan / 4);
  const parts: string[] = [];
  if (rai > 0) parts.push(`${rai} ${isRu ? 'рай' : 'rai'}`);
  if (ngan > 0) parts.push(`${ngan} ${isRu ? 'нган' : 'ngan'}`);
  if (wah > 0) parts.push(`${wah} ${isRu ? 'ва' : 'wah'}`);
  return parts.join(' · ') || `${sqm} m²`;
}
