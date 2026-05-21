/**
 * NavShell — top-level layout wrapper for any route.
 *
 * Composes TopBar + SideRail + BottomBar + ContextualFAB based on role.
 * Handles safe-area padding and bottom-bar offset so feature layouts can
 * focus on content. Replaces the duplicated chrome inside AppLayout,
 * MCLayout, AdminLayout, VendorLayout, GuestLayout.
 *
 * Usage:
 *   <NavShell role="owner"><MCDashboardPage /></NavShell>
 */
import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TopBar } from './TopBar';
import { SideRail } from './SideRail';
import { BottomBar } from './BottomBar';
import { ContextualFAB } from './ContextualFAB';
import { NavShellContext } from './NavShellContext';
import {
  hasSidebar,
  hasFab,
  resolveNavRole,
  type NavRoleKey,
} from '@/lib/nav/navigationModel';
import { canvasFromPath } from '@/types/canvas';

interface NavShellProps {
  /** Optional explicit role; otherwise resolved from auth + URL. */
  role?: NavRoleKey;
  /** Resolution inputs when `role` is omitted. */
  activeRole?: string | null;
  isMCPortal?: boolean;
  /** Page chrome */
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
  /** Badge counts forwarded to SideRail. */
  badges?: Partial<Record<'tasks' | 'messages' | 'pendingContent' | 'pendingProviders', number>>;
  children: ReactNode;
}

const FULLSCREEN_PREFIXES = ['/auth', '/checkout', '/cart'];

export function NavShell({
  role,
  activeRole,
  isMCPortal,
  title,
  showHeader = true,
  showBottomNav = true,
  className,
  contentClassName,
  badges,
  children,
}: NavShellProps) {
  const location = useLocation();
  const resolvedRole: NavRoleKey =
    role ?? resolveNavRole({ activeRole, isMCPortal, pathname: location.pathname });
  const canvas = canvasFromPath(location.pathname);

  const isFullscreen = FULLSCREEN_PREFIXES.some((p) =>
    location.pathname.startsWith(p),
  );
  const sidebarVisible = hasSidebar(resolvedRole);
  const renderBottomBar = showBottomNav && !isFullscreen;
  const renderFab = !isFullscreen && hasFab(resolvedRole);
  const renderHeader = showHeader && !isFullscreen;

  // Workspace shell: SidebarProvider + SideRail + Inset main.
  if (sidebarVisible) {
    return (
      <NavShellContext.Provider value={{ active: true }}>
        <SidebarProvider>
          <div data-canvas={canvas} className={cn('flex min-h-screen w-full bg-background', className)}>
            <SideRail role={resolvedRole} badges={badges} />
            <SidebarInset className="flex min-w-0 flex-1 flex-col">
              {renderHeader && <TopBar role={resolvedRole} title={title} />}
              <main
                className={cn(
                  'flex-1 w-full',
                  renderBottomBar && 'pb-24 md:pb-4',
                  contentClassName,
                )}
              >
                {children}
              </main>
              {renderBottomBar && <BottomBar role={resolvedRole} />}
              {renderFab && <ContextualFAB role={resolvedRole} />}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </NavShellContext.Provider>
    );
  }

  // Consumer shell: no sidebar, just header + content + bottom-bar.
  return (
    <NavShellContext.Provider value={{ active: true }}>
      <div data-canvas={canvas} className={cn('flex min-h-screen flex-col bg-background', className)}>
        {renderHeader && <TopBar role={resolvedRole} title={title} />}
        <main
          className={cn(
            'flex-1 w-full',
            renderBottomBar && 'pb-24 md:pb-4',
            contentClassName,
          )}
        >
          {children}
        </main>
        {renderBottomBar && <BottomBar role={resolvedRole} />}
        {renderFab && <ContextualFAB role={resolvedRole} />}
      </div>
    </NavShellContext.Provider>
  );
}
