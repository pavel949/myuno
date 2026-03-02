/**
 * Centralized channel registry — data-driven approach.
 * Adding a new OTA = adding one object to CHANNEL_REGISTRY array.
 */

export type ChannelCategory = 'major_ota' | 'vacation_rental' | 'russia_cis' | 'asia_pacific' | 'calendar' | 'other';

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
        'Log in to airbnb.com and open your listing',
        'Go to "Calendar" tab at the top',
        'Click the gear icon ⚙️ → "Availability settings"',
        'Scroll down to "Connect calendars" section',
        'Click "Export Calendar" — a link starting with https://www.airbnb.com/calendar/ical/... will appear',
        'Copy this link and paste it below',
      ],
      ru: [
        'Войдите на airbnb.com и откройте ваше объявление',
        'Перейдите на вкладку "Календарь" вверху',
        'Нажмите значок ⚙️ → "Настройки доступности"',
        'Прокрутите до раздела "Подключить календари"',
        'Нажмите "Экспорт календаря" — появится ссылка вида https://www.airbnb.com/calendar/ical/...',
        'Скопируйте эту ссылку и вставьте ниже',
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
        'Log in to admin.booking.com (Extranet)',
        'Go to "Rates & Availability" → "Calendar" in the left menu',
        'Click "Sync calendars" (top right of calendar)',
        'Under "Export calendar" copy the iCal link',
        'The link looks like: https://admin.booking.com/hotel/hoteladmin/ical.html?t=...',
        'Paste this link below',
      ],
      ru: [
        'Войдите в admin.booking.com (Экстранет)',
        'В левом меню: "Тарифы и наличие мест" → "Календарь"',
        'Нажмите "Синхронизация календарей" (справа вверху)',
        'В разделе "Экспортировать календарь" скопируйте iCal-ссылку',
        'Ссылка выглядит как: https://admin.booking.com/hotel/hoteladmin/ical.html?t=...',
        'Вставьте эту ссылку ниже',
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
        'Log in to vrbo.com and go to your property dashboard',
        'Click "Calendar" in the left menu',
        'Click "Import/Export" tab above the calendar',
        'Under "Export this calendar" click "Copy Link"',
        'The link looks like: https://www.vrbo.com/icalendar/...',
        'Paste this link below',
      ],
      ru: [
        'Войдите на vrbo.com в панель управления объектом',
        'Нажмите "Календарь" в левом меню',
        'Перейдите на вкладку "Импорт/Экспорт" над календарём',
        'В разделе "Экспорт календаря" нажмите "Копировать ссылку"',
        'Ссылка выглядит как: https://www.vrbo.com/icalendar/...',
        'Вставьте эту ссылку ниже',
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
    urlPatterns: [/expedia\.com/i, /hotels\.com/i],
    instructions: {
      en: [
        'Log in to apps.expediapartnercentral.com (Partner Central)',
        'Navigate to "Rooms & Rates" → "Calendar"',
        'Click "Sync calendars" or "Export calendar"',
        'Copy the provided iCal URL',
        'Note: Not all Expedia property types support iCal export',
      ],
      ru: [
        'Войдите в apps.expediapartnercentral.com (Partner Central)',
        'Перейдите в "Номера и тарифы" → "Календарь"',
        'Нажмите "Синхронизация" или "Экспорт календаря"',
        'Скопируйте iCal-ссылку',
        'Примечание: не все типы объектов Expedia поддерживают iCal',
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
        'Log in to ycs.agoda.com (YCS — Yield Control System)',
        'Go to "Rate & Availability" in the left menu',
        'Click "Calendar Sync" or "iCal" tab',
        'Click "Export Calendar" and copy the URL',
        'If you don\'t see this option, contact your Agoda account manager',
      ],
      ru: [
        'Войдите в ycs.agoda.com (YCS — Yield Control System)',
        'Перейдите в "Тарифы и доступность" в левом меню',
        'Нажмите "Calendar Sync" или вкладку "iCal"',
        'Нажмите "Export Calendar" и скопируйте URL',
        'Если опции нет, обратитесь к вашему менеджеру Agoda',
      ],
    },
    helpUrl: 'https://ycs.agoda.com/',
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
        'Log in to rentals.tripadvisor.com (Owner Dashboard)',
        'Select your property and go to "Calendar"',
        'Click "Sync Calendars" → "Export Calendar"',
        'Copy the iCal URL provided',
      ],
      ru: [
        'Войдите в rentals.tripadvisor.com (Панель владельца)',
        'Выберите объект и перейдите в "Календарь"',
        'Нажмите "Синхронизация" → "Экспорт календаря"',
        'Скопируйте предоставленную iCal-ссылку',
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
        'Log in to inbox.hostelworld.com',
        'Go to "Property" → "Rates & Availability"',
        'Click "Calendar sync" or "iCal export"',
        'Copy the generated URL',
      ],
      ru: [
        'Войдите в inbox.hostelworld.com',
        'Перейдите в "Property" → "Rates & Availability"',
        'Нажмите "Calendar sync" или "iCal export"',
        'Скопируйте сгенерированный URL',
      ],
    },
  },

  // ─── Russia & CIS ────────────────────────────────
  {
    id: 'ostrovok',
    name: 'Островок (Ostrovok)',
    icon: '🟢',
    color: 'from-success to-accent-teal',
    bgColor: 'bg-success/5 hover:bg-success/10',
    borderColor: 'border-success/20',
    textColor: 'text-success',
    category: 'russia_cis',
    featured: true,
    urlPatterns: [/ostrovok\.ru/i, /extranet\.ostrovok/i],
    instructions: {
      en: [
        'Log in to extranet.ostrovok.ru',
        'Go to "Rooms & Rates" → "Calendar"',
        'Click "Sync with external calendar"',
        'Copy the iCal export URL',
        'Paste it below',
      ],
      ru: [
        'Войдите в extranet.ostrovok.ru (Экстранет Островка)',
        'Перейдите в "Номера и тарифы" → "Календарь"',
        'Нажмите "Синхронизация с внешним календарём"',
        'Скопируйте ссылку iCal-экспорта',
        'Вставьте её ниже',
      ],
    },
    helpUrl: 'https://help.ostrovok.ru/',
  },
  {
    id: 'sutochno',
    name: 'Суточно.ру',
    icon: '🏘️',
    color: 'from-info to-primary',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'russia_cis',
    featured: true,
    urlPatterns: [/sutochno\.ru/i],
    instructions: {
      en: [
        'Log in to sutochno.ru owner dashboard',
        'Open your property → "Calendar"',
        'Click "Export calendar" (iCal)',
        'Copy the link and paste below',
      ],
      ru: [
        'Войдите в личный кабинет на sutochno.ru',
        'Откройте ваш объект → "Календарь бронирований"',
        'Нажмите "Экспорт календаря" (формат iCal)',
        'Скопируйте ссылку и вставьте ниже',
        'Ссылка выглядит как: https://sutochno.ru/ical/...',
      ],
    },
    helpUrl: 'https://sutochno.ru/help',
  },
  {
    id: 'tvil',
    name: 'Tvil.ru',
    icon: '🌊',
    color: 'from-accent-cyan to-info',
    bgColor: 'bg-accent-cyan/5 hover:bg-accent-cyan/10',
    borderColor: 'border-accent-cyan/20',
    textColor: 'text-accent-cyan',
    category: 'russia_cis',
    urlPatterns: [/tvil\.ru/i],
    instructions: {
      en: [
        'Log in to tvil.ru owner account',
        'Open your listing → "Calendar"',
        'Find "Export to iCal" option',
        'Copy the URL and paste below',
      ],
      ru: [
        'Войдите в личный кабинет на tvil.ru',
        'Откройте ваше объявление → "Календарь"',
        'Найдите опцию "Экспорт в iCal"',
        'Скопируйте URL и вставьте ниже',
      ],
    },
  },
  {
    id: 'bronevik',
    name: 'Броневик (Bronevik)',
    icon: '🛡️',
    color: 'from-primary to-primary/80',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20',
    textColor: 'text-primary',
    category: 'russia_cis',
    urlPatterns: [/bronevik\.com/i],
    instructions: {
      en: [
        'Log in to bronevik.com partner portal',
        'Go to "Rates & Availability"',
        'Find "Calendar sync / iCal export"',
        'Copy the URL',
      ],
      ru: [
        'Войдите в партнёрский портал bronevik.com',
        'Перейдите в "Тарифы и доступность"',
        'Найдите "Синхронизация календаря / iCal экспорт"',
        'Скопируйте URL',
      ],
    },
  },
  {
    id: '101hotels',
    name: '101Hotels.com',
    icon: '🏨',
    color: 'from-accent-amber to-warning',
    bgColor: 'bg-accent-amber/5 hover:bg-accent-amber/10',
    borderColor: 'border-accent-amber/20',
    textColor: 'text-accent-amber',
    category: 'russia_cis',
    urlPatterns: [/101hotels\.com/i],
    instructions: {
      en: [
        'Log in to partner.101hotels.com',
        'Go to "Calendar"',
        'Click "Export iCal"',
        'Copy URL and paste below',
      ],
      ru: [
        'Войдите в partner.101hotels.com',
        'Перейдите в "Календарь"',
        'Нажмите "Экспорт iCal"',
        'Скопируйте URL и вставьте ниже',
      ],
    },
  },
  {
    id: 'domclick',
    name: 'ДомКлик (Сбер)',
    icon: '🟩',
    color: 'from-success to-success/80',
    bgColor: 'bg-success/5 hover:bg-success/10',
    borderColor: 'border-success/20',
    textColor: 'text-success',
    category: 'russia_cis',
    urlPatterns: [/domclick\.ru/i],
    instructions: {
      en: [
        'Log in to domclick.ru (Sber)',
        'Go to your rental listing',
        'Find calendar sync or iCal export',
        'Copy URL',
      ],
      ru: [
        'Войдите в личный кабинет на domclick.ru',
        'Откройте ваш объект аренды',
        'Найдите синхронизацию календаря или iCal-экспорт',
        'Скопируйте URL',
      ],
    },
  },
  {
    id: 'avito',
    name: 'Авито Недвижимость',
    icon: '🔵',
    color: 'from-info to-info/80',
    bgColor: 'bg-info/5 hover:bg-info/10',
    borderColor: 'border-info/20',
    textColor: 'text-info',
    category: 'russia_cis',
    urlPatterns: [/avito\.ru/i],
    instructions: {
      en: [
        'Log in to avito.ru → My Listings',
        'Open your rental listing',
        'Go to "Booking calendar" section',
        'If iCal export is available, copy the link',
        'Note: iCal support may be limited on Avito',
      ],
      ru: [
        'Войдите на avito.ru → Мои объявления',
        'Откройте объявление об аренде',
        'Перейдите в раздел "Календарь бронирований"',
        'Если доступен iCal-экспорт, скопируйте ссылку',
        'Примечание: поддержка iCal на Авито может быть ограничена',
      ],
    },
  },
  {
    id: 'cian',
    name: 'ЦИАН',
    icon: '🔷',
    color: 'from-primary to-info',
    bgColor: 'bg-primary/5 hover:bg-primary/10',
    borderColor: 'border-primary/20',
    textColor: 'text-primary',
    category: 'russia_cis',
    urlPatterns: [/cian\.ru/i],
    instructions: {
      en: [
        'Log in to cian.ru → My Listings',
        'Open your rental listing',
        'Go to calendar settings',
        'If iCal export is available, copy the link',
        'Note: CIAN has limited iCal support for short-term rentals',
      ],
      ru: [
        'Войдите на cian.ru → Мои объявления',
        'Откройте объявление о посуточной аренде',
        'Перейдите в настройки календаря',
        'Если iCal-экспорт доступен, скопируйте ссылку',
        'Примечание: ЦИАН имеет ограниченную поддержку iCal для краткосрочной аренды',
      ],
    },
  },

  // ─── Asia / Pacific ──────────────────────────────
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
        'Log in to ebooking.trip.com (Partner Hub)',
        'Go to "Room & Rate" → "Calendar"',
        'Click "Sync calendars" tab',
        'Copy the export iCal URL',
      ],
      ru: [
        'Войдите в ebooking.trip.com (Partner Hub)',
        'Перейдите в "Номера и тарифы" → "Календарь"',
        'Нажмите вкладку "Синхронизация календарей"',
        'Скопируйте iCal URL экспорта',
      ],
    },
  },
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
      en: [
        'Log in to extranet.traveloka.com',
        'Go to "Room" → "Calendar" section',
        'Click "Sync Calendar" or "Export iCal"',
        'Copy the generated URL',
      ],
      ru: [
        'Войдите в extranet.traveloka.com',
        'Перейдите в "Номера" → "Календарь"',
        'Нажмите "Sync Calendar" или "Export iCal"',
        'Скопируйте сгенерированный URL',
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
        'Log in to your Marriott Homes & Villas host portal',
        'Go to "Calendar" → "Availability"',
        'Find "Export calendar" or "iCal sync"',
        'Copy the iCal URL and paste below',
      ],
      ru: [
        'Войдите в портал хоста Marriott Homes & Villas',
        'Перейдите в "Календарь" → "Доступность"',
        'Найдите "Экспорт календаря" или "iCal sync"',
        'Скопируйте iCal URL и вставьте ниже',
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
        'Log in to host.holidu.com',
        'Select your property → "Calendar"',
        'Click "Sync" → "Export iCal"',
        'Copy the link and paste below',
      ],
      ru: [
        'Войдите в host.holidu.com',
        'Выберите объект → "Календарь"',
        'Нажмите "Sync" → "Export iCal"',
        'Скопируйте ссылку и вставьте ниже',
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
        'Log in to hometogo.com host portal',
        'Go to property settings → "Calendar"',
        'Find "Export iCal feed"',
        'Copy the URL',
      ],
      ru: [
        'Войдите в портал хоста на hometogo.com',
        'Настройки объекта → "Календарь"',
        'Найдите "Export iCal feed"',
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
      en: ['Log in to atraveo.com partner portal', 'Go to Calendar settings', 'Export iCal URL', 'Copy and paste below'],
      ru: ['Войдите в партнёрский портал atraveo.com', 'Перейдите в настройки Календаря', 'Экспортируйте iCal URL', 'Скопируйте и вставьте ниже'],
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
      en: ['Log in to casamundo.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в casamundo.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to traum-ferienwohnungen.de', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в traum-ferienwohnungen.de', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to fewo-direkt.de', 'Go to Calendar → Import/Export', 'Export iCal link', 'Copy URL'],
      ru: ['Войдите в fewo-direkt.de', 'Перейдите в Календарь → Импорт/Экспорт', 'Экспортируйте iCal-ссылку', 'Скопируйте URL'],
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
      en: ['Log in to abritel.fr', 'Go to Calendar → Import/Export', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в abritel.fr', 'Перейдите в Календарь → Импорт/Экспорт', 'Экспортируйте iCal', 'Скопируйте URL'],
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
        'Open calendar.google.com → Settings (gear icon)',
        'Click on the calendar you want to export in the left panel',
        'Scroll to "Integrate calendar" section',
        'Copy "Secret address in iCal format" (for private calendars)',
        'Or "Public address in iCal format" (for public calendars)',
      ],
      ru: [
        'Откройте calendar.google.com → Настройки (значок шестерёнки)',
        'Нажмите на нужный календарь в левой панели',
        'Прокрутите до раздела "Интеграция календаря"',
        'Скопируйте "Секретный адрес в формате iCal" (для приватных)',
        'Или "Публичный адрес в формате iCal" (для публичных)',
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
      en: ['Log in to wimdu.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в wimdu.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to 9flats.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в 9flats.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to homestay.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в homestay.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to furnishedfinder.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в furnishedfinder.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: ['Log in to spotahome.com', 'Go to Calendar', 'Export iCal', 'Copy URL'],
      ru: ['Войдите в spotahome.com', 'Перейдите в Календарь', 'Экспортируйте iCal', 'Скопируйте URL'],
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
      en: [
        'Log in to turno.com (formerly TurnoverBnB)',
        'Go to "Properties" → select your property',
        'Click "Calendars" → "Export iCal"',
        'Copy URL — this exports cleaning schedule, not bookings',
      ],
      ru: [
        'Войдите в turno.com (ранее TurnoverBnB)',
        'Перейдите в "Объекты" → выберите объект',
        'Нажмите "Календари" → "Экспорт iCal"',
        'Скопируйте URL — экспортирует график уборок, не бронирования',
      ],
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
        'It usually ends with .ics or contains "ical" in the URL',
        'Make sure it\'s a direct link (starts with https://)',
        'Paste the full URL below',
      ],
      ru: [
        'Получите iCal URL экспорта из вашей платформы',
        'Обычно ссылка заканчивается на .ics или содержит "ical"',
        'Убедитесь что это прямая ссылка (начинается с https://)',
        'Вставьте полный URL ниже',
      ],
    },
  },
];

/** Category labels */
export const CATEGORY_LABELS: Record<ChannelCategory, { en: string; ru: string }> = {
  major_ota: { en: 'Major OTA', ru: 'Крупные OTA' },
  russia_cis: { en: 'Russia & CIS', ru: 'Россия и СНГ' },
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
  const categories: ChannelCategory[] = ['major_ota', 'russia_cis', 'vacation_rental', 'asia_pacific', 'calendar', 'other'];
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
