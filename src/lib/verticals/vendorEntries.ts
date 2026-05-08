/**
 * Canonical vendor entry registry — single source of truth for:
 *   • VendorQuickCreateFAB (Quick Create sheet)
 *   • VendorCategoryGrid (dashboard tiles)
 *   • Vendor onboarding (verticals checklist)
 *   • Universal Lead Form ↔ Manual add cross-linking
 *
 * Each entry has a canonical `id` matching DB-backed table semantics and
 * `aliases[]` for legacy slugs so vendor metadata captured before unification
 * still resolves correctly.
 */

import {
  Sparkles, Utensils, Car, Ship, Home, Calendar, Dumbbell, Brush, Baby,
  Flower2, Stethoscope, GraduationCap, Scale, PawPrint, Pill, Shield,
  Waves, PartyPopper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface VendorEntry {
  /** Canonical id (matches DB table semantics; used in intake/lead). */
  id: string;
  /** Legacy slugs we still accept on read (never written back). */
  aliases: string[];
  /** Manual-add page route. */
  vendorPath: string;
  icon: LucideIcon;
  /** Tailwind semantic color class. */
  color: string;
  nameEn: string;
  nameRu: string;
  fabEnabled: boolean;
  gridEnabled: boolean;
  /** Has a Universal Lead Form vertical. */
  leadEnabled: boolean;
}

export const VENDOR_ENTRIES: VendorEntry[] = [
  { id: 'salons', aliases: ['beauty'], vendorPath: '/vendor/beauty', icon: Sparkles, color: 'text-accent-coral', nameEn: 'Beauty & Spa', nameRu: 'Красота и спа', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'gyms', aliases: ['fitness'], vendorPath: '/vendor/fitness', icon: Dumbbell, color: 'text-accent-amber', nameEn: 'Fitness', nameRu: 'Фитнес', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'restaurants', aliases: [], vendorPath: '/vendor/restaurants', icon: Utensils, color: 'text-warning', nameEn: 'Restaurants', nameRu: 'Рестораны', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'tours', aliases: [], vendorPath: '/vendor/experiences', icon: Calendar, color: 'text-info', nameEn: 'Tours', nameRu: 'Туры', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'yachts', aliases: [], vendorPath: '/vendor/yachts', icon: Ship, color: 'text-accent-cyan', nameEn: 'Yachts', nameRu: 'Яхты', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'vehicles', aliases: ['transport'], vendorPath: '/vendor/transport', icon: Car, color: 'text-accent-purple', nameEn: 'Transport', nameRu: 'Транспорт', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'clinics', aliases: ['health', 'medical'], vendorPath: '/vendor/clinics', icon: Stethoscope, color: 'text-success', nameEn: 'Clinics', nameRu: 'Клиники', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'education_providers', aliases: ['education'], vendorPath: '/vendor/education', icon: GraduationCap, color: 'text-accent-purple', nameEn: 'Education', nameRu: 'Образование', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'properties', aliases: ['property', 'realestate'], vendorPath: '/vendor/properties', icon: Home, color: 'text-success', nameEn: 'Properties', nameRu: 'Недвижимость', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'cleaning_services', aliases: ['cleaning'], vendorPath: '/vendor/cleaning', icon: Brush, color: 'text-accent-teal', nameEn: 'Cleaning', nameRu: 'Клининг', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'babysitters', aliases: ['childcare'], vendorPath: '/vendor/babysitters', icon: Baby, color: 'text-destructive', nameEn: 'Babysitters', nameRu: 'Няни', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'flower_shops', aliases: ['flowers', 'flower'], vendorPath: '/vendor/flowers', icon: Flower2, color: 'text-accent-purple', nameEn: 'Flowers', nameRu: 'Цветы', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'events', aliases: ['event'], vendorPath: '/vendor/events', icon: PartyPopper, color: 'text-accent-purple', nameEn: 'Events', nameRu: 'Мероприятия', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'legal_services', aliases: ['legal', 'lawyers'], vendorPath: '/vendor/legal', icon: Scale, color: 'text-muted-foreground', nameEn: 'Legal', nameRu: 'Юридические', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'pet_services', aliases: ['pets', 'pet'], vendorPath: '/vendor/pets', icon: PawPrint, color: 'text-warning', nameEn: 'Pets', nameRu: 'Питомцы', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'water_activities', aliases: ['water', 'watersports'], vendorPath: '/vendor/activities', icon: Waves, color: 'text-accent-cyan', nameEn: 'Water Activities', nameRu: 'Водный спорт', fabEnabled: true, gridEnabled: true, leadEnabled: true },
  { id: 'pharmacies', aliases: ['pharmacy'], vendorPath: '/vendor/pharmacy', icon: Pill, color: 'text-success', nameEn: 'Pharmacy', nameRu: 'Аптека', fabEnabled: true, gridEnabled: true, leadEnabled: false },
  { id: 'insurance_providers', aliases: ['insurance'], vendorPath: '/vendor/insurance', icon: Shield, color: 'text-info', nameEn: 'Insurance', nameRu: 'Страхование', fabEnabled: true, gridEnabled: true, leadEnabled: false },
];

const ALIAS_INDEX: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const e of VENDOR_ENTRIES) {
    map[e.id] = e.id;
    for (const a of e.aliases) map[a] = e.id;
  }
  return map;
})();

/** Resolve any legacy alias (or canonical id) to the canonical id. */
export function resolveVendorAlias(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return ALIAS_INDEX[slug] ?? slug;
}

/** Resolve list of slugs, dedupe, preserving unknowns as-is. */
export function resolveVendorAliases(slugs: ReadonlyArray<string> | null | undefined): string[] {
  if (!slugs?.length) return [];
  const out = new Set<string>();
  for (const s of slugs) {
    const id = ALIAS_INDEX[s] ?? s;
    out.add(id);
  }
  return Array.from(out);
}

export function getVendorEntry(id: string | null | undefined): VendorEntry | undefined {
  if (!id) return undefined;
  const canonical = ALIAS_INDEX[id] ?? id;
  return VENDOR_ENTRIES.find(e => e.id === canonical);
}

export const VENDOR_ENTRY_IDS = VENDOR_ENTRIES.map(e => e.id);
