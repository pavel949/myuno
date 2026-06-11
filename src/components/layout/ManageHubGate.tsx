/**
 * ManageHubGate — Wave 3 stabilize fix.
 *
 * Закрывает gap из UX-IA аудита 2026-06: cluster-card «Manage» вёл
 * на маркетинг-лендинг даже для уже залогиненных операторов (MC / Owner),
 * у которых есть рабочий портал. Теперь:
 *
 *  - property_manager → /mc (PMS workspace)
 *  - owner / property_owner → /my-property (read-only portal)
 *  - все остальные (включая гостей) → исходный маркетинг-лендинг
 *
 * Хук `useUserRoles` уже кэшируется React Query, поэтому редирект мгновенный
 * для тёплого кэша и не блокирует маркетинговую страницу для гостей
 * (для них `isLoading=false` сразу — `enabled: !!user?.id`).
 */
import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const ForManagementCompanies = React.lazy(
  () => import('@/pages/ForManagementCompanies'),
);

export default function ManageHubGate() {
  const { user, isLoading: authLoading } = useAuth();
  const { activeRoles, isLoading: rolesLoading } = useUserRoles();

  // Guest — show marketing landing immediately, no role fetch needed.
  if (!user) {
    return (
      <Suspense fallback={<LoadingState />}>
        <ForManagementCompanies />
      </Suspense>
    );
  }

  // Logged-in: wait for auth+roles to resolve before deciding.
  if (authLoading || rolesLoading) {
    return <LoadingState />;
  }

  if (activeRoles.includes('property_manager')) {
    return <Navigate to={APP_ROUTES.MC_HOME ?? '/mc'} replace />;
  }
  if (activeRoles.includes('property_owner') || activeRoles.includes('owner')) {
    return <Navigate to={APP_ROUTES.OWNER_PORTAL} replace />;
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <ForManagementCompanies />
    </Suspense>
  );
}
