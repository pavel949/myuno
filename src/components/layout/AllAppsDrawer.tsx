import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickTriplet } from '@/lib/ecosystemGlossary';
import { useCategories } from '@/hooks/useCategories';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_ROUTES } from '@/lib/config/routes';
import { Compass, Construction } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveNavRole } from '@/lib/nav/navigationModel';
import { useLiveClusterCatalog, isClusterVisibleToUser } from '@/lib/nav/clusterCatalog';
import { ServiceClusterAccordion } from '@/components/nav/ServiceClusterAccordion';

interface AllAppsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllAppsDrawer({ open, onOpenChange }: AllAppsDrawerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const byCategoryTitle = pickTriplet(
    { ru: 'По направлениям', en: 'By category', th: 'ตามหมวด' },
    language
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { personas } = useUserPersonas();
  const { flatCategories } = useCategories();

  const role = resolveNavRole({
    activeRole: (user?.user_metadata as { role?: string } | undefined)?.role ?? null,
    pathname: location.pathname,
  });

  const audienceCtx = useMemo(() => ({ personas, role }), [personas, role]);
  const { catalog: liveCatalog } = useLiveClusterCatalog();
  const visibleClusters = useMemo(
    () => liveCatalog.filter((c) => isClusterVisibleToUser(c, audienceCtx)),
    [liveCatalog, audienceCtx],
  );

  const miniApps = flatCategories
    .filter((c) => c.hasMiniApp && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAppClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleNavigatorClick = () => {
    onOpenChange(false);
    navigate(APP_ROUTES.DISCOVER);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-none h-[90vh] max-h-[90vh] flex flex-col pb-safe">
        <SheetHeader className="pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              {isRu ? 'Все сервисы' : 'All Services'}
            </SheetTitle>
            <button
              type="button"
              onClick={handleNavigatorClick}
              className="flex items-center gap-1 text-[12px] text-primary font-medium hover:underline"
            >
              <Compass className="w-3.5 h-3.5" />
              {isRu ? 'По сценариям →' : 'Browse by situation →'}
            </button>
          </div>
        </SheetHeader>
        {user && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate(APP_ROUTES.DEVELOPER_PORTAL);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-none text-left shrink-0',
              'bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors',
            )}
          >
            <div className="w-10 h-10 rounded-none bg-primary/20 flex items-center justify-center shrink-0">
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
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-6 pb-[calc(env(safe-area-inset-bottom)+80px)] pt-1">
            <ServiceClusterAccordion
              clusters={visibleClusters}
              language={language}
              onNavigate={go}
              sectionTitle={byCategoryTitle}
            />
            {miniApps.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
                  {isRu ? 'Витрина' : 'Featured'}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {miniApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleAppClick(app.path)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-none',
                          'transition-all duration-200 ',
                          'hover:bg-secondary/80',
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-none flex items-center justify-center',
                            'bg-gradient-to-br',
                            app.color || 'from-primary/20 to-primary/10',
                          )}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">
                          {isRu ? app.nameRu : app.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
