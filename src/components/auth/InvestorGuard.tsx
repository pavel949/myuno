import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResolvedContext } from '@/hooks/useResolvedContext';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/**
 * Investor workspace guard — gates investor-only surfaces (`/capital`,
 * `/invest/dashboard`, `/invest/ops/*`).
 *
 * Access rule: a **server-resolved** role is required —
 *   admin / uno_team / capital_team / investor (from `useResolvedContext`).
 *
 * P5 hardening (audit AUDIT.md): the previous fallback that granted access when
 * the runtime persona stack contained `investor` was removed. That persona is
 * self-assignable client-side (`user_personas` is a client-writable table via
 * `useUserPersonas`, and guest personas live in localStorage), so it made this
 * confidential Tier-3 surface reachable by anyone who toggled a persona.
 * This guard is UI-gating only — the authoritative control is RLS on the
 * underlying `capital_*` / `investment_deals` tables and document buckets.
 *
 * Unauthed users are sent to `/auth` with the current path preserved.
 * Authed users without the role land on the public `/invest` marketing hub.
 */
export function InvestorGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading: contextLoading, isVerifying, error, refetch } = useResolvedContext();

  if (authLoading || contextLoading || isVerifying) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (error) {
    return <div role="alert" className="min-h-[12rem] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{pickLang(language, { en: 'Could not verify access. Please try again.', ru: 'Не удалось проверить доступ. Повторите попытку.', th: 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง' })}</p>
      <button type="button" className="underline underline-offset-4" onClick={() => { void refetch(); }}>
        {pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
      </button>
    </div>;
  }

  const serverRole = context?.role ?? null;
  const isPrivileged =
    serverRole === 'admin' ||
    serverRole === 'capital_team' ||
    serverRole === 'investor';

  if (isPrivileged) {
    return <>{children}</>;
  }

  return <Navigate to="/invest" replace />;
}
