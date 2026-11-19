/**
 * SideRail — universal sidebar for workspace roles (owner / vendor / admin / team).
 *
 * Replaces MCSidebar, AdminSidebar, VendorSidebar, GuestSidebar.
 * Reads SIDEBAR_NAV[role] from the SSOT navigation model.
 *
 * Visibility:
 *  - On mobile: drawer for workflows, bottom bar for primary destinations.
 *  - Mini-collapse (icons only) on tablet (768–1023px).
 *  - Full-width by default on desktop (≥1024px); collapse/expand uses the `SidebarTrigger`
 *    in `TopBar` only (avoids duplicating the toggle in this rail).
 *  - Returns null when role has no sidebar (consumer roles).
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import '@/styles/mc-workspace.css';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { useMyProperties } from '@/hooks/useMyProperties';
import {
  SIDEBAR_NAV,
  hasSidebar,
  getOwnerSidebarForRole,
  getOwnerSidebarForViewport,
  getActiveOwnerSidebarPath,
  type NavRoleKey,
  type SidebarNavGroup,
} from '@/lib/nav/navigationModel';

interface SideRailProps {
  role: NavRoleKey;
  /** Optional badge counts keyed by SidebarNavItem.badgeKey */
  badges?: Partial<Record<'tasks' | 'messages' | 'pendingContent' | 'pendingProviders', number>>;
}

export function SideRail({ role, badges }: SideRailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { role: businessRole } = useBusinessRole();
  const { allProperties } = useMyProperties();
  const labelOf = (value: { labelEn: string; labelRu: string; labelTh?: string }) => pickLang(language, { en: value.labelEn, ru: value.labelRu, th: value.labelTh });
  const isCollapsed = !isMobile && state === 'collapsed';

  if (!hasSidebar(role)) return null;

  const isOwner = role === 'owner';
  const groups: SidebarNavGroup[] = isOwner
    ? getOwnerSidebarForViewport(getOwnerSidebarForRole(businessRole, { propertyCount: allProperties?.length ?? 0 }), isMobile)
    : SIDEBAR_NAV[role];

  const ownerActivePath = isOwner ? getActiveOwnerSidebarPath(groups, location.pathname) : undefined;
  const activeDestination = groups.flatMap(group => group.items).find(item => item.path === ownerActivePath);
  const allToolsActive = location.pathname === '/mc/modules';
  const toolsLabel = pickLang(language, { en: 'All tools', ru: 'Все инструменты', th: 'เครื่องมือทั้งหมด' });
  const workspaceLabel = pickLang(language, { en: 'Management workspace', ru: 'Кабинет управления', th: 'พื้นที่จัดการ' });
  const currentDestination = activeDestination ? labelOf(activeDestination) : (allToolsActive ? toolsLabel : undefined);

  const isActive = (path: string) => {
    if (isOwner) return path === ownerActivePath;
    if (path === location.pathname) return true;
    // Treat root dashboards as exact-match to avoid every subpath highlighting them.
    if (path === '/admin' || path === '/vendor' || path === '/mc' || path === '/team') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(`${path}/`) || location.pathname === path;
  };

  const groupHasActive = (group: SidebarNavGroup) =>
    group.items.some((item) => isActive(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className={cn("border-r border-border", role === 'owner' && 'mc-workspace-sidebar')}>
      {!isCollapsed && (
        <SidebarHeader className={cn('border-b', isOwner ? 'mc-workspace-sidebar gap-1 border-sidebar-border px-4 py-4' : 'border-border/70 px-2 py-2')}>
          {isOwner ? (
            <>
              {isMobile ? (
                <>
                  <SheetTitle className="text-base font-semibold leading-tight text-sidebar-foreground">{workspaceLabel}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {pickLang(language, { en: 'Navigation for workspace tasks', ru: 'Переход к задачам кабинета', th: 'เมนูสำหรับงานในพื้นที่จัดการ' })}
                  </SheetDescription>
                </>
              ) : <p className="text-base font-semibold leading-tight">{workspaceLabel}</p>}
              {currentDestination && (
                <p className="break-words text-sm leading-snug text-muted-foreground">
                  {pickLang(language, { en: 'You are here:', ru: 'Сейчас:', th: 'หน้าปัจจุบัน:' })}{' '}
                  <span className="font-medium text-sidebar-foreground">{currentDestination}</span>
                </p>
              )}
            </>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {pickLang(language, { en: 'Navigation', ru: 'Навигация', th: 'เมนู' })}
            </span>
          )}
        </SidebarHeader>
      )}
      <SidebarContent className={cn(isOwner && 'mc-workspace-sidebar mc-rail-content gap-0 py-2')}>
        {groups.map((group) => {
          const hasCurrent = groupHasActive(group);
          const open = (!group.mobileQuickLinks && hasCurrent) || group.defaultOpen || false;
          const groupLabel = labelOf(group);
          const currentGroupLabel = isOwner && hasCurrent
            ? `${groupLabel}. ${pickLang(language, { en: 'Contains current page', ru: 'Здесь текущая страница', th: 'มีหน้าปัจจุบัน' })}`
            : undefined;
          return (
            <Collapsible key={`${group.labelEn}:${hasCurrent}:${isCollapsed}`} defaultOpen={isCollapsed || open}>
              <SidebarGroup>
                {!isCollapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel asChild
                      className={cn(
                        'flex cursor-pointer items-center justify-between transition-colors hover:text-foreground',
                        isOwner && 'gap-2',
                        isOwner && hasCurrent && 'mc-rail-current-group',
                      )}
                    >
                      <button type="button" aria-label={currentGroupLabel}>
                        <span>{groupLabel}</span>
                        {isOwner && hasCurrent && <span aria-hidden className="ml-auto size-2 shrink-0 rounded-full bg-sidebar-ring" />}
                        <ChevronDown aria-hidden className="mc-rail-chevron size-3.5 shrink-0 transition-transform" />
                      </button>
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        const label = labelOf(item);
                        const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={active}
                              aria-current={active ? (item.path === location.pathname ? 'page' : 'location') : undefined}
                              tooltip={label}
                              onClick={() => handleNavigate(item.path)}
                              className={cn(
                                'cursor-pointer h-auto min-h-10 py-2',
                                active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                                isOwner && 'mc-rail-destination min-h-11',
                              )}
                            >
                              <Icon className="size-5 shrink-0" aria-hidden />
                              <span className="min-w-0 break-words leading-snug" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}>{label}</span>
                              {badge && badge > 0 ? (
                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              ) : null}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      {isOwner && (
        <SidebarFooter className="mc-workspace-sidebar border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate('/mc/modules')}
                tooltip={toolsLabel}
                isActive={allToolsActive}
                aria-current={allToolsActive ? 'page' : undefined}
                className="mc-rail-destination h-auto min-h-11 py-2"
              >
                <LayoutGrid className="size-5 shrink-0" aria-hidden />
                <span className="min-w-0 whitespace-normal break-words">{toolsLabel}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
