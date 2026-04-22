import React, { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TeamSidebar } from './TeamSidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TeamLayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Team dashboard layout with dedicated sidebar (not global `SideRail`).
 * Mobile: primary nav is the app `BottomBar` from `NavShell` (see `TEAM_NAV`).
 * Tablet/desktop: `TeamSidebar` from `md` (aligned with other workspace sidebars).
 */
export function TeamLayout({ 
  children, 
  title,
  showSidebar = true,
  fullWidth = false,
  className,
}: TeamLayoutProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout
      variant="workspace"
      navRole="team"
      usePageContainer={false}
      showFooter={false}
      title={title || (isRu ? 'Управление недвижимостью — Команда' : 'Property Management — Team')}
    >
      <div className="flex h-[calc(100vh-64px)] overflow-x-hidden max-w-[100vw]">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <TeamSidebar className="hidden md:flex" />
        )}
        
        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full",
            "pb-20 lg:pb-4",
            !fullWidth && "container",
            className
          )}
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 5rem)',
          }}
        >
          {children}
        </main>
      </div>
    </AppLayout>
  );
}
