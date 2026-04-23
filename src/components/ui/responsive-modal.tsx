/**
 * ResponsiveModal — Airbnb-style adaptive modal.
 * Mobile: bottom Sheet with rounded-none top corners.
 * Desktop (≥768px): large centered Dialog with premium styling.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-desktop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-5xl',
  full: 'sm:max-w-[90vw]',
};

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Dialog size on desktop */
  size?: ModalSize;
  /** Icon element shown next to title */
  icon?: React.ReactNode;
  /** Content */
  children: React.ReactNode;
  /** Footer buttons */
  footer?: React.ReactNode;
  /** Additional class for the content wrapper */
  className?: string;
  /** Mobile sheet height */
  mobileHeight?: string;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  icon,
  children,
  footer,
  className,
  mobileHeight = 'max-h-[85vh]',
}: ResponsiveModalProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            SIZE_CLASSES[size],
            'p-0 gap-0 overflow-hidden rounded-none border-border/60',
            'max-h-[90vh] flex flex-col',
            className,
          )}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/40">
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex items-center gap-3 text-xl font-display font-bold tracking-tight">
                {icon && (
                  <div className="w-10 h-10 rounded-none bg-primary/8 flex items-center justify-center shrink-0 ring-1 ring-primary/10 shadow-sm">
                    {icon}
                  </div>
                )}
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground pl-0">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <ScrollArea className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="px-6 py-5 space-y-5">
              {children}
            </div>
          </ScrollArea>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-border/40 bg-muted/30">
              <DialogFooter className="sm:justify-end gap-2">
                {footer}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: bottom sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-none p-0 flex flex-col overflow-hidden',
          mobileHeight,
          className,
        )}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border/40">
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="flex items-center gap-2.5 text-lg font-display font-bold">
              {icon && (
                <div className="w-9 h-9 rounded-none bg-primary/8 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
                  {icon}
                </div>
              )}
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-sm text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-4">
            {children}
          </div>
        </ScrollArea>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 px-4 py-3 border-t border-border/40 bg-background pb-safe">
            <SheetFooter className="gap-2">
              {footer}
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Re-export sub-components for convenience
export { DialogClose as ModalClose, SheetClose as ModalSheetClose };
