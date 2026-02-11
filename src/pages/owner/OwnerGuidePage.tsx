import React, { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header - Hidden in print */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border no-print">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/owner')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {isRu ? 'Руководство для владельцев' : 'Owner Guide'}
              </h1>
              <p className="text-xs text-muted-foreground">
                myUNO v2.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="dropdown" size="sm" />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isRu ? 'Печать / PDF' : 'Print / PDF'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main 
        ref={contentRef}
        className="max-w-4xl mx-auto pt-20 pb-8 print:pt-0 print:pb-0 print:max-w-none print-colors"
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
      </main>

      {/* Print Instructions - Hidden in print */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-xl p-4 shadow-lg no-print">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isRu ? 'Как сохранить PDF' : 'How to save as PDF'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Нажмите "Печать / PDF", затем выберите "Сохранить как PDF" в диалоге печати.'
                : 'Click "Print / PDF", then choose "Save as PDF" in the print dialog.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
