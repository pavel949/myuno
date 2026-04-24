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

export interface ServiceClusterAccordionProps {
  /** Pre-filtered clusters (e.g. `filterCatalogForUser`) */
  clusters: ClusterCatalogEntry[];
  language: Language;
  onNavigate: (path: string) => void;
  sectionTitle: string;
  className?: string;
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
}: ServiceClusterAccordionProps) {
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
          return (
            <AccordionItem
              key={cluster.id}
              value={cluster.id}
              className="border-b border-border/40"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-none flex items-center justify-center shrink-0"
                    style={{ background: cluster.color + '1A' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cluster.color }} />
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
