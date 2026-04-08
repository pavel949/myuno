import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Package, 
  BarChart3, 
  Wallet, 
  MessageSquare,
  Settings,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { 
    id: 'bookings',
    icon: Calendar, 
    title: 'Bookings', 
    titleRu: 'Заказы',
    href: '/vendor/bookings',
    color: 'text-info'
  },
  { 
    id: 'services',
    icon: Package, 
    title: 'Services', 
    titleRu: 'Услуги',
    href: '/vendor/services',
    color: 'text-success'
  },
  { 
    id: 'analytics',
    icon: BarChart3, 
    title: 'Analytics', 
    titleRu: 'Аналитика',
    href: '/vendor/analytics',
    color: 'text-accent-purple'
  },
  { 
    id: 'payouts',
    icon: Wallet, 
    title: 'Payouts', 
    titleRu: 'Выплаты',
    href: '/vendor/payouts',
    color: 'text-warning'
  },
  { 
    id: 'messages',
    icon: MessageSquare, 
    title: 'Messages', 
    titleRu: 'Сообщения',
    href: '/vendor/messages',
    color: 'text-coral'
  },
  { 
    id: 'settings',
    icon: Settings, 
    title: 'Settings', 
    titleRu: 'Настройки',
    href: '/vendor/settings',
    color: 'text-muted-foreground'
  },
];

export function VendorQuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          {isRu ? 'Быстрые действия' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className="h-auto flex-col gap-1.5 py-3 hover:bg-muted"
              onClick={() => navigate(action.href)}
            >
              <div className={cn(
                "p-2 rounded-full bg-muted",
                action.color
              )}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">
                {isRu ? action.titleRu : action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
