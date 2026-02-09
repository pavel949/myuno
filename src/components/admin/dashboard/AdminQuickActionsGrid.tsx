import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, UserPlus, FileText, 
  BarChart3, Users, DollarSign, Ticket,
  MessageSquare, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Consolidated Quick Actions - Provider-First Strategy
// Removed direct vertical shortcuts (+ Yacht, + Property, etc.)
// All content creation now flows through: Catalog → Select Provider → ContentCreatorMenu
const QUICK_ACTIONS = [
  { 
    id: 'moderation', 
    icon: FileText, 
    label: 'Moderation', 
    labelRu: 'Модерация', 
    href: '/admin/moderation',
    variant: 'primary' as const,
  },
  { 
    id: 'leads', 
    icon: MessageSquare, 
    label: 'Leads', 
    labelRu: 'Лиды', 
    href: '/admin/leads',
    variant: 'primary' as const,
  },
  { 
    id: 'add-provider', 
    icon: UserPlus, 
    label: 'Add Provider', 
    labelRu: '+ Провайдер', 
    href: '/admin/providers?action=new',
  },
  { 
    id: 'catalog', 
    icon: Package, 
    label: 'Catalog', 
    labelRu: 'Каталог', 
    href: '/admin/catalog',
  },
  { 
    id: 'analytics', 
    icon: BarChart3, 
    label: 'Analytics', 
    labelRu: 'Аналитика', 
    href: '/admin/analytics',
  },
  { 
    id: 'finance', 
    icon: DollarSign, 
    label: 'Finance', 
    labelRu: 'Финансы', 
    href: '/admin/finance',
  },
  { 
    id: 'tickets', 
    icon: Ticket, 
    label: 'Tickets', 
    labelRu: 'Тикеты', 
    href: '/admin/tickets',
  },
  { 
    id: 'team', 
    icon: Users, 
    label: 'Team', 
    labelRu: 'Команда', 
    href: '/admin/uno-team',
  },
];

export function AdminQuickActionsGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">
          {isRu ? 'Быстрые действия' : 'Quick Actions'}
        </h3>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isPrimary = action.variant === 'primary';
          
          return (
            <Button
              key={action.id}
              variant={isPrimary ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-auto py-2.5 lg:py-2 px-2 flex flex-col lg:flex-row items-center gap-1.5 lg:gap-2",
                "lg:justify-start",
                isPrimary && "bg-primary hover:bg-primary/90"
              )}
              onClick={() => navigate(action.href)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[10px] lg:text-xs font-medium leading-tight text-center lg:text-left">
                {isRu ? action.labelRu : action.label}
              </span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
