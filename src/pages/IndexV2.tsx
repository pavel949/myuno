/**
 * IndexV2 — mockup-faithful multi-role Home ("control center").
 *
 * Ported from the design handoff (`myuno-design · home.html / screen.jsx`) into
 * the shipped DS 2.1 system: light-first, navy/orange, sharp corners, muted
 * per-role tints — no dark/mint/rainbow (see docs FEASIBILITY §"do not
 * introduce new colours"). Section order matches the mockup exactly:
 *
 *   HeroGreeting → SignalStack → NowInPhuket → PersonalGrid (For you) →
 *   HomeConcierge → HomeActivityFeed → ClusterGridCards → TrustMarker →
 *   All-apps door + Change-role
 *
 * Gated behind `feature_flag:home_v2` (see `Index.tsx`). Every navigation entry
 * point of the legacy Home is preserved. No new route, no new shell.
 */
import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

import { HeroGreeting } from '@/components/home/HeroGreeting';
import { SignalStack } from '@/components/home/SignalStack';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import { HomeConcierge } from '@/components/home/HomeConcierge';
import { HomeActivityFeed } from '@/components/home/HomeActivityFeed';
import { ClusterGridCards } from '@/components/home/ClusterGridCards';
import { TrustMarker } from '@/components/home/TrustMarker';
import { RoleSheet } from '@/components/home/RoleSheet';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { Coachmarks } from '@/components/onboarding/Coachmarks';
import { CLUSTERS, FLAT_SERVICES } from '@/lib/catalog/taxonomy';

const TOTAL_CLUSTERS = CLUSTERS.length;
const TOTAL_SERVICES = FLAT_SERVICES.length;

const IndexV2: React.FC = () => {
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  // Stable identity so memoized children (e.g. ClusterGridCards' blendClusters) don't recompute every render.
  const activePersonas = useMemo(() => [...effectivePersonas], [effectivePersonas]);
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        {/* 1 — Hero: greeting, persona chip, AI concierge search */}
        <HeroGreeting
          personas={activePersonas}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
          onAppDrawerOpen={() => setAppDrawerOpen(true)}
        />

        {/* 2 — Blended signal stack: primary hero card + slim secondaries */}
        <SignalStack personas={activePersonas} onRoleSheetOpen={() => setRoleSheetOpen(true)} />

        {/* 3 — Now in Phuket: weather · AQI · FX */}
        <NowInPhuket />

        {/* 4 — For you: role-weighted quick actions */}
        <PersonalGrid limit={8} />

        {/* 5 — Concierge nudge (intent, never auto-executes money moves) */}
        <HomeConcierge />

        {/* 6 — Cross-role activity feed */}
        <HomeActivityFeed personas={activePersonas} />

        {/* 7 — Persona-ranked cluster grid */}
        <ClusterGridCards personas={activePersonas} />

        {/* 8 — Trust marker */}
        <TrustMarker />

        {/* All-apps door */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => setAppDrawerOpen(true)}
            className="w-full flex items-center justify-between rounded-none border border-border bg-card px-4 py-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                {isRu ? 'Все приложения' : 'All apps'}
              </span>
              <span className="block text-[12px] text-muted-foreground mt-0.5">
                {isRu
                  ? `${TOTAL_CLUSTERS} кластеров · ${TOTAL_SERVICES} сервисов · ⌘K поиск`
                  : `${TOTAL_CLUSTERS} clusters · ${TOTAL_SERVICES} services · ⌘K search`}
              </span>
            </span>
            <ArrowRight className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

        {/* Change role */}
        <div className="px-4 mt-3 text-center">
          <button
            type="button"
            onClick={() => setRoleSheetOpen(true)}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRu ? 'Изменить роль' : 'Change role'}
          </button>
        </div>
      </div>

      {/* Onboarding tour — self-gates via localStorage; signed-in users only */}
      {user && <Coachmarks />}

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
        personas={activePersonas}
        onSwitchRole={() => setRoleSheetOpen(true)}
      />
    </AppLayout>
  );
};

export default IndexV2;
