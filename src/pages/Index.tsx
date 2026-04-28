/**
 * Index — myUNO Home.
 *
 * Поведение управляется флагом `feature_flag:home_simplified_v1`:
 *  - ON  → 5-зонная упрощённая главная (PrimaryGrid + ActiveSituation + NowInPhuket).
 *  - OFF → исторический layout с 15 блоками (regression-safe).
 *
 * См. план: .lovable/plan.md, Шаг 1.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';

import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HeroGreeting } from '@/components/home/HeroGreeting';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
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
import { PrimaryGrid } from '@/components/home/PrimaryGrid';
import type { HomeSectionKey } from '@/lib/segmentation/prioritizeHomeSections';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const PRIORITY_DEFAULT_ORDER: readonly HomeSectionKey[] = [
  'PersonaPromptBanner',
  'ActiveSituation',
] as const;

const Index = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const { language } = useLanguage();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  // Simplified home gate (Step 1 of план: .lovable/plan.md)
  const simplifiedOn = useFeatureFlag('home_simplified_v1', true);

  // Legacy flags (используются только в legacy-режиме)
  const reEngineOn = useFeatureFlag('re_revenue_engine', true);
  const trustOn = useFeatureFlag('trust_as_service', true);
  const popularTasksOn = useFeatureFlag('popular_tasks_block', false);
  const personaAwareOn = useFeatureFlag('home_persona_aware_v1', false);

  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);
  const isRu = language === 'ru';

  // ─────────────────────────────────────────────────────────────────
  // Simplified layout (5 zones, max ~2 screens of scroll)
  // ─────────────────────────────────────────────────────────────────
  if (simplifiedOn) {
    return (
      <AppLayout showHeader={false} showFooter={false}>
        <div className="pb-24">
          {/* 1. Hero — navy gradient, greeting, persona chip, AI search */}
          <HeroGreeting
            personas={[...activePersonas]}
            onRoleSheetOpen={() => setRoleSheetOpen(true)}
            onAppDrawerOpen={() => setAppDrawerOpen(true)}
          />

          <WorkspaceHomeBanner />

          {/* 2. Pending payments — single compact chip (only renders if count>0) */}
          <PendingPaymentsChip />

          {/* 3. ActiveSituation — live signals for the active persona (only when real data) */}
          <ActiveSituation
            personas={[...activePersonas]}
            onRoleSheetOpen={() => setRoleSheetOpen(true)}
          />

          {/* 4. PrimaryGrid — Bento: 1 hero CTA + 3 mini tiles */}
          <PrimaryGrid />

          {/* 5. Now in Phuket — narrow ambient strip */}
          <NowInPhuket />

          {/* 5. «Все приложения» — single explicit door to everything else */}
          <div className="px-4 mt-6">
            <button
              type="button"
              onClick={() => setAppDrawerOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span>
                <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                  {isRu ? 'Все приложения' : 'All apps'}
                </span>
                <span className="block text-[12px] text-muted-foreground mt-0.5">
                  {isRu ? '6 кластеров · 80+ сервисов' : '6 clusters · 80+ services'}
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
            </button>
          </div>

          {/* Tiny link to switch role — keeps progressive disclosure */}
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
  }

  // ─────────────────────────────────────────────────────────────────
  // Legacy layout (kept for rollback). См. оригинальный комментарий ниже.
  // ─────────────────────────────────────────────────────────────────
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

export default Index;
