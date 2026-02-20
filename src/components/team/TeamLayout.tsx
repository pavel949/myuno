import React, { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TeamSidebar } from './TeamSidebar';
import { TeamBottomNav } from './TeamBottomNav';
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
 * Team dashboard layout with sidebar navigation
 * Responsive: sidebar on desktop, bottom nav on mobile
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
      title={title || (isRu ? 'Управление недвижимостью — Команда' : 'Property Management — Team')}
    >
      <div className="flex h-[calc(100vh-64px)] overflow-x-hidden max-w-full">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <TeamSidebar className="hidden lg:flex" />
        )}
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0 min-w-0 max-w-full",
          !fullWidth && "container",
          className
        )}>
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <TeamBottomNav />
    </AppLayout>
  );
}
