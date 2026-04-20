/**
 * Index — myUNO Home
 *
 * Role-blended home screen: signal stack, conditions strip, quick actions,
 * concierge nudge, activity feed, cluster grid, trust footer.
 * Business users stay on the marketplace; optional workspace banner links to /mc, /vendor, /my-property.
 */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';

import { HomeTopBar } from '@/components/home/HomeTopBar';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { SignalStack } from '@/components/home/SignalStack';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { QuickActionsBlended } from '@/components/home/QuickActionsBlended';
import { ConciergeCard } from '@/components/home/ConciergeCard';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { ClusterGrid } from '@/components/home/ClusterGrid';
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
        <HomeTopBar
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />
        <WorkspaceHomeBanner />
        <SignalStack
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />
        <NowInPhuket />
        <QuickActionsBlended personas={[...activePersonas]} />
        <ConciergeCard personas={[...activePersonas]} />
        <ActivityFeed personas={[...activePersonas]} />

        {/* Hairline separator */}
        <div className="mx-4 h-px bg-border/[0.05] mb-5" />

        <ClusterGrid personas={[...activePersonas]} />
        <TrustFooter />
      </div>

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
