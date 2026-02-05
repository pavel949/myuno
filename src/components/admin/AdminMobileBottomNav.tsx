import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface NavItem {
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
}

const mainItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', labelRu: 'Дашборд', path: '/admin' },
  { icon: Package, label: 'Catalog', labelRu: 'Каталог', path: '/admin/catalog' },
  { icon: Layers, label: 'Operations', labelRu: 'Операции', path: '/admin/operations' },
];

const moreItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'AI Agents', labelRu: 'AI Агенты', path: '/admin/ai-agents' },
  { icon: Package, label: 'Intake', labelRu: 'Приём', path: '/admin/intake' },
  { icon: Layers, label: 'Taxonomy', labelRu: 'Таксономии', path: '/admin/taxonomy' },
  { icon: LayoutDashboard, label: 'LifeOS', labelRu: 'LifeOS', path: '/admin/life-situations' },
  { icon: Layers, label: 'Control', labelRu: 'Управление', path: '/admin/control' },
];

export function AdminMobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreItems.some(item => isActive(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[64px] min-h-[48px] rounded-xl transition-all",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium">
                {isRussian ? item.labelRu : item.label}
              </span>
            </button>
          );
        })}

        {/* More button with Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[64px] min-h-[48px] rounded-xl transition-all",
                isMoreActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "text-primary")} />
              <span className="text-[10px] font-medium">
                {isRussian ? 'Ещё' : 'More'}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{isRussian ? 'Больше разделов' : 'More Sections'}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8 grid grid-cols-3 gap-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all min-h-[80px]",
                      active 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">
                      {isRussian ? item.labelRu : item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
