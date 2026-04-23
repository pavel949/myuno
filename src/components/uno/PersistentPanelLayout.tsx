/**
 * PersistentPanelLayout — Desktop context panel system
 * 
 * Provides a main content area with an optional right context panel.
 * Panel only renders on lg+ breakpoints; on mobile/tablet, content is full-width.
 * 
 * Usage:
 *   <PersistentPanelLayout
 *     rightPanel={selectedItem ? <DetailView item={selectedItem} /> : null}
 *     rightPanelTitle="Details"
 *     onCloseRightPanel={() => setSelected(null)}
 *   >
 *     <MainContent />
 *   </PersistentPanelLayout>
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-desktop';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface PersistentPanelLayoutProps {
  children: ReactNode;
  /** Content for the right context panel. If null/undefined, panel is hidden. */
  rightPanel?: ReactNode | null;
  /** Title shown at top of right panel */
  rightPanelTitle?: string;
  /** Callback to close the right panel */
  onCloseRightPanel?: () => void;
  /** Width class for the right panel (default: w-[360px]) */
  rightPanelWidth?: string;
  className?: string;
}

export function PersistentPanelLayout({
  children,
  rightPanel,
  rightPanelTitle,
  onCloseRightPanel,
  rightPanelWidth = 'w-[360px]',
  className,
}: PersistentPanelLayoutProps) {
  const isDesktop = useIsDesktop();
  const showPanel = isDesktop && !!rightPanel;

  return (
    <div className={cn("flex gap-0", className)}>
      {/* Main content — shrinks when panel is open */}
      <div className={cn(
        "flex-1 min-w-0 transition-all duration-200",
        showPanel && "lg:pr-4"
      )}>
        {children}
      </div>

      {/* Right context panel — desktop only */}
      {showPanel && (
        <RightContextPanel
          title={rightPanelTitle}
          onClose={onCloseRightPanel}
          width={rightPanelWidth}
        >
          {rightPanel}
        </RightContextPanel>
      )}
    </div>
  );
}

/**
 * RightContextPanel — Persistent side panel for item details, actions, etc.
 * Renders as a sticky, scrollable column on the right side.
 */
interface RightContextPanelProps {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  width?: string;
  className?: string;
}

export function RightContextPanel({
  children,
  title,
  onClose,
  width = 'w-[360px]',
  className,
}: RightContextPanelProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col shrink-0",
        "border-l bg-card/50 rounded-none border",
        "sticky top-16 max-h-[calc(100vh-5rem)] overflow-hidden",
        width,
        "animate-in slide-in-from-right-4 duration-200",
        className
      )}
    >
      {/* Panel header */}
      {(title || onClose) && (
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          {title && (
            <h3 className="text-sm font-semibold truncate">{title}</h3>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Panel body — independent scroll */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {children}
        </div>
      </ScrollArea>
    </aside>
  );
}

/**
 * PanelSection — A titled section within a context panel
 */
interface PanelSectionProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  actions,
  children,
  className,
}: PanelSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        {actions}
      </div>
      {children}
    </div>
  );
}
