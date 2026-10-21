import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BriefcaseBusiness, ChevronDown, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

interface WorkspaceLink { to: string; label: LangValues }

function readChoice(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

/**
 * Navigation only: roles/memberships still come from the existing account hook,
 * and destination routes enforce their own access. A remembered link never
 * grants access or redirects an explicit visit to the personal home.
 */
export function WorkspaceHomeBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { availableRoles, activeRole, isLoading: contextLoading } = useUserContext();
  const { isMCPortal, isLoading: ownerTypeLoading } = useOwnerType();
  const storageKey = `myuno:home-workspace:${user?.id ?? 'guest'}`;
  const [choice, setChoice] = useState(() => ({ key: storageKey, to: readChoice(storageKey) }));
  const remembered = choice.key === storageKey ? choice.to : readChoice(storageKey);
  const links: WorkspaceLink[] = [];
  const hasOwner = availableRoles.includes('owner') || availableRoles.includes('property_owner');
  if (availableRoles.includes('admin') || availableRoles.includes('property_manager') || (hasOwner && !isMCPortal)) {
    links.push({ to: APP_ROUTES.MC, label: { ru: 'Управление объектами', en: 'Property management', th: 'จัดการอสังหาริมทรัพย์' } });
  }
  if (hasOwner && isMCPortal) {
    links.push({ to: '/my-property', label: { ru: 'Кабинет собственника', en: 'Owner portal', th: 'พอร์ทัลเจ้าของ' } });
  }
  if (availableRoles.includes('vendor')) {
    links.push({ to: APP_ROUTES.VENDOR, label: { ru: 'Кабинет поставщика', en: 'Provider workspace', th: 'พื้นที่ทำงานผู้ให้บริการ' } });
  }
  if (availableRoles.includes('admin')) {
    links.push({ to: APP_ROUTES.ADMIN, label: { ru: 'Администрирование', en: 'Administration', th: 'การดูแลระบบ' } });
  }
  // Employment alone is not property-management authority.
  if (availableRoles.includes('uno_team')) {
    links.push({ to: APP_ROUTES.TEAM, label: { ru: 'Команда myUNO', en: 'myUNO team', th: 'ทีม myUNO' } });
  }
  if (availableRoles.includes('investor')) {
    links.push({ to: APP_ROUTES.INVEST_DASHBOARD, label: { ru: 'Кабинет инвестора', en: 'Investor workspace', th: 'พื้นที่ทำงานนักลงทุน' } });
  }
  if (availableRoles.includes('investor')) {
    links.push({ to: APP_ROUTES.CAPITAL, label: { ru: 'Работа с инвестиционными сделками', en: 'Capital deal workspace', th: 'พื้นที่จัดการดีลลงทุน' } });
  }
  if (!user || contextLoading || ownerTypeLoading || links.length === 0) return null;

  const activeDestination = { vendor: APP_ROUTES.VENDOR, uno_team: APP_ROUTES.TEAM, investor: APP_ROUTES.INVEST_DASHBOARD }[activeRole];
  const selected = links.find(link => link.to === remembered) ?? links.find(link => link.to === activeDestination) ?? links[0];
  const remember = (to: string) => {
    setChoice({ key: storageKey, to });
    try { localStorage.setItem(storageKey, to); } catch { /* Navigation works without persistent storage. */ }
  };
  const control = 'flex min-h-11 min-w-0 items-center justify-center gap-2 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';
  return (
    <nav aria-label={pickLang(language, { ru: 'Личное и работа', en: 'Personal and work', th: 'ส่วนตัวและงาน' })} className="mx-4 mb-1">
      <div className="grid grid-cols-2 border border-border">
        <Link to={APP_ROUTES.HOME} aria-current="page" className={`${control} bg-muted text-foreground`}>
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          {pickLang(language, { ru: 'Личное', en: 'Personal', th: 'ส่วนตัว' })}
        </Link>
        <Link to={selected.to} onClick={() => remember(selected.to)} aria-label={`${pickLang(language, { ru: 'Работа', en: 'Work', th: 'งาน' })}: ${pickLang(language, selected.label)}`} className={`${control} border-l border-border bg-primary text-primary-foreground hover:bg-primary/90`}>
          <BriefcaseBusiness className="h-4 w-4 shrink-0" aria-hidden="true" />
          {pickLang(language, { ru: 'Работа', en: 'Work', th: 'งาน' })}
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
      {links.length > 1 && (
        <details className="group border-b border-border text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-2 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 break-words">{pickLang(language, selected.label)}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs">{pickLang(language, { ru: 'Сменить', en: 'Change', th: 'เปลี่ยน' })}<ChevronDown className="h-4 w-4 group-open:rotate-180" aria-hidden="true" /></span>
          </summary>
          <ul className="pb-2">
            {links.map(link => <li key={link.to}><Link to={link.to} onClick={() => remember(link.to)} className="flex min-h-11 items-center justify-between gap-3 px-2 py-2 text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="min-w-0 break-words">{pickLang(language, link.label)}</span><ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link></li>)}
          </ul>
        </details>
      )}
    </nav>
  );
}
