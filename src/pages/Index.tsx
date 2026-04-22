/**
 * Index — myUNO Home (task-first ordering)
 *
 * Order optimized for returning users: get to "what do I need" fast,
 * then "what's already in progress", then trust/discovery blocks.
 */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';

import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HomeContextChips } from '@/components/home/HomeContextChips';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { HeroIntro } from '@/components/home/HeroIntro';
import { PrimaryActions } from '@/components/home/PrimaryActions';
import { PopularTasks } from '@/components/home/PopularTasks';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { AllSectionsAccordion } from '@/components/home/AllSectionsAccordion';
import { FloatingConcierge } from '@/components/home/FloatingConcierge';
import { TrustFooter } from '@/components/home/TrustFooter';
import { RoleSheet } from '@/components/home/RoleSheet';
import { RealEstateEntry } from '@/components/home/RealEstateEntry';
import { TrustAsAService } from '@/components/home/TrustAsAService';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const Index = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const reEngineOn = useFeatureFlag('re_revenue_engine', true);
  const trustOn = useFeatureFlag('trust_as_service', true);
  const popularTasksOn = useFeatureFlag('popular_tasks_block', false);

  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        <div className="px-4">
          <HomeTopBar
            personas={[...activePersonas]}
            onRoleSheetOpen={() => setRoleSheetOpen(true)}
            onAppDrawerOpen={() => setAppDrawerOpen(true)}
          />
        </div>
        <HomeContextChips personas={[...activePersonas]} />
        <WorkspaceHomeBanner />

        {/* 1. Hero — search-first entry, with desktop popular preview */}
        <HeroIntro />

        {/* 2. Tasks — what do I need to do */}
        {popularTasksOn ? <PopularTasks /> : <PrimaryActions />}

        {/* 3. Active — what's already in progress */}
        <ActiveSituation
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />

        {/* 4. Trust / discovery — story blocks */}
        {reEngineOn && <RealEstateEntry />}
        {trustOn && <TrustAsAService />}

        {/* 5. Catalog — everything else */}
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

export default Index;
