/**
 * AppDrawer — left-side full-app launcher.
 *
 * Purpose (Phase 1 of nav refactor):
 *  - Secondary navigation surface that exposes the FULL platform map in
 *    one tap from any consumer screen, without crowding the 5-slot
 *    bottom-bar or top header.
 *  - Reads from SSOT (`navigationModel.ts` + `NavigatorPage` clusters)
 *    so adding a new app/route never requires editing the drawer.
 *
 * Composition (top → bottom):
 *  1. Header        — avatar, name, current active role, "Switch role" CTA
 *  2. Quick actions — 3-5 contextual shortcuts based on persona stack
 *  3. Clusters      — Arrive · Live · Enjoy · Manage · Invest · Legal · Build
 *                     (collapsible accordion, each lists services)
 *  4. Workspace     — only when role has a sidebar (owner/vendor/admin/team)
 *  5. Footer        — Settings · Language · Logout
 *
 * Trigger: hamburger icon in HomeTopBar (mobile + tablet). Hidden on
 * desktop where SideRail / TopBar pills already give full coverage.
 */
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, ChevronRight, LogOut, Settings, Globe, Repeat,
  Home as HomeIcon, Compass, Building2, TrendingUp,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  resolveNavRole, hasSidebar, SIDEBAR_NAV, type NavRoleKey,
} from '@/lib/nav/navigationModel';
import { CLUSTER_CATALOG } from '@/lib/nav/clusterCatalog';
import { ROLE_META } from '@/lib/roleBlend';
import type { UserPersona } from '@/hooks/useUserPersonas';

// ─────────────────────────────────────────────────────────────
// Quick actions — contextual based on persona stack
// ─────────────────────────────────────────────────────────────

interface QuickAction {
  labelEn: string;
  labelRu: string;
  path: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

function getQuickActions(personas: UserPersona[]): QuickAction[] {
  const actions: QuickAction[] = [];
  const has = (p: UserPersona) => personas.includes(p);

  if (has('owner' as UserPersona)) {
    actions.push({
      labelEn: 'My property',  labelRu: 'Мой объект',
      path: '/my-property', icon: Building2,
    });
  }
  if (has('investor' as UserPersona)) {
    actions.push({
      labelEn: 'New developments', labelRu: 'Новостройки',
      path: '/newbuilds', icon: TrendingUp,
    });
  }
  if (has('tourist' as UserPersona) || has('resident' as UserPersona) || personas.length === 0) {
    actions.push({
      labelEn: 'Find a service', labelRu: 'Найти услугу',
      path: APP_ROUTES.DISCOVER, icon: Compass,
    });
  }

  // Always-on fallbacks (cap at 4)
  if (actions.length < 4) {
    actions.push({
      labelEn: 'My bookings', labelRu: 'Мои бронирования',
      path: '/bookings', icon: HomeIcon,
    });
  }
  return actions.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persona stack from useUserPersonas — drives quick actions. */
  personas?: UserPersona[];
  /** Optional: open the role-switch sheet from header. */
  onSwitchRole?: () => void;
}

export function AppDrawer({
  open,
  onOpenChange,
  personas = [],
  onSwitchRole,
}: AppDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isRu = language === 'ru';

  const role: NavRoleKey = resolveNavRole({
    activeRole: (user?.user_metadata as { role?: string } | undefined)?.role ?? null,
    pathname: location.pathname,
  });
  const workspaceGroups = hasSidebar(role) ? SIDEBAR_NAV[role] : [];
  const quickActions = useMemo(() => getQuickActions(personas), [personas]);

  const initials = (user?.user_metadata?.full_name as string | undefined)
    ?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email
    ?? (isRu ? 'Гость' : 'Guest');

  const primaryPersona = personas[0];
  const personaMeta = primaryPersona ? ROLE_META[primaryPersona] : undefined;

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const toggleLang = () => setLanguage(isRu ? 'en' : 'ru');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[88vw] max-w-[380px] p-0 flex flex-col bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{isRu ? 'Меню приложения' : 'App menu'}</SheetTitle>
        </SheetHeader>

        {/* 1. Header — user + role */}
        <div className="px-5 pt-5 pb-4 border-b border-border/60">
          <button
            type="button"
            onClick={() => go(APP_ROUTES.ACCOUNT)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center font-display text-[14px] font-semibold text-foreground shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(var(--bg-elevated)) 0%, hsl(var(--bg-surface)) 100%)' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-foreground truncate">
                {displayName}
              </div>
              {personaMeta && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: personaMeta.color }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {isRu ? personaMeta.labelRu : personaMeta.label}
                  </span>
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {onSwitchRole && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 h-9 gap-2 text-[12px] font-medium"
              onClick={() => {
                onOpenChange(false);
                onSwitchRole();
              }}
            >
              <Repeat className="w-3.5 h-3.5" />
              {isRu ? 'Переключить роль' : 'Switch role'}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-5">
            {/* 2. Quick actions */}
            {quickActions.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {isRu ? 'Для меня сейчас' : 'For me now'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.path}
                        onClick={() => go(a.path)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]',
                          'bg-[hsl(var(--bg-elevated))] border border-border/40',
                          'text-left transition-colors hover:border-primary/40 hover:bg-primary/5',
                        )}
                      >
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-[12px] font-medium text-foreground line-clamp-2 leading-tight">
                          {isRu ? a.labelRu : a.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Clusters — accordion */}
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                {isRu ? 'Все сервисы' : 'All services'}
              </h3>
              <Accordion type="multiple" className="w-full">
                {CLUSTER_CATALOG.map((cluster) => {
                  const Icon = cluster.icon;
                  // Drawer hides "soon" items — keep launcher purely actionable
                  const links = cluster.services.filter((s) => s.status !== 'soon');
                  if (links.length === 0) return null;
                  return (
                    <AccordionItem
                      key={cluster.id}
                      value={cluster.id}
                      className="border-b border-border/40"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: cluster.color + '1A' }}
                          >
                            <Icon className="w-4 h-4" style={{ color: cluster.color }} />
                          </div>
                          <span className="text-[13px] font-semibold text-foreground">
                            {isRu ? cluster.labelRu : cluster.labelEn}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 ml-auto mr-2">
                            {links.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pl-11">
                        <div className="flex flex-col gap-0.5">
                          {links.map((link) => (
                            <button
                              key={`${cluster.id}-${link.path}-${link.labelEn}`}
                              onClick={() => go(link.path)}
                              className="text-left text-[13px] text-muted-foreground hover:text-foreground py-2 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                            >
                              <span>{isRu ? link.labelRu : link.labelEn}</span>
                              {link.status === 'pro' && (
                                <span className="text-[8px] font-bold px-1.5 py-px rounded-full bg-amber-500/15 text-amber-500">
                                  PRO
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </section>

            {/* 4. Workspace */}
            {workspaceGroups.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {isRu ? 'Рабочее пространство' : 'Workspace'}
                </h3>
                <div className="space-y-1">
                  {workspaceGroups.flatMap((group) =>
                    group.items.slice(0, 4).map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => go(item.path)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors text-left"
                        >
                          <ItemIcon className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                          <span className="text-[13px] text-foreground truncate">
                            {isRu ? item.labelRu : item.labelEn}
                          </span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>

        {/* 5. Footer */}
        <div className="border-t border-border/60 px-3 py-3 flex items-center justify-between gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-9 text-[12px]"
            onClick={toggleLang}
          >
            <Globe className="w-3.5 h-3.5" />
            {isRu ? 'EN' : 'RU'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-9 text-[12px]"
            onClick={() => go('/account?tab=settings')}
          >
            <Settings className="w-3.5 h-3.5" />
            {isRu ? 'Настройки' : 'Settings'}
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-9 text-[12px] text-destructive hover:text-destructive"
              onClick={async () => {
                onOpenChange(false);
                await signOut();
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              {isRu ? 'Выйти' : 'Logout'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { Menu as AppDrawerTriggerIcon };
