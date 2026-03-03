import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, DollarSign, MoreHorizontal,
  Sparkles, Building2, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
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
  { icon: LayoutDashboard, label: 'Dashboard', labelRu: 'Обзор', path: '/admin' },
  { icon: Package, label: 'Catalog', labelRu: 'Каталог', path: '/admin/catalog' },
  { icon: Users, label: 'Users', labelRu: 'Пользователи', path: '/admin/users' },
  { icon: DollarSign, label: 'Finance', labelRu: 'Финансы', path: '/admin/finance' },
];

const moreItems: NavItem[] = [
  { icon: Sparkles, label: 'LifeOS', labelRu: 'LifeOS', path: '/admin/life-situations' },
  { icon: Building2, label: 'Partners', labelRu: 'Партнёры', path: '/admin/providers' },
  { icon: Settings, label: 'Settings', labelRu: 'Настройки', path: '/admin/settings' },
];

export function AdminMobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
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
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all",
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
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all",
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
              <DrawerTitle>{isRussian ? 'Все разделы' : 'All Sections'}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8">
              <div className="grid grid-cols-3 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all min-h-[72px]",
                        active 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium text-center leading-tight">
                        {isRussian ? item.labelRu : item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
