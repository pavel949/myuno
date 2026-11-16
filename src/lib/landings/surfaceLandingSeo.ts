/**
 * SEO helpers for the 6 canonical surface landings (`/for/{arrive|live|
 * manage|invest|legal|build}`) — emits BreadcrumbList + Service JSON-LD
 * inside a single `@graph` so `SEOHead`'s single-object `jsonLd` slot
 * carries both.
 *
 * Lives separately from `surfaceLandings.ts` so the lightweight registry
 * stays free of schema.org concerns.
 */
import { buildBreadcrumbSchema, SEO_CONSTANTS } from '@/lib/seo/schemaBuilders';
import { SURFACE_LANDINGS, type SurfaceSlug } from './surfaceLandings';

const ORIGIN = SEO_CONSTANTS.ORIGIN;

interface SurfaceSeoBundle {
  title: string;
  description: string;
  url: string;
  jsonLd: Record<string, unknown>;
}

const META: Record<SurfaceSlug, { titleRu: string; titleEn: string; descRu: string; descEn: string }> = {
  arrive: {
    titleRu: 'Прибытие на Пхукет — трансфер, eSIM, заселение',
    titleEn: 'Arrive in Phuket — transfer, eSIM, check-in',
    descRu: 'Первые 72 часа на Пхукете: трансфер из аэропорта, eSIM, наличные THB, заселение и ориентация по районам.',
    descEn: 'First 72 hours in Phuket: airport transfer, eSIM, THB cash, check-in and area orientation.',
  },
  live: {
    titleRu: 'Жизнь на Пхукете — переезд, школа, банк',
    titleEn: 'Life in Phuket — relocation, school, bank',
    descRu: 'Долгосрочная жизнь на Пхукете: жильё, банк, школа, страховка, транспорт. Чек-листы и сервисы в одном месте.',
    descEn: 'Long-term life in Phuket: housing, banking, schools, insurance, transport. Checklists and services in one place.',
  },
  manage: {
    titleRu: 'Управление недвижимостью на Пхукете — PMS, гости, отчёты',
    titleEn: 'Property management in Phuket — PMS, guests, reports',
    descRu: 'Календарь, гости, уборка, отчёты собственнику, динамические цены — управление недвижимостью на Пхукете под ключ.',
    descEn: 'Calendar, guests, cleaning, owner reports, dynamic pricing — turnkey property management in Phuket.',
  },
  invest: {
    titleRu: 'Инвестиции в Пхукет — недвижимость, бизнес, capital',
    titleEn: 'Invest in Phuket — real estate, business, capital',
    descRu: 'Опубликованные проекты и готовая недвижимость, доступные оценки и проверка документов. Условия и риски обсуждаются по конкретному предложению.',
    descEn: 'Published projects and resale property, available assessments and document review. Discuss the terms and risks of each opportunity.',
  },
  legal: {
    titleRu: 'Юридические услуги на Пхукете — виза, компания, споры',
    titleEn: 'Legal services in Phuket — visa, company, disputes',
    descRu: 'Виза и иммиграция, компания, семейное право, налоги и споры. Обсудите необходимые документы и условия помощи по вашему вопросу.',
    descEn: 'Visa and immigration, company, family law, tax and disputes. Discuss the documents and support terms for your question.',
  },
  build: {
    titleRu: 'Строительство виллы на Пхукете — земля, подрядчик, сдача',
    titleEn: 'Build a villa in Phuket — land, contractor, handover',
    descRu: 'Земля, документы, проект, подрядчик и приёмка. Согласуйте задачи, необходимые проверки и условия каждого этапа.',
    descEn: 'Land, documents, design, contractor and handover. Agree the scope, required checks and terms for each stage.',
  },
};

export function buildSurfaceSeo(slug: SurfaceSlug, language: 'ru' | 'en'): SurfaceSeoBundle {
  const meta = META[slug];
  const surface = SURFACE_LANDINGS.find((s) => s.slug === slug)!;
  const path = surface.href;
  const url = `${ORIGIN}${path}`;
  const isRu = language === 'ru';
  const title = isRu ? meta.titleRu : meta.titleEn;
  const description = isRu ? meta.descRu : meta.descEn;

  const breadcrumb = buildBreadcrumbSchema([
    { name: isRu ? 'Главная' : 'Home', url: `${ORIGIN}/` },
    { name: isRu ? 'По жизненному циклу' : 'By lifecycle', url: `${ORIGIN}/for` },
    { name: isRu ? surface.titleRu : surface.titleEn, url },
  ]);

  const service: Record<string, unknown> = {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: title,
    description,
    serviceType: `Phuket lifecycle surface: ${slug}`,
    areaServed: { '@type': 'Place', name: 'Phuket, Thailand' },
    provider: SEO_CONSTANTS.ORG_PROVIDER,
    url,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumb, service],
  };

  return { title, description, url, jsonLd };
}
