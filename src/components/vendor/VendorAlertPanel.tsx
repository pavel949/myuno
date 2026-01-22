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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  icon: React.ElementType;
  title: string;
  titleRu: string;
  count: number;
  href: string;
}

interface VendorAlertPanelProps {
  newOrders: number;
  pendingConfirmation: number;
  unreadMessages: number;
  loading?: boolean;
}

export function VendorAlertPanel({
  newOrders,
  pendingConfirmation,
  unreadMessages,
  loading = false,
}: VendorAlertPanelProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const getAlertType = (count: number, urgentThreshold: number, warningThreshold: number): 'urgent' | 'warning' | 'info' => {
    if (count >= urgentThreshold) return 'urgent';
    if (count >= warningThreshold) return 'warning';
    return 'info';
  };

  const alerts: AlertItem[] = [
    {
      id: 'new-orders',
      type: getAlertType(newOrders, 5, 2),
      icon: ShoppingBag,
      title: 'New Orders',
      titleRu: 'Новые заказы',
      count: newOrders,
      href: '/vendor/bookings',
    },
    {
      id: 'pending',
      type: getAlertType(pendingConfirmation, 3, 1),
      icon: Clock,
      title: 'Pending Confirmation',
      titleRu: 'Ожидают подтверждения',
      count: pendingConfirmation,
      href: '/vendor/bookings?status=pending',
    },
    {
      id: 'messages',
      type: getAlertType(unreadMessages, 5, 2),
      icon: MessageSquare,
      title: 'Unread Messages',
      titleRu: 'Непрочитанные',
      count: unreadMessages,
      href: '/vendor/messages',
    },
  ].filter(alert => alert.count > 0);

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
                {isRu ? 'Всё под контролем!' : 'All Clear!'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Нет срочных задач' : 'No urgent tasks'}
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
          {isRu ? 'Требует внимания' : 'Needs Attention'}
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
              <span className="text-sm font-medium">
                {isRu ? alert.titleRu : alert.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={alert.type === 'urgent' ? 'destructive' : 'secondary'}
                className="min-w-[1.5rem] justify-center"
              >
                {alert.count}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
