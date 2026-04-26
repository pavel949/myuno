import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Store, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'myuno:workspace-home-banner-dismissed';

function hasMcWorkspaceAccess(roles: AppRole[]): boolean {
  return roles.some((r) =>
    r === 'owner' ||
    r === 'property_manager' ||
    r === 'admin' ||
    r === 'uno_team' ||
    r === 'staff'
  );
}

export function WorkspaceHomeBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { availableRoles, isLoading: contextLoading } = useUserContext();
  const { isMCPortal, isLoading: ownerTypeLoading } = useOwnerType();
  const isRu = language === 'ru';

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (dismissed) sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [dismissed]);

  const links = useMemo(() => {
    const out: { to: string; labelEn: string; labelRu: string; icon: typeof Building2 }[] = [];
    if (hasMcWorkspaceAccess(availableRoles)) {
      out.push({
        to: '/mc',
        labelEn: 'Management workspace',
        labelRu: 'Кабинет управления',
        icon: Building2,
      });
    }
    if (availableRoles.includes('vendor')) {
      out.push({
        to: '/vendor',
        labelEn: 'Provider workspace',
        labelRu: 'Кабинет поставщика',
        icon: Store,
      });
    }
    if (isMCPortal) {
      out.push({
        to: '/my-property',
        labelEn: 'Owner portal',
        labelRu: 'Кабинет собственника',
        icon: Home,
      });
    }
    return out;
  }, [availableRoles, isMCPortal]);

  if (!user || dismissed || contextLoading || ownerTypeLoading || links.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        // Mobile: tight one-row banner that doesn't push content below the
        // fold. Tablet+: original generous layout with explanatory text.
        'mb-3 flex w-full max-w-3xl items-center gap-2 rounded-none border border-border/60 bg-muted/40 px-3 py-2 mx-auto',
        'sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3'
      )}
      role="region"
      aria-label={isRu ? 'Рабочие кабинеты' : 'Workspaces'}
    >
      {/* Explanatory copy is desktop-only — on a 384px phone it doubles the
          banner height for no extra meaning the icons don't already convey. */}
      <p className="hidden sm:block text-sm text-muted-foreground">
        {isRu
          ? 'Доступен переход в служебный кабинет. Главная остаётся открытой.'
          : 'Service cabinet is available. The main view remains open.'}
      </p>
      <div className="flex flex-1 items-center gap-1.5 sm:flex-initial sm:flex-wrap sm:gap-2">
        {links.map(({ to, labelEn, labelRu, icon: Icon }) => (
          <Button
            key={to}
            variant="secondary"
            size="sm"
            asChild
            // flex-1 on mobile keeps both workspace buttons on a single row
            // and stops them from wrapping into two stacked rectangles.
            className="flex-1 gap-1.5 min-w-0 sm:flex-initial"
          >
            <Link to={to} className="truncate">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{isRu ? labelRu : labelEn}</span>
            </Link>
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={() => setDismissed(true)}
          title={isRu ? 'Скрыть до конца сессии' : 'Dismiss for this session'}
          aria-label={isRu ? 'Скрыть' : 'Dismiss'}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
