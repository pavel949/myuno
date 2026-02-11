import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, UserPlus, FileText, 
  Users, Ticket, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Consolidated Quick Actions - Provider-First Strategy
// Removed direct vertical shortcuts (+ Yacht, + Property, etc.)
// All content creation now flows through: Catalog → Select Provider → ContentCreatorMenu
const QUICK_ACTIONS = [
  { 
    id: 'operations', 
    icon: FileText, 
    label: 'Operations', 
    labelRu: 'Операции', 
    href: '/admin/operations',
    variant: 'primary' as const,
  },
  { 
    id: 'intake', 
    icon: Package, 
    label: 'Intake', 
    labelRu: 'Приём', 
    href: '/admin/intake',
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
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
