/**
 * Revenue Streams (R1–R5) — RE-priority view.
 *
 * Real-estate is the core (R1+R2 ≈ 85% of revenue). R3/R4/R5 are retention layers.
 * Used by `ServicePassport` and pricing pages to label each service with its stream.
 */

import type { RevenueStream, BiText } from './realEstateEngine';

export interface RevenueStreamMeta {
  id: RevenueStream;
  /** Display order: lower = more important. */
  priority: number;
  label: BiText;
  oneLiner: BiText;
  /** Approximate share of total revenue (Y2 target, %). */
  targetShare: number;
}

export const REVENUE_STREAMS: Record<RevenueStream, RevenueStreamMeta> = {
  R1_transaction: {
    id: 'R1_transaction',
    priority: 1,
    label: { ru: 'R1 · Сделки с недвижимостью', en: 'R1 · Real-estate transactions' },
    oneLiner: {
      ru: 'Комиссии от продажи, аренды и инвестиционных сделок.',
      en: 'Commissions on sales, rentals and investment deals.',
    },
    targetShare: 65,
  },
  R2_trust: {
    id: 'R2_trust',
    priority: 2,
    label: { ru: 'R2 · Проверка и оценка', en: 'R2 · Trust as a service' },
    oneLiner: {
      ru: 'ClearView, оценка цены, due diligence, KYC.',
      en: 'ClearView, fair-price, due diligence, KYC.',
    },
    targetShare: 18,
  },
  R5_operate: {
    id: 'R5_operate',
    priority: 3,
    label: { ru: 'R5 · Сопровождение и сервис', en: 'R5 · Operations & services' },
    oneLiner: {
      ru: 'Property Care, управление под ключ, консьерж.',
      en: 'Property Care, full management, concierge.',
    },
    targetShare: 9,
  },
  R3_subscription: {
    id: 'R3_subscription',
    priority: 4,
    label: { ru: 'R3 · Подписки', en: 'R3 · Subscriptions' },
    oneLiner: {
      ru: 'Owner Pro, MC Studio, Vendor SaaS, Developer Portal.',
      en: 'Owner Pro, MC Studio, Vendor SaaS, Developer Portal.',
    },
    targetShare: 5,
  },
  R4_lead: {
    id: 'R4_lead',
    priority: 5,
    label: { ru: 'R4 · Лиды и продвижение', en: 'R4 · Leads & promotion' },
    oneLiner: {
      ru: 'Verified Lead для застройщиков, спонсорское размещение.',
      en: 'Verified leads for developers, sponsored placement.',
    },
    targetShare: 3,
  },
};

export const REVENUE_STREAMS_ORDERED: RevenueStreamMeta[] = Object.values(REVENUE_STREAMS).sort(
  (a, b) => a.priority - b.priority,
);
