/**
 * Single source of truth for emergency contacts (numbers, hospitals, embassies).
 *
 * All emergency-facing surfaces consume this module so numbers and labels never
 * drift apart:
 *   - src/pages/SOS.tsx                            (the full /sos hub)
 *   - src/components/knowledge/EmergencyContacts.tsx  (Knowledge Hub teaser)
 *   - src/components/home/OfflineEmergencyCard.tsx (offline fallback)
 *
 * Bilingual (en/ru) and keyed by city slug. Icons are real Lucide components and
 * colours are stored as semantic design tokens (never raw hex / Tailwind brand
 * colours) per DESIGN.md.
 */
import {
  AlertTriangle,
  Shield,
  Heart,
  Flame,
  Stethoscope,
  FileQuestion,
  Car,
  type LucideIcon,
} from 'lucide-react';

export type EmergencyTone = 'destructive' | 'info' | 'warning' | 'accent-purple';

export interface EmergencyContact {
  id: string;
  nameEn: string;
  nameRu: string;
  /** Canonical number. Landlines use dashed grouping, e.g. 076-221-905. */
  phone: string;
  descEn?: string;
  descRu?: string;
  icon?: LucideIcon;
  tone?: EmergencyTone;
  /** Compact label for the quick-dial button grid (falls back to name). */
  shortLabelEn?: string;
  shortLabelRu?: string;
}

export interface EmergencyCategory {
  id: string;
  titleEn: string;
  titleRu: string;
  icon: LucideIcon;
  tone: EmergencyTone;
  contacts: EmergencyContact[];
}

export interface CityEmergencyData {
  /** The four critical lines shown as big tap targets. */
  quickDial: EmergencyContact[];
  /** Grouped directory (medical, police, documents, transport, …). */
  categories: EmergencyCategory[];
}

/** Maps a semantic tone token to the Tailwind utility classes surfaces use. */
export const EMERGENCY_TONE_CLASSES: Record<EmergencyTone, { color: string; bg: string }> = {
  destructive: { color: 'text-destructive', bg: 'bg-destructive/10' },
  info: { color: 'text-info', bg: 'bg-info/10' },
  warning: { color: 'text-warning', bg: 'bg-warning/10' },
  'accent-purple': { color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
};

const PHUKET: CityEmergencyData = {
  quickDial: [
    {
      id: 'police',
      nameEn: 'Tourist Police',
      nameRu: 'Туристическая полиция',
      phone: '1155',
      descEn: '24/7 English-speaking',
      descRu: 'Круглосуточно, на английском',
      icon: Shield,
      tone: 'info',
      shortLabelEn: 'Police',
      shortLabelRu: 'Полиция',
    },
    {
      id: 'ambulance',
      nameEn: 'Ambulance',
      nameRu: 'Скорая помощь',
      phone: '1669',
      descEn: 'Medical emergencies',
      descRu: 'Медицинские экстренные случаи',
      icon: Heart,
      tone: 'destructive',
      shortLabelEn: 'Ambulance',
      shortLabelRu: 'Скорая',
    },
    {
      id: 'fire',
      nameEn: 'Fire',
      nameRu: 'Пожарная служба',
      phone: '199',
      descEn: 'Fire emergency',
      descRu: 'Пожарная экстренная служба',
      icon: Flame,
      tone: 'warning',
      shortLabelEn: 'Fire',
      shortLabelRu: 'Пожарные',
    },
    {
      id: 'emergency',
      nameEn: 'Emergency (all)',
      nameRu: 'Экстренная (все)',
      phone: '191',
      descEn: 'Police, fire, ambulance',
      descRu: 'Полиция, пожар, скорая',
      icon: AlertTriangle,
      tone: 'destructive',
      shortLabelEn: 'SOS',
      shortLabelRu: 'SOS',
    },
  ],
  categories: [
    {
      id: 'medical',
      titleEn: 'Medical',
      titleRu: 'Медицина',
      icon: Stethoscope,
      tone: 'destructive',
      contacts: [
        {
          id: 'ambulance',
          nameEn: 'Ambulance',
          nameRu: 'Скорая помощь',
          phone: '1669',
          descEn: 'Medical emergencies',
          descRu: 'Медицинские экстренные случаи',
        },
        { id: 'phuket-international', nameEn: 'Phuket International Hospital', nameRu: 'Пхукет Интернешнл', phone: '076-249-400' },
        { id: 'bangkok-phuket', nameEn: 'Bangkok Hospital Phuket', nameRu: 'Бангкок Госпиталь', phone: '076-254-425' },
        { id: 'dibuk', nameEn: 'Dibuk Hospital', nameRu: 'Госпиталь Дибук', phone: '076-254-421' },
      ],
    },
    {
      id: 'police',
      titleEn: 'Police & Safety',
      titleRu: 'Полиция и безопасность',
      icon: Shield,
      tone: 'info',
      contacts: [
        {
          id: 'tourist-police',
          nameEn: 'Tourist Police',
          nameRu: 'Туристическая полиция',
          phone: '1155',
          descEn: '24/7 English-speaking',
          descRu: 'Круглосуточно, на английском',
        },
        {
          id: 'emergency-services',
          nameEn: 'Emergency Services',
          nameRu: 'Экстренные службы',
          phone: '191',
          descEn: 'Fire, ambulance, rescue',
          descRu: 'Пожарные, скорая, спасатели',
        },
        {
          id: 'traffic-accident',
          nameEn: 'Traffic Accident',
          nameRu: 'ДТП',
          phone: '1193',
          descEn: 'Road accidents',
          descRu: 'Дорожные происшествия',
        },
      ],
    },
    {
      id: 'documents',
      titleEn: 'Documents & Money',
      titleRu: 'Документы и деньги',
      icon: FileQuestion,
      tone: 'accent-purple',
      contacts: [
        { id: 'immigration-phuket', nameEn: 'Immigration Phuket', nameRu: 'Иммиграция Пхукет', phone: '076-221-905', descEn: 'Visa inquiries', descRu: 'Визовые вопросы' },
        { id: 'immigration-hotline', nameEn: 'Immigration Hotline', nameRu: 'Горячая линия иммиграции', phone: '1178' },
        { id: 'embassy-bkk', nameEn: 'Russian Embassy Bangkok', nameRu: 'Посольство РФ Бангкок', phone: '02-234-9824' },
        { id: 'consulate-phuket', nameEn: 'Russian Consulate Phuket', nameRu: 'Консульство РФ Пхукет', phone: '076-510-392' },
      ],
    },
    {
      id: 'transport',
      titleEn: 'Transport',
      titleRu: 'Транспорт',
      icon: Car,
      tone: 'warning',
      contacts: [
        { id: 'taxi', nameEn: 'Taxi Call Center', nameRu: 'Такси', phone: '1681' },
        { id: 'airport', nameEn: 'Phuket Airport', nameRu: 'Аэропорт Пхукета', phone: '076-351-122' },
      ],
    },
  ],
};

export const EMERGENCY_CONTACTS: Record<string, CityEmergencyData> = {
  phuket: PHUKET,
};

const DEFAULT_CITY_SLUG = 'phuket';

/** Returns emergency data for a city, falling back to Phuket. */
export function getEmergencyContacts(citySlug: string = DEFAULT_CITY_SLUG): CityEmergencyData {
  return EMERGENCY_CONTACTS[citySlug] ?? EMERGENCY_CONTACTS[DEFAULT_CITY_SLUG];
}

/** Strips a phone number down to digits/plus for a safe `tel:` href. */
export function sanitizeTelNumber(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

/** Convenience: flattens all category contacts for a city into one list. */
export function getAllEmergencyContacts(citySlug: string = DEFAULT_CITY_SLUG): EmergencyContact[] {
  return getEmergencyContacts(citySlug).categories.flatMap((category) => category.contacts);
}

/** Convenience: returns a single category by id for a city, if present. */
export function getEmergencyCategory(
  categoryId: string,
  citySlug: string = DEFAULT_CITY_SLUG,
): EmergencyCategory | undefined {
  return getEmergencyContacts(citySlug).categories.find((category) => category.id === categoryId);
}
