/**
 * @module content/landings/personaLandings
 * @description M6 · Track B.2 — конфиг 25 persona-лендингов.
 *
 * Источник правды: `docs/canonical/01-segmentation-framework.md` §4 (P1..P25).
 *
 * Структура шага B.2:
 *  - Все 25 персон присутствуют в системе типов как `draft`.
 *  - Контент для 3 live-персон (P1 tourists, P9 hnw, P13 pet-owners) придёт
 *    отдельным шагом B.7 (контент + tone-of-voice §14 пасс).
 *  - Все 22 остальные персоны остаются `draft` и роут `/for/:slug` отдаёт
 *    404 для них (логика в `isLivePersonaLanding()` + B.4).
 *  - Slug'и стабильные: меняются только вместе с миграцией редиректов.
 *
 * Slug-конвенция: kebab-case, английский, человеко-читаемый. RU-вариант
 * не используется в URL — только в `h1.ru` / `seo.metaTitle.ru`.
 */

import type { PersonaLanding } from '@/lib/landings/types';

/**
 * Минимальный draft-плейсхолдер. По §4 канона — обязательны только
 * `personaCode`, `slug`, `status`. Остальные поля заполняем нейтральным
 * плейсхолдером, чтобы:
 *   1. Тип `PersonaLanding` оставался strict (без `?` на pains/services/faq).
 *   2. Случайный рендер draft-страницы (если кто-то снимет 404) не упал
 *      с runtime ошибкой — увидит «В разработке».
 *
 * Плейсхолдер **не должен** проходить `isLivePersonaLanding()` — у него
 * нет SEO-блока и пустые массивы pains/services/faq, что и требуется.
 */
function draftPersona(
  personaCode: PersonaLanding['personaCode'],
  slug: string,
  hint: { ru: string; en: string },
): PersonaLanding {
  return {
    personaCode,
    slug,
    status: 'draft',
    h1: hint,
    subtitle: {
      ru: 'Страница в разработке.',
      en: 'Page under development.',
    },
    pains: [],
    services: [],
    faq: [],
    primaryCta: {
      label: { ru: 'На главную', en: 'Go home' },
      href: '/',
    },
    // seo: undefined — целенаправленно. live-страница без seo не рендерится.
  };
}

/**
 * Канонический список 25 персон (P1..P25) из §4 segmentation-framework.
 *
 * Порядок — по канону. Slug'и ↔ короткое английское название персоны:
 *  - P1  tourists       — 🇷🇺 Русскоязычный турист
 *  - P2  cn-investors   — 🇨🇳 Китайский турист-инвестор
 *  - P3  eu-guests      — 🇩🇪 Европейский гость
 *  - P4  digital-nomads — 💻 Digital Nomad
 *  - P5  snowbirds      — ❄️ Snowbird
 *  - P6  ru-expats      — 🏡 Новый русскоязычный экспат
 *  - P7  families       — 👨‍👩‍👧 Семья с детьми
 *  - P8  passive-investors — 📊 Пассивный инвестор
 *  - P9  hnw            — 🏦 HNW-инвестор
 *  - P10 operators      — 🏨 STR/PM оператор
 *  - P11 mn-investors   — 🇲🇳 Монгольский инвестор
 *  - P12 bn-business    — 🇧🇩 Бангладешская бизнес-аудитория
 *  - P13 pet-owners     — 🐾 Путешественник с питомцем
 *  - P14 medical        — 🏥 Медицинский турист
 *  - P15 weddings       — 💒 Свадебный путешественник
 *  - P16 athletes       — 🏋️ Спортсмен / Fight camp
 *  - P17 halal          — ☪️ Мусульманский путешественник
 *  - P18 lgbtq          — 🌈 ЛГБТК+ путешественник/резидент
 *  - P19 accessibility  — ♿ С ограниченными возможностями
 *  - P20 retirees       — 🎓 Retiree (пенсионер)
 *  - P21 providers      — 🔧 Local Provider (подрядчик)
 *  - P22 freelancers    — 🎯 Local Freelancer
 *  - P23 smb            — 🏪 Local SMB
 *  - P24 creatives      — 🎨 Creative Class
 *  - P25 students       — 👨‍🎓 Student / Young Adult
 *
 * Все 25 — `draft` на этапе B.2. Контент 3 live (P1/P9/P13) — шаг B.7.
 */
export const PERSONA_LANDINGS: readonly PersonaLanding[] = [
  draftPersona('P1', 'tourists', {
    ru: 'Туристы из России',
    en: 'Russian-speaking tourists',
  }),
  draftPersona('P2', 'cn-investors', {
    ru: 'Гости из Китая',
    en: 'Chinese tourists & scouts',
  }),
  draftPersona('P3', 'eu-guests', {
    ru: 'Гости из Европы',
    en: 'European guests',
  }),
  draftPersona('P4', 'digital-nomads', {
    ru: 'Цифровые кочевники',
    en: 'Digital nomads',
  }),
  draftPersona('P5', 'snowbirds', {
    ru: 'Зимовщики',
    en: 'Snowbirds',
  }),
  draftPersona('P6', 'ru-expats', {
    ru: 'Русскоязычные экспаты',
    en: 'New Russian-speaking expats',
  }),
  draftPersona('P7', 'families', {
    ru: 'Семьи с детьми',
    en: 'Families with children',
  }),
  draftPersona('P8', 'passive-investors', {
    ru: 'Пассивные инвесторы',
    en: 'Passive investors',
  }),
  draftPersona('P9', 'hnw', {
    ru: 'HNW-инвесторы',
    en: 'HNW investors',
  }),
  draftPersona('P10', 'operators', {
    ru: 'Операторы STR / PM',
    en: 'STR & PM operators',
  }),
  draftPersona('P11', 'mn-investors', {
    ru: 'Инвесторы из Монголии',
    en: 'Mongolian investors',
  }),
  draftPersona('P12', 'bn-business', {
    ru: 'Бизнес-аудитория из Бангладеш',
    en: 'Bangladeshi business audience',
  }),
  draftPersona('P13', 'pet-owners', {
    ru: 'Путешественники с питомцами',
    en: 'Pet owners',
  }),
  draftPersona('P14', 'medical', {
    ru: 'Медицинский туризм',
    en: 'Medical tourists',
  }),
  draftPersona('P15', 'weddings', {
    ru: 'Свадебные путешественники',
    en: 'Wedding travellers',
  }),
  draftPersona('P16', 'athletes', {
    ru: 'Спортсмены и Fight Camp',
    en: 'Athletes & fight camps',
  }),
  draftPersona('P17', 'halal', {
    ru: 'Мусульманские путешественники',
    en: 'Muslim travellers',
  }),
  draftPersona('P18', 'lgbtq', {
    ru: 'ЛГБТК+ путешественники и резиденты',
    en: 'LGBTQ+ travellers & residents',
  }),
  draftPersona('P19', 'accessibility', {
    ru: 'Путешественники с ограниченными возможностями',
    en: 'Accessibility-first travellers',
  }),
  draftPersona('P20', 'retirees', {
    ru: 'Пенсионеры',
    en: 'Retirees',
  }),
  draftPersona('P21', 'providers', {
    ru: 'Локальные подрядчики',
    en: 'Local providers',
  }),
  draftPersona('P22', 'freelancers', {
    ru: 'Локальные фрилансеры',
    en: 'Local freelancers',
  }),
  draftPersona('P23', 'smb', {
    ru: 'Локальный малый бизнес',
    en: 'Local SMB',
  }),
  draftPersona('P24', 'creatives', {
    ru: 'Creative Class',
    en: 'Creative class',
  }),
  draftPersona('P25', 'students', {
    ru: 'Студенты и молодые взрослые',
    en: 'Students & young adults',
  }),
] as const;

/**
 * Slug'и live-персон, для которых шаг B.7 заполнит реальный контент.
 * Используется в `__tests__/personaLandings.test.ts` как «контракт ожиданий».
 */
export const LIVE_PERSONA_SLUGS: readonly string[] = [
  'tourists', // P1
  'hnw',      // P9
  'pet-owners', // P13
] as const;
