/**
 * Centralized channel registry — data-driven approach.
 * Adding a new OTA = adding one object to CHANNEL_REGISTRY array.
 */

export type ChannelCategory = 'major_ota' | 'vacation_rental' | 'asia_pacific' | 'calendar' | 'other';

export interface ChannelRegistryEntry {
  id: string;
  name: string;
  icon: string;
  color: string;          // gradient classes
  bgColor: string;        // card bg
  borderColor: string;    // card border
  textColor: string;      // text accent
  category: ChannelCategory;
  featured?: boolean;     // show in quick-connect top row
  urlPatterns: RegExp[];  // auto-detect channel from iCal URL
  instructions: {
    en: string[];
    ru: string[];
  };
  helpUrl?: string;
}

export const CHANNEL_REGISTRY: ChannelRegistryEntry[] = [
  // ─── Major OTA ───────────────────────────────────
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    color: 'from-destructive to-destructive/80',
    bgColor: 'bg-destructive/5 hover:bg-destructive/10',
    borderColor: 'border-destructive/20',
    textColor: 'text-destructive',
    category: 'major_ota',
    featured: true,
    urlPatterns: [/airbnb\.com/i],
    instructions: {
      en: [
        'Go to your Airbnb listing',
        'Click "Pricing and availability" → "Availability"',
        'Scroll to "Connect calendars"',
        'Click "Export Calendar" and copy the iCal URL',
      ],
      ru: [
        'Откройте ваш листинг на Airbnb',
        'Нажмите "Цены и доступность" → "Доступность"',
        'Прокрутите до "Подключить календари"',
        'Нажмите "Экспорт календаря" и скопируйте iCal URL',
      ],
    },
    helpUrl: 'https://www.airbnb.com/help/article/99',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    icon: '🅱️',
    color: 'from-info to-primary',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'major_ota',
    featured: true,
    urlPatterns: [/booking\.com/i, /admin\.booking\.com/i],
    instructions: {
      en: [
        'Log in to Booking.com Extranet',
        'Go to "Calendar" → "Sync calendars"',
        'Click "Export your calendar"',
        'Copy the iCal link provided',
      ],
      ru: [
        'Войдите в Booking.com Extranet',
        'Перейдите в "Календарь" → "Синхронизация"',
        'Нажмите "Экспортировать календарь"',
        'Скопируйте iCal-ссылку',
      ],
    },
    helpUrl: 'https://partner.booking.com/en-gb/help/connectivity/how-do-i-sync-my-calendar-external-calendars',
  },
  {
    id: 'vrbo',
    name: 'VRBO / HomeAway',
    icon: '🏡',
    color: 'from-accent-cyan to-accent-teal',
    bgColor: 'bg-accent-cyan/5 hover:bg-accent-cyan/10',
    borderColor: 'border-accent-cyan/20',
    textColor: 'text-accent-teal',
    category: 'major_ota',
    featured: true,
    urlPatterns: [/vrbo\.com/i, /homeaway\.com/i],
    instructions: {
      en: [
        'Go to your VRBO dashboard',
        'Select your property → "Calendar"',
        'Click "Import/Export" tab',
        'Copy the "Export calendar" link',
      ],
      ru: [
        'Откройте панель управления VRBO',
        'Выберите объект → "Календарь"',
        'Нажмите "Импорт/Экспорт"',
        'Скопируйте ссылку экспорта',
      ],
    },
    helpUrl: 'https://help.vrbo.com/articles/How-do-I-sync-my-calendar-with-other-sites',
  },
  {
    id: 'expedia',
    name: 'Expedia / Hotels.com',
    icon: '✈️',
    color: 'from-warning to-accent-amber',
    bgColor: 'bg-warning/5 hover:bg-warning/10',
    borderColor: 'border-warning/20',
    textColor: 'text-warning',
    category: 'major_ota',
    featured: true,
    urlPatterns: [/expedia\.com/i, /hotels\.com/i],
    instructions: {
      en: [
        'Log in to Expedia Partner Central',
        'Go to "Calendar" → "Sync"',
        'Export your iCal link',
        'Copy the URL',
      ],
      ru: [
        'Войдите в Expedia Partner Central',
        'Перейдите в "Календарь" → "Синхронизация"',
        'Экспортируйте iCal-ссылку',
        'Скопируйте URL',
      ],
    },
    helpUrl: 'https://apps.expediapartnercentral.com/',
  },
  {
    id: 'agoda',
    name: 'Agoda',
    icon: '🔴',
    color: 'from-destructive to-accent-coral',
    bgColor: 'bg-destructive/5 hover:bg-destructive/10',
    borderColor: 'border-destructive/20',
    textColor: 'text-destructive',
    category: 'major_ota',
    featured: true,
    urlPatterns: [/agoda\.com/i],
    instructions: {
      en: [
        'Log in to Agoda YCS (YieldConnect)',
        'Go to "Rate & Availability"',
        'Find "iCal export" option',
        'Copy the calendar URL',
      ],
      ru: [
        'Войдите в Agoda YCS',
        'Перейдите в "Тарифы и Доступность"',
        'Найдите опцию "iCal экспорт"',
        'Скопируйте URL календаря',
      ],
    },
    helpUrl: 'https://partner.agoda.com/',
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor Rentals',
    icon: '🦉',
    color: 'from-success to-success/80',
    bgColor: 'bg-success/5 hover:bg-success/10',
    borderColor: 'border-success/20',
    textColor: 'text-success',
    category: 'major_ota',
    urlPatterns: [/tripadvisor\.com/i, /flipkey\.com/i, /holidaylettings/i],
    instructions: {
      en: [
        'Go to TripAdvisor Rental dashboard',
        'Select property → "Calendar"',
        'Click "Export Calendar"',
        'Copy the iCal URL',
      ],
      ru: [
        'Откройте панель TripAdvisor Rentals',
        'Выберите объект → "Календарь"',
        'Нажмите "Экспортировать"',
        'Скопируйте iCal URL',
      ],
    },
    helpUrl: 'https://www.tripadvisor.com/Owners',
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    icon: '🛏️',
    color: 'from-accent-coral to-destructive',
    bgColor: 'bg-accent-coral/5 hover:bg-accent-coral/10',
    borderColor: 'border-accent-coral/20',
    textColor: 'text-accent-coral',
    category: 'major_ota',
    urlPatterns: [/hostelworld\.com/i],
    instructions: {
      en: [
        'Log in to Hostelworld Inbox',
        'Go to "Rates & Availability"',
        'Find the iCal export option',
        'Copy the URL',
      ],
      ru: [
        'Войдите в Hostelworld Inbox',
        'Перейдите в "Тарифы и Доступность"',
        'Найдите экспорт iCal',
        'Скопируйте URL',
      ],
    },
  },
  {
    id: 'trip_com',
    name: 'Trip.com',
    icon: '🌏',
    color: 'from-info to-info/80',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'asia_pacific',
    featured: true,
    urlPatterns: [/trip\.com/i, /ctrip\.com/i],
    instructions: {
      en: [
        'Log in to Trip.com Partner Hub',
        'Go to "Room & Rate"',
        'Select "Calendar Sync"',
        'Export and copy iCal URL',
      ],
      ru: [
        'Войдите в Trip.com Partner Hub',
        'Перейдите в "Номера и тарифы"',
        'Выберите "Синхронизация календаря"',
        'Экспортируйте и скопируйте iCal URL',
      ],
    },
  },

  // ─── Vacation Rental Specific ────────────────────
  {
    id: 'marriott_homes',
    name: 'Marriott Homes & Villas',
    icon: '🏨',
    color: 'from-primary to-primary/80',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20',
    textColor: 'text-primary',
    category: 'vacation_rental',
    urlPatterns: [/marriott\.com/i, /homes-and-villas/i],
    instructions: {
      en: [
        'Access your Marriott Homes dashboard',
        'Go to "Calendar" settings',
        'Export iCal link',
        'Copy the URL',
      ],
      ru: [
        'Откройте панель Marriott Homes',
        'Перейдите в настройки календаря',
        'Экспортируйте iCal-ссылку',
        'Скопируйте URL',
      ],
    },
  },
  {
    id: 'holidu',
    name: 'Holidu',
    icon: '🌴',
    color: 'from-accent-teal to-success',
    bgColor: 'bg-accent-teal/5 hover:bg-accent-teal/10',
    borderColor: 'border-accent-teal/20',
    textColor: 'text-accent-teal',
    category: 'vacation_rental',
    urlPatterns: [/holidu\.com/i],
    instructions: {
      en: [
        'Log in to Holidu Host dashboard',
        'Go to "Calendar"',
        'Click "Export iCal"',
        'Copy the link',
      ],
      ru: [
        'Войдите в панель Holidu Host',
        'Перейдите в "Календарь"',
        'Нажмите "Экспорт iCal"',
        'Скопируйте ссылку',
      ],
    },
  },
  {
    id: 'hometogo',
    name: 'HomeToGo',
    icon: '🏘️',
    color: 'from-info to-accent-cyan',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'vacation_rental',
    urlPatterns: [/hometogo\.com/i],
    instructions: {
      en: [
        'Log in to HomeToGo dashboard',
        'Navigate to calendar settings',
        'Export your iCal feed',
        'Copy URL',
      ],
      ru: [
        'Войдите в панель HomeToGo',
        'Перейдите в настройки календаря',
        'Экспортируйте iCal-ленту',
        'Скопируйте URL',
      ],
    },
  },
  {
    id: 'atraveo',
    name: 'Atraveo',
    icon: '🏕️',
    color: 'from-success to-accent-teal',
    bgColor: 'bg-success/5 hover:bg-success/10',
    borderColor: 'border-success/20',
    textColor: 'text-success',
    category: 'vacation_rental',
    urlPatterns: [/atraveo\.com/i],
    instructions: {
      en: ['Log in to Atraveo', 'Go to Calendar', 'Export iCal URL', 'Copy the link'],
      ru: ['Войдите в Atraveo', 'Перейдите в Календарь', 'Экспортируйте iCal URL', 'Скопируйте ссылку'],
    },
  },
  {
    id: 'casamundo',
    name: 'Casamundo',
    icon: '🏠',
    color: 'from-warning to-warning/80',
    bgColor: 'bg-warning/5 hover:bg-warning/10',
    borderColor: 'border-warning/20',
    textColor: 'text-warning',
    category: 'vacation_rental',
    urlPatterns: [/casamundo\.com/i],
    instructions: {
      en: ['Log in to Casamundo', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Casamundo', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'traum_ferienwohnungen',
    name: 'Traum-Ferienwohnungen',
    icon: '🇩🇪',
    color: 'from-accent-amber to-warning',
    bgColor: 'bg-accent-amber/5 hover:bg-accent-amber/10',
    borderColor: 'border-accent-amber/20',
    textColor: 'text-accent-amber',
    category: 'vacation_rental',
    urlPatterns: [/traum-ferienwohnungen/i],
    instructions: {
      en: ['Log in to Traum-Ferienwohnungen', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Traum-Ferienwohnungen', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'fewo_direkt',
    name: 'FeWo-direkt',
    icon: '🇩🇪',
    color: 'from-accent-cyan to-info',
    bgColor: 'bg-accent-cyan/5 hover:bg-accent-cyan/10',
    borderColor: 'border-accent-cyan/20',
    textColor: 'text-accent-cyan',
    category: 'vacation_rental',
    urlPatterns: [/fewo-direkt/i],
    instructions: {
      en: ['Log in to FeWo-direkt', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в FeWo-direkt', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'abritel',
    name: 'Abritel',
    icon: '🇫🇷',
    color: 'from-primary to-info',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20',
    textColor: 'text-primary',
    category: 'vacation_rental',
    urlPatterns: [/abritel\.fr/i],
    instructions: {
      en: ['Log in to Abritel', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Abritel', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },

  // ─── Asia / Pacific ──────────────────────────────
  {
    id: 'traveloka',
    name: 'Traveloka',
    icon: '🌺',
    color: 'from-info to-primary',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'asia_pacific',
    urlPatterns: [/traveloka\.com/i],
    instructions: {
      en: ['Log in to Traveloka Extranet', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Traveloka Extranet', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },

  // ─── Calendar ────────────────────────────────────
  {
    id: 'google',
    name: 'Google Calendar',
    icon: '📅',
    color: 'from-success to-success/80',
    bgColor: 'bg-success/5 hover:bg-success/10',
    borderColor: 'border-success/20',
    textColor: 'text-success',
    category: 'calendar',
    featured: true,
    urlPatterns: [/google\.com\/calendar/i, /calendar\.google\.com/i],
    instructions: {
      en: [
        'Open Google Calendar settings',
        'Select the calendar to share',
        'Under "Integrate calendar", copy "Public address in iCal format"',
        'Or use "Secret address" for private calendars',
      ],
      ru: [
        'Откройте настройки Google Календаря',
        'Выберите календарь',
        'В "Интеграция" скопируйте "Публичный адрес в формате iCal"',
        'Или используйте "Секретный адрес"',
      ],
    },
    helpUrl: 'https://support.google.com/calendar/answer/37648',
  },

  // ─── Other ───────────────────────────────────────
  {
    id: 'wimdu',
    name: 'Wimdu',
    icon: '🌐',
    color: 'from-muted-foreground to-muted-foreground/80',
    bgColor: 'bg-muted hover:bg-muted/80',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    category: 'other',
    urlPatterns: [/wimdu\.com/i],
    instructions: {
      en: ['Log in to Wimdu', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Wimdu', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: '9flats',
    name: '9flats',
    icon: '9️⃣',
    color: 'from-accent-coral to-destructive',
    bgColor: 'bg-accent-coral/5 hover:bg-accent-coral/10',
    borderColor: 'border-accent-coral/20',
    textColor: 'text-accent-coral',
    category: 'other',
    urlPatterns: [/9flats\.com/i],
    instructions: {
      en: ['Log in to 9flats', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в 9flats', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'homestay',
    name: 'Homestay.com',
    icon: '🛋️',
    color: 'from-accent-teal to-success',
    bgColor: 'bg-accent-teal/5 hover:bg-accent-teal/10',
    borderColor: 'border-accent-teal/20',
    textColor: 'text-accent-teal',
    category: 'other',
    urlPatterns: [/homestay\.com/i],
    instructions: {
      en: ['Log in to Homestay.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Homestay.com', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'furnished_finder',
    name: 'Furnished Finder',
    icon: '🪑',
    color: 'from-primary to-primary/80',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20',
    textColor: 'text-primary',
    category: 'other',
    urlPatterns: [/furnishedfinder\.com/i],
    instructions: {
      en: ['Log in to Furnished Finder', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Furnished Finder', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'spotahome',
    name: 'Spotahome',
    icon: '🔍',
    color: 'from-accent-amber to-warning',
    bgColor: 'bg-accent-amber/5 hover:bg-accent-amber/10',
    borderColor: 'border-accent-amber/20',
    textColor: 'text-accent-amber',
    category: 'other',
    urlPatterns: [/spotahome\.com/i],
    instructions: {
      en: ['Log in to Spotahome', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в Spotahome', 'Перейдите в Календарь', 'Экспорт iCal', 'Скопируйте URL'],
    },
  },
  {
    id: 'turno',
    name: 'Turno (TurnoverBnB)',
    icon: '🧹',
    color: 'from-accent-cyan to-accent-teal',
    bgColor: 'bg-accent-cyan/5 hover:bg-accent-cyan/10',
    borderColor: 'border-accent-cyan/20',
    textColor: 'text-accent-cyan',
    category: 'other',
    urlPatterns: [/turno\.com/i, /turnoverbnb\.com/i],
    instructions: {
      en: ['Log in to Turno', 'Go to "Properties"', 'Export iCal URL for cleanings', 'Copy URL'],
      ru: ['Войдите в Turno', 'Перейдите в "Объекты"', 'Экспортируйте iCal URL для уборок', 'Скопируйте URL'],
    },
  },
  {
    id: 'manual',
    name: 'Manual',
    icon: '✏️',
    color: 'from-muted-foreground to-muted-foreground/80',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    textColor: 'text-muted-foreground',
    category: 'other',
    urlPatterns: [],
    instructions: { en: [], ru: [] },
  },
  {
    id: 'custom',
    name: 'Custom iCal',
    icon: '🔗',
    color: 'from-primary to-accent-cyan',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20 border-dashed',
    textColor: 'text-primary',
    category: 'other',
    urlPatterns: [],
    instructions: {
      en: [
        'Get the iCal export URL from your platform',
        'It usually ends with .ics or contains "ical"',
        'Paste the full URL below',
      ],
      ru: [
        'Получите iCal URL из вашей платформы',
        'Обычно он заканчивается на .ics или содержит "ical"',
        'Вставьте полный URL ниже',
      ],
    },
  },
];

/** Category labels */
export const CATEGORY_LABELS: Record<ChannelCategory, { en: string; ru: string }> = {
  major_ota: { en: 'Major OTA', ru: 'Крупные OTA' },
  vacation_rental: { en: 'Vacation Rentals', ru: 'Vacation Rentals' },
  asia_pacific: { en: 'Asia & Pacific', ru: 'Азия и Тихий океан' },
  calendar: { en: 'Calendars', ru: 'Календари' },
  other: { en: 'Other', ru: 'Другие' },
};

/** Get featured channels for quick-connect */
export function getFeaturedChannels() {
  return CHANNEL_REGISTRY.filter(c => c.featured);
}

/** Get channels grouped by category (excluding manual) */
export function getChannelsByCategory() {
  const categories: ChannelCategory[] = ['major_ota', 'vacation_rental', 'asia_pacific', 'calendar', 'other'];
  return categories
    .map(cat => ({
      category: cat,
      channels: CHANNEL_REGISTRY.filter(c => c.category === cat && c.id !== 'manual'),
    }))
    .filter(g => g.channels.length > 0);
}

/** Auto-detect channel from iCal URL */
export function detectChannelFromUrl(url: string): ChannelRegistryEntry | null {
  for (const entry of CHANNEL_REGISTRY) {
    if (entry.urlPatterns.some(p => p.test(url))) {
      return entry;
    }
  }
  return null;
}

/** Find channel entry by id */
export function getRegistryEntry(id: string): ChannelRegistryEntry | undefined {
  return CHANNEL_REGISTRY.find(c => c.id === id);
}
