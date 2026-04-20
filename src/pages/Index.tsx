/**
 * Index — myUNO Home
 *
 * Role-blended home screen: signal stack, conditions strip, quick actions,
 * concierge nudge, activity feed, cluster grid, trust footer.
 * Role redirects (owner/vendor/mc) are preserved from the previous implementation.
 */
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useUserContext } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { useAuth } from '@/contexts/AuthContext';

import { HomeTopBar } from '@/components/home/HomeTopBar';
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
  const { activeRole, isLoading: contextLoading } = useUserContext();
  const { isMCPortal, isLoading: ownerTypeLoading } = useOwnerType();
  const { isLoading: authLoading } = useAuth();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  // Role redirects — owners, vendors, mc_portal users should not see the generic home
  if (!authLoading && !ownerTypeLoading && !contextLoading) {
    if (activeRole === 'owner' || activeRole === 'property_manager') return <Navigate to="/mc" replace />;
    if (activeRole === 'vendor') return <Navigate to="/vendor" replace />;
    if (isMCPortal) return <Navigate to="/my-property" replace />;
  }

  // Default persona for unauthenticated or no-persona users
  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        <HomeTopBar
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />
        <SignalStack
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />
        <NowInPhuket />
        <QuickActionsBlended personas={[...activePersonas]} />
        <ConciergeCard personas={[...activePersonas]} />
        <ActivityFeed personas={[...activePersonas]} />

        {/* Hairline separator */}
        <div className="mx-4 h-px bg-border/20 mb-5" />

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
