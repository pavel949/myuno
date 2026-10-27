import { HomeHousingPreview, HomeNewbuildsPreview } from '@/components/home/HomeDiscoveryPreview';
import { HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import '@/styles/cinematic-home.css';
import '@/styles/premium-public.css';
import '@/styles/homepage-refinement.css';
/** Authenticated personal Home, preserving the existing legacy/V2 rollout gate. */
import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import IndexV2 from './IndexV2';

import { HeroGreeting } from '@/components/home/HeroGreeting';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
import { PersonalHomeActions } from '@/components/home/PersonalHomeActions';
import { HomePreferencesEntry } from '@/components/home/HomePreferencesEntry';
import { pickLang } from '@/lib/i18n/pickLang';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { RoleSheet } from '@/components/home/RoleSheet';
import { OfficialNews } from '@/components/home/OfficialNews';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import { ClusterRail } from '@/components/superapp/ClusterRail';
import type { ClusterId } from '@/lib/catalog/taxonomy';
import { useLifeOSRole, type LifeOSRole } from '@/hooks/useLifeOS';

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
  const { personas, effectivePersonas, togglePersona, setPersonas, isLoading, isToggling, isSetting, error } = useUserPersonas();
  const { language } = useLanguage();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const activePersonas = effectivePersonas;

  const role = useLifeOSRole();
  const visibleClusters = ROLE_VISIBLE_CLUSTERS[role] ?? ['live', 'arrive', 'legal'];

  return (
    <AppLayout showHeader={false} showFooter>
      <div className="premium-personal premium-frame">
        {/* Compact identity; account actions take priority over interests. */}
        <HeroGreeting
          personas={personas}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
          onAppDrawerOpen={() => setAppDrawerOpen(true)}
        />

        <WorkspaceHomeBanner />

        <PersonalHomeActions />
        <PendingPaymentsChip />

        {/* 3. ActiveSituation — live signals for the active persona (only when real data) */}
        <ActiveSituation
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
        />

        <HomePreferencesEntry onOpen={() => setRoleSheetOpen(true)} />

        {/* Recommendations follow the stable personal actions. */}
        <PersonalGrid limit={4} />
        <LifecycleSmartTip />
        <div className="premium-personal-discovery"><HomeHousingPreview /><HomeNewbuildsPreview /><HomeServiceGallery /></div>

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
                  ? pickLang(language, { ru: 'Свернуть', en: 'Show less', th: 'แสดงน้อยลง' })
                  : pickLang(language, { ru: 'Ещё разделы, погода и новости', en: 'More sections, weather and news', th: 'หมวดหมู่ สภาพอากาศ และข่าวเพิ่มเติม' })}
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
                {pickLang(language, { ru: 'Все разделы', en: 'All sections', th: 'ทุกหมวดหมู่' })}
              </span>

            </span>
            <ArrowRight className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

      </div>

      <RoleSheet
        open={roleSheetOpen}
        personas={personas}
        onClose={() => setRoleSheetOpen(false)}
        onToggle={togglePersona}
        onReorder={setPersonas}
        isBusy={isLoading || isToggling || isSetting}
        hasError={!!error}
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
  // signed-in admins. Everyone else keeps the legacy Home.
  // When ready for GA, drop the `isAdmin` guard or invert it.
  const homeV2Flag = useFeatureFlag('home_v2', false);
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  if (adminLoading) return <IndexLegacy />;
  return homeV2Flag && isAdmin ? <IndexV2 /> : <IndexLegacy />;
};

export default Index;

