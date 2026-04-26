import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ClusterGrid } from './ClusterGrid';
import {
  CLUSTER_CATALOG,
  CLUSTER_CATALOG_TOTAL_AVAILABLE,
  filterCatalogForUser,
} from '@/lib/nav/clusterCatalog';

interface AllSectionsAccordionProps {
  personas: UserPersona[];
}

/**
 * AllSectionsAccordion — progressive disclosure for the full cluster catalog.
 * Hidden by default; experienced users open it to access all clusters.
 *
 * Counts come from SSOT, not hardcoded — keeps Home/Discover/Footer in sync.
 * Cluster count is audience-aware so guests don't see "+1 cluster you can't open".
 */
export function AllSectionsAccordion({ personas }: AllSectionsAccordionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const visibleClusters = React.useMemo(
    () => filterCatalogForUser({ personas, role: null }),
    [personas],
  );
  const visibleClusterCount = visibleClusters.length;
  const totalServices = CLUSTER_CATALOG_TOTAL_AVAILABLE;
  const summary = isRu
    ? `${visibleClusterCount} направлений · ${totalServices} сервисов`
    : `${visibleClusterCount} clusters · ${totalServices} services`;

  return (
    <div className="px-4 pb-3">
      <Accordion type="single" collapsible>
        <AccordionItem value="all" className="border border-border rounded-none px-4 [&[data-state=open]]:bg-card/40">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex flex-col items-start text-left">
              <span className="text-[14px] font-semibold text-foreground">
                {isRu ? 'Все разделы' : 'All sections'}
              </span>
              <span className="text-[11.5px] text-muted-foreground mt-0.5">{summary}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <div className="-mx-4">
              <ClusterGrid personas={personas} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

