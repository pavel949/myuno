/**
 * @module content/landings/clusterLandings
 * @description M6 · Track B.3 — конфиг 10 cluster-лендингов (A..J).
 *
 * Источник правды: `docs/canonical/01-segmentation-framework.md` §5
 * (10 жизненных кластеров) + §6 (матрица «Персона × Кластер»).
 *
 * Структура шага B.3:
 *  - Все 10 кластеров присутствуют в системе типов как `draft`.
 *  - Контент для 3 live-кластеров (A Arrival, D Investment, F Operations)
 *    придёт отдельным шагом B.8 (контент + tone-of-voice §14 пасс).
 *  - Все 7 остальных остаются `draft` — `/cluster/:slug` вернёт 404 (B.5).
 *  - `relatedPersonas` заполняется по матрице §6 — это входит в структуру
 *    (никакого копирайта), поэтому делаем сразу. Используется в cross-link
 *    блоке «Лендинги по персонам ↗» (компонент B.6).
 *
 * Slug-конвенция: kebab-case английский, человеко-читаемый, выровнен по §5
 * («Arrival & Orientation» → `arrival`, «Ownership & Operations» → `operations`).
 */

import type { ClusterLanding, LandingClusterCode } from '@/lib/landings/types';
import type { PersonaCode } from '@/types/canonical';

/**
 * Минимальный draft-плейсхолдер. Аналогично `draftPersona()` в B.2:
 *  - непустые h1 / subtitle / primaryCta — страница не упадёт при рендере;
 *  - пустые jobs / services / faq + отсутствующий seo → НЕ проходит
 *    `isLiveClusterLanding()`, поэтому `/cluster/:slug` отдаст 404.
 */
function draftCluster(
  clusterCode: LandingClusterCode,
  slug: string,
  hint: { ru: string; en: string },
  relatedPersonas: PersonaCode[],
): ClusterLanding {
  return {
    clusterCode,
    slug,
    status: 'draft',
    h1: hint,
    subtitle: {
      ru: 'Страница в разработке.',
      en: 'Page under development.',
    },
    jobs: [],
    services: [],
    faq: [],
    primaryCta: {
      label: { ru: 'На главную', en: 'Go home' },
      href: '/',
    },
    relatedPersonas,
    // seo: undefined — намеренно. live без seo не проходит guard.
  };
}

/**
 * Канонический список 10 жизненных кластеров (A..J) из §5 segmentation-framework.
 *
 * Маппинг кода → slug → название (RU / EN):
 *  - A `arrival`     — Прибытие и ориентация / Arrival & Orientation
 *  - B `extension`   — Продление и переход / Extension & Transition
 *  - C `settlement`  — Обустройство / Settlement
 *  - D `investment`  — Раздумья о покупке / Investment Consideration
 *  - E `transaction` — Сделка / Transaction
 *  - F `operations`  — Владение и управление / Ownership & Operations
 *  - G `compliance`  — Соответствие и налоги / Compliance & Legal
 *  - H `emergency`   — Экстренные ситуации / Emergency
 *  - I `lifestyle`   — Стиль жизни / Lifestyle
 *  - J `exit`        — Выход и возврат / Exit & Re-entry
 *
 * `relatedPersonas` — выборки из матрицы §6: персоны, для которых кластер
 * имеет приоритет ●● (core) или ● (relevant). Используется в cross-link
 * блоке. На стадии B.3 берём только наиболее очевидные — расширим в B.8.
 */
export const CLUSTER_LANDINGS: readonly ClusterLanding[] = [
  draftCluster(
    'A',
    'arrival',
    { ru: 'Прибытие и ориентация на Пхукете', en: 'Arrival & orientation on Phuket' },
    // §5: scout, tourist, snowbird (1-й сезон), nomad, settler.
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P11', 'P14', 'P15', 'P16', 'P25'],
  ),
  draftCluster(
    'B',
    'extension',
    { ru: 'Продление визы и переход к долгому пребыванию', en: 'Extending your stay & transitioning' },
    // Scout → Snowbird/Nomad, Tourist → Settler.
    ['P3', 'P4', 'P5', 'P6', 'P7', 'P25'],
  ),
  draftCluster(
    'C',
    'settlement',
    { ru: 'Обустройство жизни на Пхукете', en: 'Settling in on Phuket' },
    // Settler, resident, возвратный snowbird.
    ['P5', 'P6', 'P7', 'P10', 'P13', 'P20'],
  ),
  draftCluster(
    'D',
    'investment',
    { ru: 'Изучение рынка недвижимости Пхукета', en: 'Considering Phuket real estate' },
    // Snowbird, settler, resident, investor-passive (новый).
    ['P2', 'P5', 'P6', 'P8', 'P9', 'P11', 'P12'],
  ),
  draftCluster(
    'E',
    'transaction',
    { ru: 'Покупка и продажа недвижимости', en: 'Buying & selling property' },
    // Investor-passive, investor-active, resident-user.
    ['P2', 'P8', 'P9', 'P11', 'P12'],
  ),
  draftCluster(
    'F',
    'operations',
    { ru: 'Управление недвижимостью на Пхукете', en: 'Managing your Phuket property' },
    // Absentee, investor-active, operator.
    ['P8', 'P9', 'P10'],
  ),
  draftCluster(
    'G',
    'compliance',
    { ru: 'Налоги, право и compliance', en: 'Tax, legal & compliance' },
    // Settler → глубже.
    ['P6', 'P7', 'P8', 'P9', 'P10', 'P20', 'P23'],
  ),
  draftCluster(
    'H',
    'emergency',
    { ru: 'Экстренная помощь на Пхукете', en: 'Emergency support on Phuket' },
    // §5: все фазы, приоритет — первые 90 дней. Берём core touristic + новых экспатов.
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P13', 'P14', 'P19', 'P20', 'P25'],
  ),
  draftCluster(
    'I',
    'lifestyle',
    { ru: 'Стиль жизни и впечатления', en: 'Lifestyle & experiences' },
    // §5: все фазы, преимущественно consumer и resident-user.
    ['P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P15', 'P16', 'P18', 'P24'],
  ),
  draftCluster(
    'J',
    'exit',
    { ru: 'Выход из актива и возврат', en: 'Exit & re-entry' },
    // Returnee, переход resident → absentee.
    ['P8', 'P9', 'P10', 'P20'],
  ),
] as const;

/**
 * Slug'и live-кластеров, для которых шаг B.8 заполнит реальный контент.
 * Используется в `__tests__/clusterLandings.test.ts` как «контракт ожиданий».
 */
export const LIVE_CLUSTER_SLUGS: readonly string[] = [
  'arrival',     // A
  'investment',  // D
  'operations',  // F
] as const;
