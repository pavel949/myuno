/**
 * IndexSimplified — 5-зонная упрощённая главная myUNO Home.
 *
 * Активна по умолчанию (feature_flag:home_simplified_v1 = ON).
 * Legacy-вариант лежит в IndexLegacy.tsx и подгружается отдельным чанком
 * только если флаг выключен. Это убирает 30+ синхронных импортов из критического пути.
 */
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';

import { HeroGreeting } from '@/components/home/HeroGreeting';
import { PendingPaymentsChip } from '@/components/home/PendingPaymentsChip';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { WorkspaceHomeBanner } from '@/components/home/WorkspaceHomeBanner';
import { ActiveSituation } from '@/components/home/ActiveSituation';
import { NowInPhuket } from '@/components/home/NowInPhuket';
import { RoleSheet } from '@/components/home/RoleSheet';
import { PrimaryGrid } from '@/components/home/PrimaryGrid';

const IndexSimplified: React.FC = () => {
  const { personas, togglePersona, setPersonas } = useUserPersonas();
  const { language } = useLanguage();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);

  const activePersonas = personas.length > 0 ? personas : (['tourist'] as const);
  const isRu = language === 'ru';

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
};

export default IndexSimplified;
