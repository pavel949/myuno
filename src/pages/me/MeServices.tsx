/**
 * /me/services — MeServices
 * Thin wrapper that surfaces the existing Discover navigator inside the
 * /me shell. Reuses the same component (no duplicated catalog).
 */
import React, { Suspense } from 'react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { LoadingState } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';

const Navigator = React.lazy(() => import('@/components/navigation/v3/NavigatorPageV3'));

export default function MeServices() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <MeShellLayout title={isRu ? 'Услуги' : 'Services'}>
      <Suspense fallback={<LoadingState />}>
        <Navigator />
      </Suspense>
    </MeShellLayout>
  );
}
