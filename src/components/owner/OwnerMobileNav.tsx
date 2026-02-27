import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessRole } from '@/hooks/useBusinessRole';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Role-adaptive mobile bottom navigation (max 4 items per memory constraint).
 */

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const PM_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Properties', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'tasks', icon: ClipboardList, labelEn: 'Tasks', labelRu: 'Задачи', path: '/owner/tasks' },
];

const SALES_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Properties', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'messages', icon: MessageSquare, labelEn: 'Messages', labelRu: 'Сообщения', path: '/owner/messages' },
];

const DEFAULT_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор', path: '/owner' },
  { id: 'properties', icon: Home, labelEn: 'Properties', labelRu: 'Объекты', path: '/owner/properties' },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: '/owner/calendar' },
  { id: 'messages', icon: MessageSquare, labelEn: 'Messages', labelRu: 'Сообщения', path: '/owner/messages' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden safe-area-bottom">
      <div className="grid grid-cols-4 h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                active && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
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
