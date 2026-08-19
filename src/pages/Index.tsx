/**
 * Index — 5-зонная главная myUNO Home.
 *
 * Wave-1 IA cleanup (2026-06): IndexLegacy убран, оставлен только этот
 * 5-зонный layout. До 2026-06-17 файл назывался IndexSimplified и жил под
 * тонкой Suspense-обёрткой Index.tsx — обёртка удалена, так как
 * AnimatedRoutes уже ленивит и оборачивает все маршруты в Suspense.
 */
import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import IndexV2 from './IndexV2';


import { HeroGreeting } from '@/components/home/HeroGreeting';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { RoleSheet } from '@/components/home/RoleSheet';
import { OfficialNews } from '@/components/home/OfficialNews';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import { ClusterRail } from '@/components/superapp/ClusterRail';
import { CLUSTERS, FLAT_SERVICES, type ClusterId } from '@/lib/catalog/taxonomy';
import { useLifeOSRole, type LifeOSRole } from '@/hooks/useLifeOS';

const TOTAL_CLUSTERS = CLUSTERS.length;
const TOTAL_SERVICES = FLAT_SERVICES.length;

/** Same gating as Navigator v3 — what each role sees on Home as icon rails. */
const ROLE_VISIBLE_CLUSTERS: Record<LifeOSRole, ClusterId[]> = {
  guest:     ['arrive', 'live', 'legal'],
  resident:  ['live', 'legal', 'arrive'],
  owner:     ['manage', 'live', 'legal', 'invest'],
  mc:        ['manage', 'legal', 'invest'],
  investor:  ['invest', 'manage', 'legal', 'build'],
  developer: ['build', 'invest', 'manage', 'legal'],
  vendor:    ['manage', 'legal', 'live'],
};

const IndexLegacy: React.FC = () => {
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const { language } = useLanguage();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const activePersonas = effectivePersonas;
  const isRu = language === 'ru';

  const role = useLifeOSRole();
  const visibleClusters = ROLE_VISIBLE_CLUSTERS[role] ?? ['live', 'arrive', 'legal'];

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

        {/* 3.5 Lifecycle smart tips — § 9.4 triggers (only when a signal fires) */}
        <LifecycleSmartTip />

        {/* 4. PersonalGrid — top-8 mini-apps ranked by role + personas */}
        <PersonalGrid />

        {/* 5. Первый (главный для роли) кластер всегда виден */}
        {visibleClusters.slice(0, 1).map((cid) => (
          <ClusterRail key={cid} clusterId={cid} />
        ))}

        {/* 6. Всё остальное — за одной кнопкой «Ещё» (progressive disclosure) */}
        <div className="px-4 mt-4">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="w-full flex items-center justify-between border border-border bg-card px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-[14px] font-medium text-foreground">
                {showMore
                  ? (isRu ? 'Свернуть' : 'Show less')
                  : (isRu ? 'Показать больше: разделы, погода, новости' : 'Show more: sections, weather, news')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${showMore ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
          </button>
        </div>

        {showMore && (
          <>
            {visibleClusters.slice(1).map((cid) => (
              <ClusterRail key={cid} clusterId={cid} />
            ))}
            <NowInPhuket />
            <OfficialNews />
          </>
        )}



        {/* 5. «Все приложения» — single explicit door to everything else */}
        <div className="px-4 mt-6">
          <button
            type="button"
            onClick={() => setAppDrawerOpen(true)}
            className="w-full flex items-center justify-between rounded-none border border-border bg-card px-4 py-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                {isRu ? 'Все услуги и приложения' : 'All services and apps'}
              </span>
              <span className="block text-[12px] text-muted-foreground mt-0.5">
                {isRu
                  ? `Жильё, визы, врач, транспорт и ещё ${Math.max(TOTAL_SERVICES - 4, 0)} сервисов`
                  : `Housing, visas, doctors, transport and ${Math.max(TOTAL_SERVICES - 4, 0)} more services`}
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
};

const Index: React.FC = () => {
  // Wave 2 — Home V2 rollout gate.
  // DB flag `feature_flag:home_v2` is the global kill-switch (set to `{enabled: true}`).
  // While we observe internal feedback, the *client* additionally restricts V2 to
  // signed-in admins / uno_team members. Everyone else keeps the legacy 5-zone Home.
  // When ready for GA, drop the `isAdmin` guard or invert it.
  const homeV2Flag = useFeatureFlag('home_v2', false);
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  if (adminLoading) return <IndexLegacy />;
  return homeV2Flag && isAdmin ? <IndexV2 /> : <IndexLegacy />;
};

export default Index;

