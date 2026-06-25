/**
 * IndexV2 — Wave 2 Home: 3 зоны (Hero / Next Best Action / For You).
 *
 * Включается фича-флагом `feature_flag:home_v2` в `system_settings`.
 * Сохраняет ровно те же точки переходов, что и legacy 5-зонный Home:
 *  - HeroGreeting → AI-поиск, AppDrawer, RoleSheet
 *  - PendingPaymentsChip / ActiveSituation / LifecycleSmartTip → existing CTAs
 *  - PersonalGrid (limit=6) → mini-app routes
 *  - «Все приложения» → AppDrawer
 *  - «Изменить роль» → RoleSheet
 *
 * Wave 3 добавит why-chip к карточкам For You поверх этого layout.
 */
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';

import { HeroGreeting } from '@/components/home/HeroGreeting';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { LifecycleSmartTip } from '@/components/home/LifecycleSmartTip';
import { RoleSheet } from '@/components/home/RoleSheet';
import { PersonalGrid } from '@/components/superapp/PersonalGrid';
import { WhyChip } from '@/components/home/WhyChip';
import { Coachmarks } from '@/components/onboarding/Coachmarks';
import { useAuth } from '@/contexts/AuthContext';
import { CLUSTERS, FLAT_SERVICES } from '@/lib/catalog/taxonomy';

const TOTAL_CLUSTERS = CLUSTERS.length;
const TOTAL_SERVICES = FLAT_SERVICES.length;

const IndexV2: React.FC = () => {
  const { personas, effectivePersonas, togglePersona, setPersonas } = useUserPersonas();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  const activePersonas = effectivePersonas;
  const isRu = language === 'ru';

  return (
    <AppLayout showHeader={false} showFooter={false}>
      <div className="pb-24">
        {/* Zone 1 — Hero */}
        <HeroGreeting
          personas={[...activePersonas]}
          onRoleSheetOpen={() => setRoleSheetOpen(true)}
          onAppDrawerOpen={() => setAppDrawerOpen(true)}
        />

        {/* Zone 2 — Next Best Action.
            Каждый под-блок самоскрывающийся: реально на экране окажется
            не более одного приоритетного сигнала. */}
        <section
          aria-label={isRu ? 'Приоритетное действие' : 'Next best action'}
          data-coach="next-best-action"
        >
          <PendingPaymentsChip />
          <ActiveSituation
            personas={[...activePersonas]}
            onRoleSheetOpen={() => setRoleSheetOpen(true)}
          />
          <LifecycleSmartTip />
        </section>

        {/* Zone 3 — For You (6 mini-apps) + двери в полный каталог/роли */}
        <section aria-label={isRu ? 'Для вас' : 'For you'}>
          <div data-coach="why-chip">
            <WhyChip onOpenRoleSheet={() => setRoleSheetOpen(true)} />
          </div>
          <PersonalGrid limit={6} />

          <div className="px-4 mt-6" data-coach="all-apps">
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

          <div className="px-4 mt-3 text-center">
            <button
              type="button"
              onClick={() => setRoleSheetOpen(true)}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Изменить роль' : 'Change role'}
            </button>
          </div>
        </section>
      </div>

      {/* Wave 5 — onboarding tour. Self-gates via localStorage; only for signed-in users. */}
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
        personas={[...activePersonas]}
        onSwitchRole={() => setRoleSheetOpen(true)}
      />
    </AppLayout>
  );
};

export default IndexV2;
