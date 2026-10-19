/** Personalized Home uses the same compact personal entry points as legacy Home. */
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
import { ClusterGridCards } from '@/components/home/ClusterGridCards';
import { RoleSheet } from '@/components/home/RoleSheet';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { Coachmarks } from '@/components/onboarding/Coachmarks';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
import { PersonalHomeActions } from '@/components/home/PersonalHomeActions';
import { HomePreferencesEntry } from '@/components/home/HomePreferencesEntry';
import { pickLang } from '@/lib/i18n/pickLang';

const IndexV2: React.FC = () => {
  const { personas, effectivePersonas, togglePersona, setPersonas, isLoading, isToggling, isSetting, error } = useUserPersonas();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  // Stable identity so memoized children (e.g. ClusterGridCards' blendClusters) don't recompute every render.
  const activePersonas = useMemo(() => [...effectivePersonas], [effectivePersonas]);

  return (
    <AppLayout showHeader={false} showFooter>
      <div className="mx-auto w-full max-w-3xl pb-24">
        {/* Compact personal identity and explicit, verified workspace navigation. */}
        <HeroGreeting
          personas={personas}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
          onAppDrawerOpen={() => setAppDrawerOpen(true)}
        />

        <WorkspaceHomeBanner />
        <PersonalHomeActions />
        <PendingPaymentsChip />
        <SignalStack personas={activePersonas} onRoleSheetOpen={() => setRoleSheetOpen(true)} />

        <HomePreferencesEntry onOpen={() => setRoleSheetOpen(true)} />
        <PersonalGrid limit={4} />
        <ClusterGridCards personas={activePersonas} />
        <NowInPhuket />

        {/* All-apps door */}
        <div className="px-4">
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

      {/* Onboarding tour — self-gates via localStorage; signed-in users only */}
      {user && <Coachmarks />}

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
        personas={activePersonas}
        onSwitchRole={() => setRoleSheetOpen(true)}
      />
    </AppLayout>
  );
};

export default IndexV2;
