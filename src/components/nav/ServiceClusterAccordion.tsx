import React from 'react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  getClusterHeaderLabel,
  getClusterServiceLocalizedLabel,
  type ClusterCatalogEntry,
} from '@/lib/nav/clusterCatalog';
import type { Language } from '@/i18n';
import { pickLang } from '@/lib/i18n/pickLang';
import { CATEGORIES } from '@/lib/catalog';

/**
 * Token-driven cluster tints. Keep in sync with `--cluster-*` in tokens.css
 * and the `cluster-*` palette entry in tailwind.config.ts. Static map so
 * Tailwind keeps these utilities in the production CSS.
 */
const CLUSTER_TINT: Record<string, { icon: string; bg: string }> = {
  arrive: { icon: 'text-cluster-arrive', bg: 'bg-cluster-arrive/10' },
  live:   { icon: 'text-cluster-live',   bg: 'bg-cluster-live/10' },
  manage: { icon: 'text-cluster-manage', bg: 'bg-cluster-manage/10' },
  invest: { icon: 'text-cluster-invest', bg: 'bg-cluster-invest/10' },
  legal:  { icon: 'text-cluster-legal',  bg: 'bg-cluster-legal/10' },
  build:  { icon: 'text-cluster-build',  bg: 'bg-cluster-build/10' },
};
const FALLBACK_TINT = { icon: 'text-muted-foreground', bg: 'bg-muted' };

export interface ServiceClusterAccordionProps {
  /** Pre-filtered clusters (e.g. `filterCatalogForUser`) */
  clusters: ClusterCatalogEntry[];
  language: Language;
  onNavigate: (path: string) => void;
  sectionTitle: string;
  className?: string;
  compact?: boolean;
}

/**
 * SSOT cluster accordion: same map in left AppDrawer and bottom AllAppsDrawer.
 * Hides `soon` services so taps always go to real routes.
 */
export function ServiceClusterAccordion({
  clusters,
  language,
  onNavigate,
  sectionTitle,
  className,
  compact = false,
}: ServiceClusterAccordionProps) {
  if (compact) return <section className={className}>
    <h3 className="text-xs font-semibold text-muted-foreground mb-2">{sectionTitle}</h3>
    <div className="divide-y divide-border/40">
      {clusters.filter(cluster => cluster.services.some(service => service.status !== 'soon')).map(cluster => {
        const Icon = cluster.icon;
        const labels: Record<string, { ru: string; en: string; th: string }> = {
          arrive: { ru: 'Приехать и обустроиться', en: 'Arrive and settle in', th: 'เดินทางและตั้งถิ่นฐาน' },
          live: { ru: 'Жильё и повседневные услуги', en: 'Homes and everyday services', th: 'ที่พักและบริการประจำวัน' },
          invest: { ru: 'Купить и инвестировать', en: 'Buy and invest', th: 'ซื้อและลงทุน' },
          legal: { ru: 'Визы, документы и финансы', en: 'Visas, documents and finances', th: 'วีซ่า เอกสาร และการเงิน' },
          manage: { ru: 'Управлять недвижимостью', en: 'Manage property', th: 'จัดการอสังหาริมทรัพย์' },
          build: { ru: 'Для застройщиков', en: 'For developers', th: 'สำหรับผู้พัฒนาโครงการ' },
        };
        const links = cluster.services.filter(service => service.status !== 'soon');
        const named = (cluster.sectionCategories ?? []).map(category => ({
          ...category,
          links: links.filter(link => category.services.some(service => service.id ? service.id === link.id : service.path === link.path)),
        })).filter(category => category.links.length);
        const remaining = links.filter(link => !named.some(category => category.links.includes(link)));
        const groups = [...named, ...(remaining.length ? [{ id: 'other', labelRu: 'Другие услуги', labelEn: 'Other services', links: remaining }] : [])];
        return <div key={cluster.id}><button type="button" onClick={() => onNavigate(cluster.homeRoute)}
          className="flex items-center gap-3 text-left w-full min-h-12 py-3 text-sm">
          <Icon className="w-4 h-4 shrink-0" />
          <span>{labels[cluster.id] ? pickLang(language, labels[cluster.id]) : getClusterHeaderLabel(cluster, language)}</span>
        </button>
          <details className="pb-2 pl-7">
            <summary className="min-h-11 py-3 cursor-pointer text-xs text-muted-foreground">
              {pickLang(language, { ru: 'Выбрать услугу', en: 'Choose a service', th: 'เลือกบริการ' })}
            </summary>
            {groups.map(group => <div key={group.id} className="mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground">{pickLang(language, { ru: group.labelRu, en: group.labelEn, th: CATEGORIES.find(category => category.id === group.id)?.labelTh ?? (group.id === 'other' ? 'บริการอื่น ๆ' : undefined) })}</h4>
              {group.links.map(link => <button key={`${link.id}:${link.path}`} type="button" onClick={() => onNavigate(link.path)}
                className="flex items-center justify-between gap-2 w-full min-h-11 py-2 text-left text-sm">
                {link.id === 'contract-ai' ? pickLang(language, { ru: 'Проверка договора с ИИ', en: 'Review a contract with AI', th: 'ตรวจสอบสัญญาด้วย AI' }) : getClusterServiceLocalizedLabel(link, language)}
                {link.status === 'pro' && <span
                  aria-label={pickLang(language, { ru: 'Профессиональный сервис', en: 'Professional service', th: 'บริการสำหรับผู้เชี่ยวชาญ' })}
                  className="text-[8px] font-bold px-1.5 py-px rounded-full bg-accent/15 text-accent">
                  PRO
                </span>}
              </button>)}
            </div>)}
          </details>
        </div>;
      })}
    </div>
  </section>;
  return (
    <section className={cn(className)}>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        {sectionTitle}
      </h3>
      <Accordion type="multiple" className="w-full">
        {clusters.map((cluster) => {
          const Icon = cluster.icon;
          const links = cluster.services.filter((s) => s.status !== 'soon');
          if (links.length === 0) return null;
          const tint = CLUSTER_TINT[cluster.id] ?? FALLBACK_TINT;
          return (
            <AccordionItem
              key={cluster.id}
              value={cluster.id}
              className="border-b border-border/40"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn('w-8 h-8 rounded-none flex items-center justify-center shrink-0', tint.bg)}>
                    <Icon className={cn('w-4 h-4', tint.icon)} />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">
                    {getClusterHeaderLabel(cluster, language)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto mr-2">
                    {links.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pl-11">
                <div className="flex flex-col gap-0.5">
                  {links.map((link) => (
                    <button
                      key={`${cluster.id}-${link.path}-${link.labelEn}`}
                      type="button"
                      onClick={() => onNavigate(link.path)}
                      className="text-left text-[13px] text-muted-foreground hover:text-foreground py-2 px-2 -mx-2 rounded-none hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                    >
                      <span>{getClusterServiceLocalizedLabel(link, language)}</span>
                      {link.status === 'pro' && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-px rounded-full"
                          style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}
                        >
                          PRO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
