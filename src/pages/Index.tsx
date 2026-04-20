/**
 * Index — myUNO Home (simplified)
 *
 * Five blocks total: TopBar → HeroIntro → PrimaryActions → ActiveSituation → AllSections.
 * One question per screen, the rule of three, progressive disclosure.
 * Concierge is a floating button; legacy blocks moved to /discover and /account.
 */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';

import { HomeTopBar } from '@/components/home/HomeTopBar';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { HeroIntro } from '@/components/home/HeroIntro';
import { PrimaryActions } from '@/components/home/PrimaryActions';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { AllSectionsAccordion } from '@/components/home/AllSectionsAccordion';
import { FloatingConcierge } from '@/components/home/FloatingConcierge';
import { TrustFooter } from '@/components/home/TrustFooter';
import { RoleSheet } from '@/components/home/RoleSheet';

const Index = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  // Default persona for unauthenticated or no-persona users
  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        <div className="px-4">
          <HomeTopBar
            personas={[...activePersonas]}
            onRoleSheetOpen={() => setRoleSheetOpen(true)}
          />
        </div>
        <WorkspaceHomeBanner />
        <HeroIntro />
        <PrimaryActions />
        <ActiveSituation
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />
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
    </AppLayout>
  );
};

export default Index;
