import React, { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { Printer } from 'lucide-react';
import {
  GuideCover,
  GuideTableOfContents,
  GuideEcosystem,
  GuidePropertyCare,
  GuideChannels,
  GuideIntegration,
  GuideComparison,
  GuideRoadmap,
  GuideContacts,
} from '@/components/owner/guide';

export default function OwnerGuidePage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background">
      {/* Inline Header — only print actions, no back button needed (sidebar handles nav) */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border no-print">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isRu ? 'Руководство для собственников' : 'Owner Guide'}
          </h1>
          <p className="text-xs text-muted-foreground">myUNO v2.0</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" size="sm" />
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{isRu ? 'Печать / PDF' : 'Print / PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="max-w-4xl mx-auto py-8 px-4 print:pt-0 print:pb-0 print:max-w-none print-colors"
      >
        {/* Cover Page */}
        <GuideCover />

        {/* Table of Contents */}
        <GuideTableOfContents />

        {/* Part 1: Ecosystem */}
        <GuideEcosystem />

        {/* Part 2: Property Care */}
        <GuidePropertyCare />

        {/* Part 3: Channel Manager */}
        <GuideChannels />

        {/* Part 4: Integration & Management Options */}
        <GuideIntegration />

        {/* Part 5: Comparison */}
        <GuideComparison />

        {/* Part 6: Roadmap */}
        <GuideRoadmap />

        {/* Part 7: Contacts */}
        <GuideContacts />
      </div>
    </div>
  );
}
