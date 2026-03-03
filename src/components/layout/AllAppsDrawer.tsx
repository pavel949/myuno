import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AllAppsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllAppsDrawer({ open, onOpenChange }: AllAppsDrawerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { flatCategories } = useCategories();

  // Get all mini-app categories
  const miniApps = flatCategories
    .filter(c => c.hasMiniApp && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAppClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold">
            {isRu ? 'Все сервисы' : 'All Services'}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full max-h-[calc(70vh-80px)]">
          <div className="grid grid-cols-4 gap-3 pb-6">
            {miniApps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.path)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                    "transition-all duration-200 active:scale-95",
                    "hover:bg-secondary/80"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br", app.color || "from-primary/20 to-primary/10"
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                    {isRu ? app.nameRu : app.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
