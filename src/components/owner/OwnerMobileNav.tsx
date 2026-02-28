import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  ClipboardList,
  MessageSquare,
  Grid3X3,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const PM_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Home', labelRu: 'Главная', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Objects', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'tasks', icon: ClipboardList, labelEn: 'Tasks', labelRu: 'Задачи', path: '/owner/tasks' },
  { id: 'more', icon: Grid3X3, labelEn: 'More', labelRu: 'Ещё', path: '/owner/modules' },
];

const SALES_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Home', labelRu: 'Главная', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Objects', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'messages', icon: MessageSquare, labelEn: 'Chat', labelRu: 'Чат', path: '/owner/messages' },
  { id: 'more', icon: Grid3X3, labelEn: 'More', labelRu: 'Ещё', path: '/owner/modules' },
];

const DEFAULT_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Home', labelRu: 'Главная', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Objects', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'finance', icon: DollarSign, labelEn: 'Finance', labelRu: 'Финансы', path: '/owner/finance' },
  { id: 'more', icon: Grid3X3, labelEn: 'More', labelRu: 'Ещё', path: '/owner/modules' },
];

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  property_manager: PM_NAV,
  sales_agent: SALES_NAV,
  service_provider: PM_NAV,
  general: DEFAULT_NAV,
};

export function OwnerMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { role } = useBusinessRole();
  const isRu = language === 'ru';

  const navItems = NAV_BY_ROLE[role] || DEFAULT_NAV;

  const isActive = (path: string) => {
    if (path === '/owner') {
      return location.pathname === '/owner' || location.pathname === '/owner/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom shadow-[0_-2px_20px_-4px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-5 h-[68px] px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-0.5 transition-all",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground/70 active:text-foreground"
              )}
            >
              <div className={cn(
                "w-10 h-7 flex items-center justify-center rounded-full transition-all",
                active 
                  ? "bg-primary/12 shadow-sm" 
                  : ""
              )}>
                <Icon 
                  className={cn("h-[22px] w-[22px] transition-transform", active && "scale-105")} 
                  strokeWidth={active ? 2.4 : 1.8} 
                />
              </div>
              <span className={cn(
                "text-[10px] leading-tight",
                active ? "font-bold" : "font-medium"
              )}>
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
