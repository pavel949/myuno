import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { SupportFAB } from '@/components/chat/SupportFAB';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showSupportFAB?: boolean;
  className?: string;
  contentClassName?: string;
}

export function AppLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true,
  showSupportFAB = true,
  className,
  contentClassName,
}: AppLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {showHeader && <AppHeader title={title} />}
      
      <main
        className={cn(
          "flex-1 w-full max-w-7xl mx-auto",
          showBottomNav && "pb-20 md:pb-4",
          contentClassName
        )}
      >
        {children}
      </main>
      
      {showSupportFAB && <SupportFAB />}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
