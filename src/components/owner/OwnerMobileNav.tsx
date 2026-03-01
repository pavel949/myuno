import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  DollarSign,
  Grid3X3,
  Plus,
  Camera,
  CalendarPlus,
  Receipt,
  Phone,
  StickyNote,
  BedDouble,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface NavItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const NAV_LEFT: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Home', labelRu: 'Главная', path: '/owner' },
  { id: 'finance', icon: DollarSign, labelEn: 'Finance', labelRu: 'Финансы', path: '/owner/finance' },
];

const NAV_RIGHT: NavItem[] = [
  { id: 'properties', icon: Building2, labelEn: 'Properties', labelRu: 'Объекты', path: '/mc/properties' },
  { id: 'mc', icon: Grid3X3, labelEn: 'MC', labelRu: 'УК', path: '/mc' },
];

interface QuickAction {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'booking', icon: BedDouble, labelEn: 'Add Booking', labelRu: 'Добавить бронь', path: '/mc/calendar', color: 'bg-emerald-500' },
  { id: 'expense', icon: Receipt, labelEn: 'Add Expense', labelRu: 'Записать расход', path: '/mc/quick-expense', color: 'bg-amber-500' },
  { id: 'task', icon: CalendarPlus, labelEn: 'Create Task', labelRu: 'Создать задачу', path: '/mc/tasks', color: 'bg-purple-500' },
  { id: 'photo', icon: Camera, labelEn: 'Inspection', labelRu: 'Инспекция', path: '/mc/inspection', color: 'bg-blue-500' },
  { id: 'message', icon: Phone, labelEn: 'Messages', labelRu: 'Сообщения', path: '/mc/messages', color: 'bg-pink-500' },
  { id: 'note', icon: StickyNote, labelEn: 'Quick Note', labelRu: 'Заметка', path: '/mc/tasks?type=note', color: 'bg-teal-500' },
];

export function OwnerMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/owner') return location.pathname === '/owner' || location.pathname === '/owner/';
    return location.pathname.startsWith(path);
  };

  const handleAction = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className={cn(
          "flex flex-col items-center justify-center h-full gap-0.5 transition-all flex-1",
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
  };

  return (
    <>
      {/* Overlay + Quick Actions Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            {/* Actions grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute bottom-24 left-4 right-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-background rounded-2xl p-4 shadow-2xl border border-border/50">
                <div className="grid grid-cols-3 gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action.path)}
                        className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all"
                      >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white", action.color)}>
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                          {isRu ? action.labelRu : action.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom shadow-[0_-2px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center h-[68px] px-1">
          {/* Left items */}
          {NAV_LEFT.map(renderNavItem)}

          {/* Center + button */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "w-14 h-14 -mt-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-4 border-background",
                menuOpen
                  ? "bg-foreground text-background rotate-45"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right items */}
          {NAV_RIGHT.map(renderNavItem)}
        </div>
      </nav>
    </>
  );
}
