import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, MessageCircle, KanbanSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const MOBILE_ITEMS = [
  { path: '/capital', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { path: '/capital/contacts', label: 'Контакты', icon: Users },
  { path: '/capital/campaigns', label: 'Кампании', icon: Megaphone },
  { path: '/capital/outreach', label: 'Касания', icon: MessageCircle },
  { path: '/capital/pipeline', label: 'Воронка', icon: KanbanSquare },
];

export function CapitalMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.path, item.end);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
