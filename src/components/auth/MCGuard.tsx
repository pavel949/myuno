import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildAuthPath } from '@/lib/auth/redirectToAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/**
 * MC workspace guard — allows access only to users who are members
 * of at least one management_company (via management_company_members).
 * Verifies user has a valid activeCompany, not just any membership.
 * Admins always pass through.
 */
export function MCGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading, isVerifying, error, refetch } = useResolvedContext();
  const { companies, activeCompany, isLoading: companiesLoading } = useActiveCompany();

  if (authLoading || contextLoading || isVerifying || companiesLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to={buildAuthPath({ from: `${location.pathname}${location.search}${location.hash}` })} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }

  if (error) {
    return <div role="alert" className="min-h-[12rem] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{pickLang(language, { en: 'Could not verify access. Please try again.', ru: 'Не удалось проверить доступ. Повторите попытку.', th: 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง' })}</p>
      <button type="button" className="underline underline-offset-4" onClick={() => { void refetch(); }}>
        {pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
      </button>
    </div>;
  }

  // Server-resolved admin access
  if (context?.role === 'admin') {
    return <>{children}</>;
  }

  // No companies — redirect to onboarding
  if (companies.length === 0) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  // Has companies but activeCompany couldn't be resolved (e.g. stored ID from another company)
  if (!activeCompany) {
    return <Navigate to="/mc/onboarding" replace />;
  }

  return <>{children}</>;
}
