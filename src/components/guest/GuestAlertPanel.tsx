import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  icon: React.ElementType;
  title: string;
  titleRu: string;
  count?: number;
  message?: string;
  messageRu?: string;
  href: string;
}

interface GuestAlertPanelProps {
  checkoutSoon?: boolean;
  daysUntilCheckout?: number;
  activeOrders: number;
  unreadMessages: number;
  loading?: boolean;
}

export function GuestAlertPanel({
  checkoutSoon = false,
  daysUntilCheckout = 0,
  activeOrders,
  unreadMessages,
  loading = false,
}: GuestAlertPanelProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const getAlertType = (count: number, urgentThreshold: number, warningThreshold: number): 'urgent' | 'warning' | 'info' => {
    if (count >= urgentThreshold) return 'urgent';
    if (count >= warningThreshold) return 'warning';
    return 'info';
  };

  const alerts: AlertItem[] = [];

  // Checkout soon alert
  if (checkoutSoon && daysUntilCheckout <= 1) {
    alerts.push({
      id: 'checkout',
      type: daysUntilCheckout === 0 ? 'urgent' : 'warning',
      icon: LogOut,
      title: daysUntilCheckout === 0 ? 'Checkout Today' : 'Checkout Tomorrow',
      titleRu: daysUntilCheckout === 0 ? 'Выезд сегодня' : 'Выезд завтра',
      message: 'Remember to complete checkout',
      messageRu: 'Не забудьте оформить выезд',
      href: '/guest/checkout',
    });
  }

  // Active orders
  if (activeOrders > 0) {
    alerts.push({
      id: 'orders',
      type: getAlertType(activeOrders, 3, 1),
      icon: ShoppingBag,
      title: 'Active Orders',
      titleRu: 'Активные заказы',
      count: activeOrders,
      href: '/guest/orders',
    });
  }

  // Unread messages
  if (unreadMessages > 0) {
    alerts.push({
      id: 'messages',
      type: getAlertType(unreadMessages, 5, 2),
      icon: MessageSquare,
      title: 'Unread Messages',
      titleRu: 'Непрочитанные',
      count: unreadMessages,
      href: '/guest/chat',
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getTypeStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'urgent':
        return 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10';
      case 'warning':
        return 'border-warning/30 bg-warning/5 hover:bg-warning/10';
      default:
        return 'border-primary/20 bg-primary/5 hover:bg-primary/10';
    }
  };

  const getIconStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'urgent':
        return 'text-destructive bg-destructive/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {isRu ? 'Всё отлично!' : 'All Good!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Нет уведомлений' : 'No notifications'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {isRu ? 'Уведомления' : 'Notifications'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {alerts.map((alert) => (
          <Button
            key={alert.id}
            variant="ghost"
            className={cn(
              "w-full justify-between h-auto py-3 px-3 border",
              getTypeStyles(alert.type)
            )}
            onClick={() => navigate(alert.href)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-full", getIconStyles(alert.type))}>
                <alert.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium block">
                  {isRu ? alert.titleRu : alert.title}
                </span>
                {alert.message && (
                  <span className="text-xs text-muted-foreground">
                    {isRu ? alert.messageRu : alert.message}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alert.count !== undefined && (
                <Badge 
                  variant={alert.type === 'urgent' ? 'destructive' : 'secondary'}
                  className="min-w-[1.5rem] justify-center"
                >
                  {alert.count}
                </Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
