import React from 'react';
import { AccessRecheckBoundary } from './AccessRecheckBoundary';
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
  const { context, isLoading: contextLoading, isVerifying, error: contextError, refetch } = useResolvedContext();
  const { companies, activeCompany, isLoading: companiesLoading, isVerifying: companiesVerifying, error: companiesError, refetch: retryCompanies } = useActiveCompany();

  const pending = authLoading || contextLoading || isVerifying || (context?.role !== 'admin' && (companiesLoading || !!companiesVerifying));
  const error = contextError || (context?.role === 'admin' ? null : companiesError);
  const allowed = !pending && !!user && !error && (context?.role === 'admin' || (companies.length > 0 && !!activeCompany));
  const identity = JSON.stringify([user?.id, context?.mode, context?.entity_id, context?.role,
    [...(context?.permissions ?? [])].sort(), activeCompany?.company_id, activeCompany?.role, location.pathname]);
  const renderBoundary = (fallback: React.ReactNode) => <AccessRecheckBoundary identity={identity}
    allowed={allowed} pending={pending && !error} fallback={fallback}>{children}</AccessRecheckBoundary>;

  if (pending) {
    return renderBoundary(<LoadingState />);
  }

  if (!user) {
    return renderBoundary(<Navigate to={buildAuthPath({ from: `${location.pathname}${location.search}${location.hash}` })} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />);
  }

  if (error) {
    return renderBoundary(<div role="alert" className="min-h-[12rem] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{pickLang(language, { en: 'Could not verify access. Please try again.', ru: 'Не удалось проверить доступ. Повторите попытку.', th: 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง' })}</p>
      <button type="button" style={{ minHeight: 44, minWidth: 44 }} className="underline underline-offset-4" onClick={() => { void refetch(); void retryCompanies?.(); }}>
        {pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
      </button>
    </div>);
  }

  // Server-resolved admin access
  if (context?.role === 'admin') {
    return renderBoundary(null);
  }

  // No companies — redirect to onboarding
  if (companies.length === 0) {
    return renderBoundary(<Navigate to="/mc/onboarding" replace />);
  }

  // Has companies but activeCompany couldn't be resolved (e.g. stored ID from another company)
  if (!activeCompany) {
    return renderBoundary(<Navigate to="/mc/onboarding" replace />);
  }

  return renderBoundary(null);
}
