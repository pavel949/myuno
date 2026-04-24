import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ClusterGrid } from './ClusterGrid';

interface AllSectionsAccordionProps {
  personas: UserPersona[];
}

/**
 * AllSectionsAccordion — progressive disclosure for the full cluster catalog.
 * Hidden by default; experienced users open it to access all 6 clusters.
 */
export function AllSectionsAccordion({ personas }: AllSectionsAccordionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="px-4 pb-3">
      <Accordion type="single" collapsible>
        <AccordionItem value="all" className="border border-border rounded-none px-4 [&[data-state=open]]:bg-card/40">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex flex-col items-start text-left">
              <span className="text-[14px] font-semibold text-foreground">
                {isRu ? 'Все разделы' : 'All sections'}
              </span>
              <span className="text-[11.5px] text-muted-foreground mt-0.5">
                {isRu ? '6 направлений · 45 сервисов' : '6 clusters · 45 services'}
              </span>
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
