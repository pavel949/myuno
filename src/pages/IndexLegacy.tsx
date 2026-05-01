/**
 * IndexLegacy — исторический 15-блочный layout главной (regression-safe).
 *
 * Загружается отдельным lazy-чанком только если
 * feature_flag:home_simplified_v1 выключен. В обычном режиме НЕ попадает
 * в основной bundle.
 */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

import { HomeTopBar } from '@/components/home/HomeTopBar';
import { PersonaHalo } from '@/components/home/PersonaHalo';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { HeroIntro } from '@/components/home/HeroIntro';
import { AudienceEntries } from '@/components/home/AudienceEntries';
import { PrimaryActions } from '@/components/home/PrimaryActions';
import { PopularTasks } from '@/components/home/PopularTasks';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { AllSectionsAccordion } from '@/components/home/AllSectionsAccordion';
import { FloatingConcierge } from '@/components/home/FloatingConcierge';
import { TrustFooter } from '@/components/home/TrustFooter';
import { RoleSheet } from '@/components/home/RoleSheet';
import { RealEstateEntry } from '@/components/home/RealEstateEntry';
import { TrustAsAService } from '@/components/home/TrustAsAService';
import { PersonaPromptBanner } from '@/components/home/PersonaPromptBanner';
import { PersonaAwareSections } from '@/components/home/PersonaAwareSections';
import { PersonaDiscoveryStrip } from '@/components/home/PersonaDiscoveryStrip';
import type { HomeSectionKey } from '@/lib/segmentation/prioritizeHomeSections';

const PRIORITY_DEFAULT_ORDER: readonly HomeSectionKey[] = [
  'PersonaPromptBanner',
  'ActiveSituation',
] as const;

const IndexLegacy: React.FC = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const { language: _lang } = useLanguage();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  const reEngineOn = useFeatureFlag('re_revenue_engine', true);
  const trustOn = useFeatureFlag('trust_as_service', true);
  const popularTasksOn = useFeatureFlag('popular_tasks_block', false);
  const personaAwareOn = useFeatureFlag('home_persona_aware_v1', false);

  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);

  const prioritySections: Partial<Record<HomeSectionKey, React.ReactNode>> = {
    PersonaPromptBanner: <PersonaPromptBanner />,
    ActiveSituation: (
      <ActiveSituation
        personas={[...activePersonas]}
        onRoleSheetOpen={() => setRoleSheetOpen(true)}
      />
    ),
  };

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        <div className="bg-primary text-primary-foreground relative">
          <div className="px-4">
            <HomeTopBar
              personas={[...activePersonas]}
              onRoleSheetOpen={() => setRoleSheetOpen(true)}
              onAppDrawerOpen={() => setAppDrawerOpen(true)}
              variant="onNavy"
            />
            <PersonaHalo
              personas={[...activePersonas]}
              onRoleSheetOpen={() => setRoleSheetOpen(true)}
              variant="onNavy"
            />
          </div>
          <div
            className="absolute left-0 right-0 -bottom-3 h-3 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.18), transparent)' }}
            aria-hidden
          />
        </div>
        <div className="h-3" aria-hidden />
        <WorkspaceHomeBanner />

        <PersonaAwareSections
          defaultOrder={PRIORITY_DEFAULT_ORDER}
          sections={prioritySections}
          disabled={!personaAwareOn}
        />

        <NowInPhuket />
        <HeroIntro />
        <AudienceEntries />
        <PersonaDiscoveryStrip />
        {popularTasksOn ? <PopularTasks /> : <PrimaryActions />}
        {reEngineOn && <RealEstateEntry />}
        {trustOn && <TrustAsAService />}
        <AllSectionsAccordion personas={[...activePersonas]} />
        <TrustFooter />
      </div>

      <FloatingConcierge />

      <RoleSheet
        open={roleSheetOpen}
        personas={personas}
        onClose={() => setRoleSheetOpen(false)}
        onToggle={togglePersona}
        onReorder={setPersonas}
      />

      <AppDrawer
        open={appDrawerOpen}
        onOpenChange={setAppDrawerOpen}
        personas={[...activePersonas]}
        onSwitchRole={() => setRoleSheetOpen(true)}
      />
    </AppLayout>
  );
};

export default IndexLegacy;
