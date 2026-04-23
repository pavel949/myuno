/**
 * @module prioritizeHomeSections
 * @description M6 · Track D.1 + D.2 — детерминированный приоритет блоков Home
 * по канонической персоне пользователя.
 *
 * Чистая функция, без зависимостей от React и Supabase. Принимает прочитанный
 * `CanonicalProfile` (из `useCanonicalProfile`) и дефолтный порядок ключей
 * секций; возвращает пере-упорядоченный массив тех же ключей.
 *
 * Контракт:
 *  - Anon (`profile === null`) → возвращает `defaultOrder` 1:1 (regression-safe).
 *  - Authed без `detected_persona` И без `active_clusters` → `defaultOrder`.
 *  - Иначе: для каждой секции вычисляется boost-score, секции сортируются
 *    стабильно (in-place ordinal сохраняется при равных score).
 *
 * Никогда не удаляет и не добавляет секции — только меняет порядок. Это даёт
 * полную deterministic-обратимость через флаг `feature_flag:home_persona_aware_v1`.
 *
 * См. `docs/canonical/audits/M6-persona-landings.md` § 3 · Трек D.
 */

import type {
  CanonicalProfile,
  ClusterId,
  LifecycleStage,
  PersonaCode,
} from '@/types/canonical';

/* ------------------------------------------------------------------ */
/*  Section keys — must match component identifiers used in Home.tsx  */
/* ------------------------------------------------------------------ */

/**
 * Canonical keys для всех Home-блоков, участвующих в перестановке.
 * Этот список — single source of truth: и `<PersonaAwareSections />`,
 * и `defaultOrder`, и тесты опираются на него.
 *
 * Важно: ключи именно блоки, а не секции «верхнего» уровня (Hero,
 * HomeTopBar, Footer не входят — они фиксированы вне priority-зоны).
 */
export type HomeSectionKey =
  | 'PersonaPromptBanner'
  | 'OfflineEmergencyCard'
  | 'NowInPhuket'
  | 'HomeContextChips'
  | 'ActiveSituation'
  | 'LifecycleSmartTip'
  | 'LifeOSStatusBlock'
  | 'ClusterGrid'
  | 'ClusterHub'
  | 'CategoryGrid'
  | 'FeaturedPropertiesCarousel'
  | 'HomeDiscoveryCarousel'
  | 'ConciergeCard'
  | 'ConciergeBanner'
  | 'ActivityFeed'
  | 'InlinePersonaSelector';

/* ------------------------------------------------------------------ */
/*  D.2 · Cluster → home-section mapping                              */
/* ------------------------------------------------------------------ */

/**
 * Какие секции «принадлежат» какому кластеру. Используется для boost-score:
 * каждая секция в активном кластере получает +CLUSTER_WEIGHT очков за
 * каждое появление в `active_clusters`.
 *
 * Секции могут принадлежать нескольким кластерам — это ожидаемо (например,
 * `CategoryGrid` универсален, `FeaturedPropertiesCarousel` важен и для
 * `invest`, и для `live`).
 *
 * Ключи (`arrive | live | manage | invest | legal | build`) — это 6 кластеров
 * из `canonical.ts § ClusterId`, не путать с 10 кластерами из §5 канона
 * (A..J), которые остаются для лендингов трека B.
 */
export const CLUSTER_TO_SECTIONS: Record<ClusterId, readonly HomeSectionKey[]> = {
  arrive: [
    'OfflineEmergencyCard',
    'NowInPhuket',
    'HomeContextChips',
    'ActiveSituation',
    'CategoryGrid',
  ],
  live: [
    'NowInPhuket',
    'CategoryGrid',
    'HomeDiscoveryCarousel',
    'LifeOSStatusBlock',
    'ActivityFeed',
  ],
  manage: [
    'LifeOSStatusBlock',
    'ActivityFeed',
    'ConciergeCard',
    'CategoryGrid',
  ],
  invest: [
    'FeaturedPropertiesCarousel',
    'ConciergeCard',
    'CategoryGrid',
    'HomeDiscoveryCarousel',
  ],
  legal: [
    'ConciergeCard',
    'ConciergeBanner',
    'LifecycleSmartTip',
    'HomeContextChips',
  ],
  build: [
    'ConciergeCard',
    'CategoryGrid',
    'HomeDiscoveryCarousel',
  ],
};

/* ------------------------------------------------------------------ */
/*  Lifecycle → boost map                                             */
/* ------------------------------------------------------------------ */

/**
 * Lifecycle-ориентированные boost'ы — мягче кластерных (см. WEIGHTS).
 * Дают преимущество секциям, которые семантически релевантны для фазы.
 */
export const LIFECYCLE_TO_SECTIONS: Record<LifecycleStage, readonly HomeSectionKey[]> = {
  scout:    ['ActiveSituation', 'HomeContextChips', 'ConciergeCard'],
  tourist:  ['OfflineEmergencyCard', 'NowInPhuket', 'HomeContextChips'],
  snowbird: ['NowInPhuket', 'CategoryGrid', 'LifecycleSmartTip'],
  nomad:    ['HomeDiscoveryCarousel', 'CategoryGrid', 'LifeOSStatusBlock'],
  settler:  ['LifeOSStatusBlock', 'CategoryGrid', 'LifecycleSmartTip'],
  resident: ['LifeOSStatusBlock', 'ActivityFeed', 'CategoryGrid'],
  absentee: ['FeaturedPropertiesCarousel', 'ActivityFeed', 'ConciergeCard'],
  returnee: ['ActiveSituation', 'CategoryGrid', 'NowInPhuket'],
};

/* ------------------------------------------------------------------ */
/*  Persona → boost map (selective — only personas with strong signals) */
/* ------------------------------------------------------------------ */

/**
 * Не все 25 персон требуют отдельного boost-маппинга. Здесь только те, для
 * которых каноническая матрица §6 даёт уникальный приоритет (напр. P9 HNW
 * однозначно про invest, P13 pet-owner про live + arrive). Прочие персоны
 * получают boost через свои `active_clusters` + `lifecycle_stage`.
 */
export const PERSONA_TO_SECTIONS: Partial<Record<PersonaCode, readonly HomeSectionKey[]>> = {
  P1:  ['OfflineEmergencyCard', 'NowInPhuket', 'HomeContextChips'],            // RU tourist
  P4:  ['HomeDiscoveryCarousel', 'LifeOSStatusBlock', 'CategoryGrid'],         // Digital Nomad
  P5:  ['NowInPhuket', 'LifecycleSmartTip', 'CategoryGrid'],                   // Snowbird
  P7:  ['CategoryGrid', 'HomeContextChips', 'OfflineEmergencyCard'],           // Family + kids
  P8:  ['FeaturedPropertiesCarousel', 'ActivityFeed', 'ConciergeCard'],        // Passive investor
  P9:  ['FeaturedPropertiesCarousel', 'ConciergeCard', 'CategoryGrid'],        // HNW
  P10: ['LifeOSStatusBlock', 'ActivityFeed', 'CategoryGrid'],                  // STR/PM operator
  P13: ['CategoryGrid', 'NowInPhuket', 'OfflineEmergencyCard'],                // Pet-owner
  P14: ['ConciergeCard', 'CategoryGrid', 'HomeContextChips'],                  // Medical tourist
  P20: ['LifecycleSmartTip', 'NowInPhuket', 'CategoryGrid'],                   // Retiree
};

/* ------------------------------------------------------------------ */
/*  Weights & ordering                                                */
/* ------------------------------------------------------------------ */

const WEIGHTS = {
  /** Каждое попадание в активный кластер. Самый сильный сигнал. */
  cluster: 3,
  /** Соответствие lifecycle. Средний сигнал. */
  lifecycle: 2,
  /** Точное совпадение persona. Аналогичен lifecycle, но точечный. */
  persona: 2,
  /** Always-on bump для PersonaPromptBanner если у юзера НЕТ persona —
   *  банер должен оставаться в топе нудж-зоны. */
  promptBannerWhenMissing: 100,
} as const;

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface PrioritizeOptions {
  /** Лимит на сколько максимально позиций секция может «подпрыгнуть» вверх.
   *  Защита от резкой перестройки и layout-shift. По умолчанию unlimited. */
  maxJump?: number;
}

/**
 * Главная функция трека D.
 *
 * @param profile  Read-модель из `useCanonicalProfile()`. `null` для anon.
 * @param defaultOrder Исходный порядок ключей (как объявлен в Home.tsx).
 * @param options  Тонкие настройки. См. `PrioritizeOptions`.
 * @returns Новый массив ключей в приоритетном порядке. **Никогда** не
 *          добавляет/удаляет элементы — длина и состав сохраняются.
 */
export function prioritizeHomeSections(
  profile: CanonicalProfile | null,
  defaultOrder: readonly HomeSectionKey[],
  options: PrioritizeOptions = {},
): HomeSectionKey[] {
  // Anon — без боковых эффектов.
  if (!profile) return [...defaultOrder];

  const hasPersona = !!profile.detectedPersona;
  const hasClusters = profile.activeClusters && profile.activeClusters.length > 0;
  const hasLifecycle = !!profile.lifecycleStage;

  // Authed без сигналов — тоже дефолт.
  if (!hasPersona && !hasClusters && !hasLifecycle) {
    return [...defaultOrder];
  }

  const score = new Map<HomeSectionKey, number>();
  for (const key of defaultOrder) score.set(key, 0);

  // 1. Кластерный boost.
  if (hasClusters) {
    for (const cluster of profile.activeClusters) {
      const sections = CLUSTER_TO_SECTIONS[cluster] ?? [];
      for (const sec of sections) {
        if (score.has(sec)) score.set(sec, (score.get(sec) ?? 0) + WEIGHTS.cluster);
      }
    }
  }

  // 2. Lifecycle boost.
  if (hasLifecycle && profile.lifecycleStage) {
    const sections = LIFECYCLE_TO_SECTIONS[profile.lifecycleStage] ?? [];
    for (const sec of sections) {
      if (score.has(sec)) score.set(sec, (score.get(sec) ?? 0) + WEIGHTS.lifecycle);
    }
  }

  // 3. Persona boost (точечный).
  if (hasPersona && profile.detectedPersona) {
    const sections = PERSONA_TO_SECTIONS[profile.detectedPersona] ?? [];
    for (const sec of sections) {
      if (score.has(sec)) score.set(sec, (score.get(sec) ?? 0) + WEIGHTS.persona);
    }
  }

  // 4. Special case: PersonaPromptBanner всегда вверху, если persona ОТСУТСТВУЕТ.
  if (!hasPersona && score.has('PersonaPromptBanner')) {
    score.set('PersonaPromptBanner', WEIGHTS.promptBannerWhenMissing);
  }

  // Стабильная сортировка: сохраняем оригинальный индекс при равных score.
  const indexed = defaultOrder.map((key, idx) => ({
    key,
    idx,
    score: score.get(key) ?? 0,
  }));

  indexed.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.idx - b.idx;
  });

  let result = indexed.map((x) => x.key);

  // 5. Опциональный maxJump — ограничивает прыжок вверх.
  if (typeof options.maxJump === 'number' && options.maxJump >= 0) {
    result = applyMaxJump(result, defaultOrder, options.maxJump);
  }

  return result;
}

/**
 * Гарантирует, что ни одна секция не сдвинулась вверх больше чем на `maxJump`
 * позиций по сравнению с `defaultOrder`. Защита от резкой перестройки UI.
 *
 * Алгоритм: проходим слева направо по приоритетному порядку; если позиция
 * элемента поднялась больше чем на `maxJump`, временно заменяем его соседом
 * из дефолта. Реализация — двухпроходный clamp, не оптимально, но детерминированно
 * и легко покрывается тестами.
 */
function applyMaxJump(
  prioritized: HomeSectionKey[],
  defaultOrder: readonly HomeSectionKey[],
  maxJump: number,
): HomeSectionKey[] {
  const defaultIndex = new Map(defaultOrder.map((k, i) => [k, i]));
  const out: HomeSectionKey[] = [...prioritized];

  for (let newIdx = 0; newIdx < out.length; newIdx++) {
    const key = out[newIdx];
    const oldIdx = defaultIndex.get(key) ?? newIdx;
    const jump = oldIdx - newIdx;
    if (jump > maxJump) {
      // Откат: меняем местами с тем элементом, который стоит на (oldIdx - maxJump).
      const targetIdx = oldIdx - maxJump;
      if (targetIdx > newIdx && targetIdx < out.length) {
        const tmp = out[targetIdx];
        out[targetIdx] = key;
        out[newIdx] = tmp;
      }
    }
  }

  return out;
}

/**
 * Sanity check: убеждается, что результат содержит ровно те же ключи, что и
 * вход. Используется в DEV-сборке для assertion'а.
 */
export function isSamePermutation(
  a: readonly HomeSectionKey[],
  b: readonly HomeSectionKey[],
): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  if (setA.size !== a.length) return false;
  for (const k of b) if (!setA.has(k)) return false;
  return true;
}
