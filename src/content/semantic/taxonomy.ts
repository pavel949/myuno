/**
 * @module content/semantic/taxonomy
 * @description Three-axis taxonomy from §3 of the Semantic Core.
 *
 * Used by:
 *  - Page tagging (`segmentation` export per §17.1 prompt).
 *  - AI concierge entity graph (§7.3).
 *  - Internal cross-linking rules (§7.2).
 */

import type { BilingualString } from '@/lib/landings/types';

// ────────────────────────────────────────────────────────────────────
// §3.1 · Axis A · Lifecycle (8 phases — note: §3.1 lists 8 entries)
// ────────────────────────────────────────────────────────────────────

export type LifecycleSlug =
  | 'scout'
  | 'tourist'
  | 'snowbird'
  | 'nomad'
  | 'settler'
  | 'resident'
  | 'absentee'
  | 'returnee';

export const LIFECYCLE: Readonly<Record<LifecycleSlug, { label: BilingualString; intent: BilingualString }>> = {
  scout: { label: { ru: 'разведчик', en: 'scout' }, intent: { ru: 'Присматриваюсь', en: 'I am scouting' } },
  tourist: { label: { ru: 'турист', en: 'tourist' }, intent: { ru: 'На отдыхе', en: 'On holiday' } },
  snowbird: { label: { ru: 'сезонный', en: 'snowbird' }, intent: { ru: 'Каждый сезон', en: 'Every season' } },
  nomad: { label: { ru: 'цифровой кочевник', en: 'digital nomad' }, intent: { ru: 'Работаю удалённо', en: 'I work remotely' } },
  settler: { label: { ru: 'новый резидент', en: 'new expat' }, intent: { ru: 'Переезжаю', en: 'I am moving here' } },
  resident: { label: { ru: 'резидент', en: 'resident' }, intent: { ru: 'Живу здесь', en: 'I live here' } },
  absentee: { label: { ru: 'удалённый владелец', en: 'absentee owner' }, intent: { ru: 'Владею, не живу', en: 'I own, I don\u2019t live here' } },
  returnee: { label: { ru: 'возвращенец', en: 'returnee' }, intent: { ru: 'Возвращаюсь после паузы', en: 'I am returning after a break' } },
} as const;

// ────────────────────────────────────────────────────────────────────
// §3.2 · Axis B · Economic role (6 roles)
// ────────────────────────────────────────────────────────────────────

export type EconomicRoleSlug =
  | 'consumer'
  | 'resident-user'
  | 'investor-passive'
  | 'investor-active'
  | 'operator'
  | 'provider';

export const ECONOMIC_ROLE: Readonly<Record<EconomicRoleSlug, { label: BilingualString; monetisation: BilingualString }>> = {
  'consumer': { label: { ru: 'потребитель', en: 'consumer' }, monetisation: { ru: 'Escrow 8\u201315 % на сервисах', en: 'Escrow 8\u201315 % on services' } },
  'resident-user': { label: { ru: 'житель-пользователь', en: 'resident-user' }, monetisation: { ru: 'Подписка + per-service', en: 'Subscription + per-service' } },
  'investor-passive': { label: { ru: 'пассивный инвестор', en: 'passive investor' }, monetisation: { ru: 'Комиссия 5\u201310 % off-plan, PM revenue share', en: 'Commission 5\u201310 % off-plan, PM revenue share' } },
  'investor-active': { label: { ru: 'активный инвестор', en: 'active investor' }, monetisation: { ru: 'Комиссия + management retainer', en: 'Commission + management retainer' } },
  'operator': { label: { ru: 'оператор', en: 'operator' }, monetisation: { ru: 'PM подписка + revenue share', en: 'PM subscription + revenue share' } },
  'provider': { label: { ru: 'партнёр-провайдер', en: 'service provider' }, monetisation: { ru: 'Листинг + revenue share', en: 'Listing + revenue share' } },
} as const;

// ────────────────────────────────────────────────────────────────────
// §3.3 · Axis C · Situation cluster (10 clusters A–J)
// ────────────────────────────────────────────────────────────────────

export type SituationClusterSlug =
  | 'arrival'
  | 'stay-longer'
  | 'settle'
  | 'investing'
  | 'buying'
  | 'manage'
  | 'compliance'
  | 'emergency'
  | 'lifestyle'
  | 'leaving';

export const SITUATION_CLUSTER: Readonly<Record<SituationClusterSlug, { label: BilingualString; intent: BilingualString }>> = {
  arrival: { label: { ru: 'прибытие и ориентация', en: 'arrival & orientation' }, intent: { ru: 'Только что прилетел', en: 'I just landed' } },
  'stay-longer': { label: { ru: 'продление пребывания', en: 'extension & transition' }, intent: { ru: 'Решаю остаться', en: 'I am deciding to stay' } },
  settle: { label: { ru: 'обустройство', en: 'settlement' }, intent: { ru: 'Живу и обустраиваюсь', en: 'I am settling in' } },
  investing: { label: { ru: 'выбор инвестиции', en: 'investment consideration' }, intent: { ru: 'Думаю о покупке', en: 'I am considering buying' } },
  buying: { label: { ru: 'сделка', en: 'transaction' }, intent: { ru: 'Покупаю / продаю', en: 'I am buying / selling' } },
  manage: { label: { ru: 'управление', en: 'operations & management' }, intent: { ru: 'Управляю объектом', en: 'I manage a property' } },
  compliance: { label: { ru: 'соответствие', en: 'legal & compliance' }, intent: { ru: 'Виза, налоги, регистрация', en: 'Visa, tax, registration' } },
  emergency: { label: { ru: 'экстренное', en: 'emergency' }, intent: { ru: 'Срочно помогите', en: 'Help me now' } },
  lifestyle: { label: { ru: 'образ жизни', en: 'lifestyle' }, intent: { ru: 'Еда, спорт, сообщество', en: 'Food, sports, community' } },
  leaving: { label: { ru: 'выход и возврат', en: 'exit & re-entry' }, intent: { ru: 'Уезжаю / продаю', en: 'I am leaving / selling' } },
} as const;

// ────────────────────────────────────────────────────────────────────
// Page-level segmentation tag (per §17.1 prompt format)
// ────────────────────────────────────────────────────────────────────

export interface PageSegmentation {
  lifecycle: LifecycleSlug[] | 'all';
  role: EconomicRoleSlug[];
  cluster: SituationClusterSlug;
  /** Optional secondary cluster (≤2 per page per §3 note). */
  secondaryCluster?: SituationClusterSlug;
}
