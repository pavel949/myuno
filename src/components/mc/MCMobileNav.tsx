import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, Home, Calendar, ClipboardList,
  Grid3X3, Plus, Receipt, CalendarPlus, ShoppingBag, ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const MC_NAV: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Home', labelRu: 'Главная', path: APP_ROUTES.MC },
  { id: 'properties', icon: Home, labelEn: 'Objects', labelRu: 'Объекты', path: APP_ROUTES.MC_PROPERTIES },
  { id: 'calendar', icon: Calendar, labelEn: 'Calendar', labelRu: 'Календарь', path: APP_ROUTES.MC_CALENDAR },
  { id: 'tasks', icon: ClipboardList, labelEn: 'Tasks', labelRu: 'Задачи', path: APP_ROUTES.MC_TASKS },
  { id: 'more', icon: Grid3X3, labelEn: 'More', labelRu: 'Ещё', path: '/mc/modules' },
];

const QUICK_ACTIONS = [
  { id: 'expense', icon: Receipt, labelEn: 'Expense', labelRu: 'Расход', path: `${APP_ROUTES.MC_FINANCE}?action=create`, color: 'bg-destructive/15 text-destructive' },
  { id: 'task', icon: ListTodo, labelEn: 'Task', labelRu: 'Задача', path: `${APP_ROUTES.MC_TASKS}?action=create`, color: 'bg-primary/15 text-primary' },
  { id: 'meeting', icon: CalendarPlus, labelEn: 'Meeting', labelRu: 'Встреча', path: `${APP_ROUTES.MC_CALENDAR}?action=create`, color: 'bg-accent/15 text-accent-foreground' },
  { id: 'services', icon: ShoppingBag, labelEn: 'myUNO', labelRu: 'myUNO', path: APP_ROUTES.HOME, color: 'bg-success/15 text-success' },
];

export function MCMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [fabOpen, setFabOpen] = useState(false);

  // Hide on property manage pages (they have their own bottom nav)
  const isPropertyManage = /^\/mc\/properties\/[^/]+\/manage/.test(location.pathname);
  if (isPropertyManage) return null;

  const isActive = (path: string) => {
    if (path === APP_ROUTES.MC) return location.pathname === APP_ROUTES.MC || location.pathname === `${APP_ROUTES.MC}/`;
    return location.pathname.startsWith(path);
  };

  const handleQuickAction = (path: string) => {
    setFabOpen(false);
    navigate(path);
  };

  return (
    <>
      {fabOpen && (
        <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm md:hidden" onClick={() => setFabOpen(false)}>
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={(e) => { e.stopPropagation(); handleQuickAction(action.path); }}
                  className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                >
                  <span className="text-sm font-semibold text-primary-foreground bg-foreground/60 backdrop-blur rounded-full px-3 py-1.5 [box-shadow:var(--shadow-elevation-3)]">
                    {isRu ? action.labelRu : action.labelEn}
                  </span>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center [box-shadow:var(--shadow-elevation-3)]", action.color)}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setFabOpen(!fabOpen)}
        className={cn(
          "fixed z-[70] md:hidden bottom-[76px] left-1/2 -translate-x-1/2 w-14 h-14 rounded-full [box-shadow:var(--shadow-elevation-4)] flex items-center justify-center transition-all duration-200",
          fabOpen ? "bg-foreground text-background rotate-45" : "bg-primary text-primary-foreground"
        )}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom [box-shadow:0_-2px_20px_-4px_hsl(var(--foreground)/0.08)]">
        <div className="grid grid-cols-5 h-[68px] px-1">
          {MC_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 transition-all min-h-[44px]",
                  active ? "text-primary" : "text-muted-foreground/70 active:text-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-7 flex items-center justify-center rounded-full transition-all",
                  active ? "bg-primary/12 shadow-sm" : ""
                )}>
                  <Icon className={cn("h-[22px] w-[22px] transition-transform", active && "scale-105")} strokeWidth={active ? 2.4 : 1.8} />
                </div>
                <span className={cn("text-[10px] leading-tight", active ? "font-bold" : "font-medium")}>
                  {isRu ? item.labelRu : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
