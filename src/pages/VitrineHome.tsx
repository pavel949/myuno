/**
 * VitrineHome — Public-facing vitrine homepage for myUNO
 * 
 * Sections:
 * 1. Navigation (sticky, with Life Situations & Services dropdowns)
 * 2. Hero (wordmark + search + popular tags)
 * 3. Life Situations (4 cards)
 * 4. Full Service Grid (18+ categories with live counts)
 * 5. Property Management Spotlight (gold-tinted premium section)
 * 6. Trust Bar (dynamic provider/service counts)
 * 7. Footer (4-column layout)
 */
import React from 'react';
import { SEOHead, createOrganizationSchema } from '@/components/seo';
import { VitrineNav } from '@/components/vitrine/VitrineNav';
import { VitrineHero } from '@/components/vitrine/VitrineHero';
import { LifeSituationCards } from '@/components/vitrine/LifeSituationCards';
import { FullServiceGrid } from '@/components/vitrine/FullServiceGrid';
import { PropertySpotlight } from '@/components/vitrine/PropertySpotlight';
import { TrustBar } from '@/components/vitrine/TrustBar';
import { VitrineFooter } from '@/components/vitrine/VitrineFooter';

const VitrineHome = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="myUNO — Your Life Operating System"
        description="Every service verified. Every transaction protected. One platform for everything in Phuket — from airport transfers to property management."
        jsonLd={createOrganizationSchema()}
      />

      <VitrineNav />

      <main className="flex-1">
        <VitrineHero />
        <LifeSituationCards />
        <FullServiceGrid />
        <PropertySpotlight />
        <TrustBar />
      </main>

      <VitrineFooter />
    </div>
  );
};

export default VitrineHome;
