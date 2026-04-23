/**
 * lifecycle-matrix.ts
 *
 * M6 · Track C.1 — pure-функция матрицы переходов lifecycle_stage.
 *
 * Вынесена в отдельный файл, чтобы тестировать без сети / БД (см. C.5).
 *
 * Источник истины: docs/canonical/01-segmentation-framework.md §1
 * Канонические 8 фаз: scout → tourist → snowbird → nomad → settler →
 * resident → absentee → returnee.
 *
 * ВАЖНО — детерминизм:
 *  - чистая функция: один и тот же вход → один и тот же выход;
 *  - порядок проверки правил зафиксирован (см. resolveLifecycleStage);
 *  - never-downgrade NOT enforced здесь — это решается в edge function
 *    через сравнение с предыдущей фазой (settler/resident → absentee
 *    допустим, absentee → tourist допустим как explicit returnee).
 */

export const LIFECYCLE_STAGES = [
  "scout",
  "tourist",
  "snowbird",
  "nomad",
  "settler",
  "resident",
  "absentee",
  "returnee",
] as const;

export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export interface LifecycleSignals {
  /** Текущая стадия в profiles. Может быть null (новый пользователь). */
  currentStage: LifecycleStage | null;
  /** Сумма дней в Таиланде по подтверждённым bookings/иммиграции. */
  totalDaysInThailand: number;
  /** Сколько отдельных визитов (не обязательно длинных). */
  visitsCount: number;
  /** Тип текущей визы (TR60 / DTV / LTR / Education / Retirement / null). */
  visaType: string | null;
  /** Дата истечения визы (ISO). */
  visaExpiresAt: string | null;
  /** Подтверждённые поездки в исторической перспективе (сезоны). */
  distinctSeasons?: number;
  /** Активный «return after gap» — есть `prev resident/absentee` + новый booking. */
  hasRecentReturnBooking?: boolean;
  /** Текущая дата для проверки visaExpiresAt. */
  now?: Date;
}

export interface LifecycleResolution {
  stage: LifecycleStage;
  /** Машинное обоснование. Используется в lifecycle_stage_history.reason. */
  reason: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function diffDays(target: Date, now: Date): number {
  return Math.round((target.getTime() - now.getTime()) / DAY_MS);
}

/**
 * Канонические правила перехода. Порядок проверки — снизу вверх по фазам:
 * сначала проверяем максимальную фазу (returnee), затем спускаемся.
 *
 * Матрица:
 *  - returnee   : был resident/absentee + новый booking + перерыв 90+ дней
 *                 (сигнал hasRecentReturnBooking + currentStage absentee).
 *  - absentee   : был resident/settler + visa expired ИЛИ нет визитов 180+ дней.
 *  - resident   : 730+ days OR visa LTR/Retirement активна.
 *  - settler    : 180+ days OR visa Education/DTV активна И totalDays >= 90.
 *  - nomad      : visa DTV активна И totalDays < 180.
 *  - snowbird   : 2+ distinctSeasons (сезонник).
 *  - tourist    : >=1 visit, totalDays > 0.
 *  - scout      : default (нет визитов).
 */
export function resolveLifecycleStage(s: LifecycleSignals): LifecycleResolution {
  const now = s.now ?? new Date();
  const visaActive =
    s.visaExpiresAt != null && diffDays(new Date(s.visaExpiresAt), now) > 0;
  const visaExpired =
    s.visaExpiresAt != null && diffDays(new Date(s.visaExpiresAt), now) <= 0;
  const visa = (s.visaType ?? "").toLowerCase();
  const seasons = s.distinctSeasons ?? 0;

  // returnee — высший приоритет: вернулся после absentee
  if (s.currentStage === "absentee" && s.hasRecentReturnBooking) {
    return { stage: "returnee", reason: "absentee + new booking after gap" };
  }

  // absentee — был resident/settler и виза истекла (или нет визитов 180+ дней)
  if (
    (s.currentStage === "resident" || s.currentStage === "settler") &&
    (visaExpired || s.totalDaysInThailand === 0)
  ) {
    return { stage: "absentee", reason: "prior resident/settler with expired visa or no visits" };
  }

  // resident — глубокая интеграция: 2+ года или LTR/Retirement
  if (s.totalDaysInThailand >= 730) {
    return { stage: "resident", reason: "totalDays >= 730" };
  }
  if (visaActive && (visa === "ltr" || visa === "retirement" || visa.startsWith("o-a") || visa.startsWith("o-x"))) {
    return { stage: "resident", reason: `active long-term visa: ${visa}` };
  }

  // settler — 180+ дней ИЛИ DTV/Education с >=90 днями
  if (s.totalDaysInThailand >= 180) {
    return { stage: "settler", reason: "totalDays >= 180" };
  }
  if (visaActive && (visa === "dtv" || visa === "education" || visa === "ed") && s.totalDaysInThailand >= 90) {
    return { stage: "settler", reason: `${visa} visa with totalDays >= 90` };
  }

  // nomad — DTV-виза с малым налётом
  if (visaActive && visa === "dtv" && s.totalDaysInThailand < 180) {
    return { stage: "nomad", reason: "active DTV visa, totalDays < 180" };
  }

  // snowbird — 2+ распознанных сезона
  if (seasons >= 2) {
    return { stage: "snowbird", reason: "distinctSeasons >= 2" };
  }

  // tourist — есть визит
  if (s.visitsCount >= 1 || s.totalDaysInThailand > 0) {
    return { stage: "tourist", reason: "visits >= 1 or totalDays > 0" };
  }

  return { stage: "scout", reason: "no visits yet (default)" };
}
