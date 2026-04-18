import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_ROUTES } from '@/lib/config/routes';
import { Compass, Construction } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AllAppsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllAppsDrawer({ open, onOpenChange }: AllAppsDrawerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flatCategories } = useCategories();

  const miniApps = flatCategories
    .filter(c => c.hasMiniApp && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAppClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleNavigatorClick = () => {
    onOpenChange(false);
    navigate(APP_ROUTES.DISCOVER);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] pb-safe">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              {isRu ? 'Все сервисы' : 'All Services'}
            </SheetTitle>
            <button
              onClick={handleNavigatorClick}
              className="flex items-center gap-1 text-[12px] text-primary font-medium hover:underline"
            >
              <Compass className="w-3.5 h-3.5" />
              {isRu ? 'По сценариям →' : 'Browse by situation →'}
            </button>
          </div>
        </SheetHeader>
        {/* Mobile paths without AppHeader (showHeader=false) have no avatar menu — surface developer portal here */}
        {user && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate(APP_ROUTES.DEVELOPER_PORTAL);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl text-left',
              'bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Construction className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {isRu ? 'Портал застройщика' : 'Developer portal'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {isRu ? 'Кабинет застройщика: проекты, лиды, аналитика' : 'Projects, leads, analytics'}
              </p>
            </div>
          </button>
        )}
        <ScrollArea className="h-full max-h-[calc(70vh-80px)]">
          <div className="grid grid-cols-4 gap-3 pb-6 pt-2">
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
