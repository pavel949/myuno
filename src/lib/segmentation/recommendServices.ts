/**
 * @module recommendServices
 * @description M5 — Persona-aware service recommendations.
 *
 * Maps `active_clusters` (canonical 6 surfaces) to a curated set of
 * 5–7 entry routes from `02-service-catalogue-v2.md`. Pure function,
 * no network calls. Deterministic ordering: cluster priority then
 * intra-cluster severity.
 */

import type { ClusterId } from '@/types/canonical';
import type { CanonicalModifier } from './detectPersona';

export interface ServiceRecommendation {
  id: string;
  cluster: ClusterId | 'modifier';
  icon: string;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  route: string;
  urgency: 'high' | 'medium' | 'low';
}

const CATALOG: ServiceRecommendation[] = [
  // Arrive
  {
    id: 'arrive-sim',
    cluster: 'arrive',
    icon: '📶',
    title: { en: 'Pick a SIM plan', ru: 'Выбрать SIM' },
    description: { en: 'Tourist & long-stay options', ru: 'Туристические и длительные тарифы' },
    route: '/sim',
    urgency: 'high',
  },
  {
    id: 'arrive-transport',
    cluster: 'arrive',
    icon: '🚖',
    title: { en: 'Airport transfer', ru: 'Трансфер из аэропорта' },
    description: { en: 'Verified drivers, fixed price', ru: 'Проверенные водители, фиксированная цена' },
    route: '/transport',
    urgency: 'medium',
  },
  {
    id: 'arrive-experiences',
    cluster: 'arrive',
    icon: '🏝️',
    title: { en: 'Tours & experiences', ru: 'Туры и впечатления' },
    description: { en: 'Curated by neighbourhood', ru: 'Подобраны по районам' },
    route: '/experiences',
    urgency: 'low',
  },
  // Live
  {
    id: 'live-rent',
    cluster: 'live',
    icon: '🏠',
    title: { en: 'Long-term rental', ru: 'Долгосрочная аренда' },
    description: { en: '1–12 month homes', ru: 'Жильё на 1–12 месяцев' },
    route: '/property/rent',
    urgency: 'high',
  },
  {
    id: 'live-services',
    cluster: 'live',
    icon: '🧹',
    title: { en: 'Home services', ru: 'Услуги для дома' },
    description: { en: 'Cleaning, repairs, delivery', ru: 'Уборка, ремонт, доставка' },
    route: '/services',
    urgency: 'medium',
  },
  {
    id: 'live-medical',
    cluster: 'live',
    icon: '🩺',
    title: { en: 'Healthcare', ru: 'Медицина' },
    description: { en: 'Clinics, insurance, pharmacy', ru: 'Клиники, страховка, аптеки' },
    route: '/medical',
    urgency: 'medium',
  },
  // Legal
  {
    id: 'legal-visa',
    cluster: 'legal',
    icon: '🛂',
    title: { en: 'Visa quiz', ru: 'Подбор визы' },
    description: { en: '4 questions → recommended type', ru: '4 вопроса → подходящий тип' },
    route: '/visa/quiz',
    urgency: 'high',
  },
  {
    id: 'legal-relocate',
    cluster: 'legal',
    icon: '🛬',
    title: { en: 'Relocation kit', ru: 'Комплект релокации' },
    description: { en: 'Visa, banking, schools, healthcare', ru: 'Виза, банки, школы, медицина' },
    route: '/relocate',
    urgency: 'medium',
  },
  // Invest
  {
    id: 'invest-offplan',
    cluster: 'invest',
    icon: '🏗️',
    title: { en: 'Off-plan projects', ru: 'Новостройки' },
    description: { en: 'Ranked with ClearView™', ru: 'С рейтингом ClearView™' },
    route: '/property/offplan',
    urgency: 'high',
  },
  {
    id: 'invest-capital',
    cluster: 'invest',
    icon: '💼',
    title: { en: 'Capital advisory', ru: 'Capital advisory' },
    description: { en: 'Talk to the investment desk', ru: 'Поговорить с инвестиционной командой' },
    route: '/invest',
    urgency: 'medium',
  },
  // Manage
  {
    id: 'manage-portal',
    cluster: 'manage',
    icon: '🔑',
    title: { en: 'Owner portal', ru: 'Кабинет собственника' },
    description: { en: 'Track income & operations', ru: 'Доход и операции по объекту' },
    route: '/my-property',
    urgency: 'high',
  },
  {
    id: 'manage-pms',
    cluster: 'manage',
    icon: '📊',
    title: { en: 'Property management', ru: 'Управление недвижимостью' },
    description: { en: 'STR ops, calendars, reports', ru: 'Аренда, календари, отчёты' },
    route: '/mc',
    urgency: 'medium',
  },
  // Build
  {
    id: 'build-vendor',
    cluster: 'build',
    icon: '🛠️',
    title: { en: 'Become a provider', ru: 'Стать поставщиком' },
    description: { en: 'List services on the marketplace', ru: 'Разместить услуги в маркетплейсе' },
    route: '/vendor/onboarding',
    urgency: 'medium',
  },
];

const MODIFIER_RECS: Record<CanonicalModifier, ServiceRecommendation[]> = {
  'pet-owner': [{
    id: 'mod-pets', cluster: 'modifier', icon: '🐾',
    title: { en: 'Pet services', ru: 'Услуги для питомцев' },
    description: { en: 'Vet, grooming, sitting', ru: 'Ветеринар, груминг, передержка' },
    route: '/pets', urgency: 'high',
  }],
  medical: [],
  halal: [],
  kosher: [],
  accessibility: [],
  lgbtq: [],
  athlete: [{
    id: 'mod-fitness', cluster: 'modifier', icon: '🏋️',
    title: { en: 'Fitness & wellness', ru: 'Фитнес и wellness' },
    description: { en: 'Studios, coaching, recovery', ru: 'Студии, тренировки, восстановление' },
    route: '/fitness', urgency: 'medium',
  }],
  wedding: [{
    id: 'mod-wedding', cluster: 'modifier', icon: '💍',
    title: { en: 'Wedding planner', ru: 'Свадебный планировщик' },
    description: { en: 'Venues, catering, photography', ru: 'Площадки, кейтеринг, фото' },
    route: '/wedding', urgency: 'high',
  }],
  'family-young': [{
    id: 'mod-kids', cluster: 'modifier', icon: '🧸',
    title: { en: 'Kids & nanny', ru: 'Дети и няни' },
    description: { en: 'Nanny, playrooms, pediatrics', ru: 'Няни, игровые, педиатры' },
    route: '/kids', urgency: 'high',
  }],
  'family-school': [{
    id: 'mod-school', cluster: 'modifier', icon: '🎒',
    title: { en: 'School finder', ru: 'Подбор школы' },
    description: { en: 'International schools matched', ru: 'Подбор международных школ' },
    route: '/school-finder', urgency: 'high',
  }],
};

const URGENCY_RANK: Record<ServiceRecommendation['urgency'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function recommendServices(input: {
  activeClusters: ClusterId[];
  modifiers?: CanonicalModifier[];
  limit?: number;
}): ServiceRecommendation[] {
  const limit = input.limit ?? 6;
  const clusters = new Set(input.activeClusters);
  const seen = new Set<string>();
  const out: ServiceRecommendation[] = [];

  // Modifier-driven first (high relevance)
  for (const mod of input.modifiers ?? []) {
    for (const rec of MODIFIER_RECS[mod] ?? []) {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        out.push(rec);
      }
    }
  }

  // Cluster-driven
  const clusterMatches = CATALOG.filter(
    (c) => c.cluster !== 'modifier' && clusters.has(c.cluster as ClusterId),
  );
  clusterMatches.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
  for (const rec of clusterMatches) {
    if (!seen.has(rec.id)) {
      seen.add(rec.id);
      out.push(rec);
    }
  }

  // Fallback to general discover if nothing matched
  if (out.length === 0) {
    out.push({
      id: 'fallback-discover',
      cluster: 'arrive',
      icon: '🧭',
      title: { en: 'Discover myUNO', ru: 'Открыть myUNO' },
      description: { en: 'Browse all services', ru: 'Все сервисы платформы' },
      route: '/discover',
      urgency: 'medium',
    });
  }

  return out.slice(0, limit);
}
