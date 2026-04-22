/**
 * SideRail — universal sidebar for workspace roles (owner / vendor / admin / team).
 *
 * Replaces MCSidebar, AdminSidebar, VendorSidebar, GuestSidebar.
 * Reads SIDEBAR_NAV[role] from the SSOT navigation model.
 *
 * Visibility:
 *  - Hidden on mobile (<768px) — bottom-bar handles primary nav.
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
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { useMyProperties } from '@/hooks/useMyProperties';
import {
  SIDEBAR_NAV,
  hasSidebar,
  getOwnerSidebarForRole,
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
  const isRussian = language === 'ru';
  const isCollapsed = !isMobile && state === 'collapsed';

  if (!hasSidebar(role)) return null;

  const groups: SidebarNavGroup[] = role === 'owner'
    ? getOwnerSidebarForRole(businessRole, { propertyCount: allProperties?.length ?? 0 })
    : SIDEBAR_NAV[role];

  const isActive = (path: string) => {
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
    <Sidebar collapsible="icon" className="border-r border-border">
      {!isCollapsed && (
        <SidebarHeader className="border-b border-border/70 px-2 py-2">
          <div className="flex items-center">
            <span className="text-xs font-medium text-muted-foreground">
              {isRussian ? 'Навигация' : 'Navigation'}
            </span>
          </div>
        </SidebarHeader>
      )}
      <SidebarContent>
        {groups.map((group) => {
          const open = groupHasActive(group) || group.defaultOpen || false;
          return (
            <Collapsible key={group.labelEn} defaultOpen={open}>
              <SidebarGroup>
                {!isCollapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors"
                    >
                      <span>{isRussian ? group.labelRu : group.labelEn}</span>
                      <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=closed]:-rotate-90" />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        const label = isRussian ? item.labelRu : item.labelEn;
                        const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={active}
                              tooltip={label}
                              onClick={() => handleNavigate(item.path)}
                              className={cn(
                                'cursor-pointer',
                                active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                              )}
                            >
                              <Icon className="size-5 shrink-0" />
                              <span className="truncate">{label}</span>
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
      <SidebarRail />
    </Sidebar>
  );
}
