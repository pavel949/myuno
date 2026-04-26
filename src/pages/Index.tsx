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
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * M6 · D.4 — priority-zone keys, в каноническом дефолтном порядке.
 * Это секции, участвующие в перестановке `prioritizeHomeSections()`.
 * Hero, HomeTopBar, Footer и т.п. фиксированы вне priority-зоны.
 */
const PRIORITY_DEFAULT_ORDER: readonly HomeSectionKey[] = [
  'PersonaPromptBanner',
  'ActiveSituation',
] as const;

const Index = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const reEngineOn = useFeatureFlag('re_revenue_engine', true);
  const trustOn = useFeatureFlag('trust_as_service', true);
  const popularTasksOn = useFeatureFlag('popular_tasks_block', false);
  // M6 · D.4 — gated за `feature_flag:home_persona_aware_v1` (default OFF).
  // Включается одной строкой в `system_settings` без релиза.
  const personaAwareOn = useFeatureFlag('home_persona_aware_v1', false);

  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);

  // Готовые JSX-элементы для priority-зоны. Передаются в PersonaAwareSections
  // как Partial<Record<HomeSectionKey, ReactNode>>; отсутствующие ключи
  // безопасно пропускаются.
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
        {/* ── Brand band ─────────────────────────────────────────────
            Canonical navy header (#0A2240) — gives the home a clear
            anchor and lets the cream content below feel intentional
            instead of washed-out. The 12-px gradient bleed below
            softens the seam into the cream surface. Per canon §1
            navy is ≤10% of the screen budget; the band shrinks below
            the fold on scroll so the average exposure stays inside it. */}
        <div className="bg-primary text-primary-foreground relative">
          <div className="px-4">
            <HomeTopBar
              personas={[...activePersonas]}
              onRoleSheetOpen={() => setRoleSheetOpen(true)}
              onAppDrawerOpen={() => setAppDrawerOpen(true)}
              variant="onNavy"
            />
          </div>
          <HomeContextChips personas={[...activePersonas]} variant="onNavy" />
          {/* Soft fade from navy into the cream page — keeps the seam
              from looking like a hard band. */}
          <div
            className="absolute left-0 right-0 -bottom-3 h-3 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.18), transparent)' }}
            aria-hidden
          />
        </div>
        <div className="h-3" aria-hidden />
        <WorkspaceHomeBanner />

        {/*
          M6 · D.4 — priority-zone (PersonaPromptBanner + ActiveSituation).
          Под флагом `home_persona_aware_v1` обёртка перестраивает порядок
          по канонической персоне (`useCanonicalProfile` → `prioritizeHomeSections`).
          Если флаг OFF / loading / anon → дефолтный порядок (regression-safe).
          Hero и tasks-блок остаются на фиксированных позициях ниже.
        */}
        <PersonaAwareSections
          defaultOrder={PRIORITY_DEFAULT_ORDER}
          sections={prioritySections}
          disabled={!personaAwareOn}
        />

        {/* "Now in Phuket" — ambient pulse strip (weather · AQI · FX), per design v5.
            Positioned right after the role signals so the home page feels rooted in
            real-time local context, even when no personalized signals are active. */}
        <NowInPhuket />

        {/* 1. Hero — search-first entry, with desktop popular preview */}
        <HeroIntro />

        {/* 2. Audience entries — gov-style "find your door".
            Each audience has 3 concrete linked tasks + a primary CTA, so
            users self-identify in <3s and reach the right surface in 1 tap. */}
        <AudienceEntries />

        {/* 3. Persona discovery strip — surface the 26 tailored landings */}
        <PersonaDiscoveryStrip />

        {/* 4. Tasks — what do I need to do right now */}
        {popularTasksOn ? <PopularTasks /> : <PrimaryActions />}

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
