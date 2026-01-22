import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface AdminAlertPanelProps {
  pendingBookings: number;
  pendingLeads: number;
  openTickets: number;
  pendingModeration: number;
  loading?: boolean;
}

export function AdminAlertPanel({
  pendingBookings,
  pendingLeads,
  openTickets,
  pendingModeration,
  loading,
}: AdminAlertPanelProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();

  const getAlertType = (count: number, urgentThreshold: number, warningThreshold: number): 'urgent' | 'warning' | 'info' => {
    if (count > urgentThreshold) return 'urgent';
    if (count > warningThreshold) return 'warning';
    return 'info';
  };

  const alerts: AlertItem[] = [
    {
      id: 'bookings',
      type: getAlertType(pendingBookings, 5, 0),
      icon: Clock,
      title: 'Pending Bookings',
      titleRu: 'Ожидающие заказы',
      count: pendingBookings,
      href: '/admin/operations',
    },
    {
      id: 'leads',
      type: getAlertType(pendingLeads, 10, 0),
      icon: AlertTriangle,
      title: 'New Leads',
      titleRu: 'Новые лиды',
      count: pendingLeads,
      href: '/admin/leads',
    },
    {
      id: 'tickets',
      type: getAlertType(openTickets, 100, 3),
      icon: MessageSquare,
      title: 'Open Tickets',
      titleRu: 'Открытые тикеты',
      count: openTickets,
      href: '/admin/tickets',
    },
    {
      id: 'moderation',
      type: getAlertType(pendingModeration, 100, 5),
      icon: FileText,
      title: 'Pending Review',
      titleRu: 'На модерации',
      count: pendingModeration,
      href: '/admin/moderation',
    },
  ].filter(alert => alert.count > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {isRussian ? 'Требует внимания' : 'Needs Attention'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getBadgeVariant = (type: AlertItem['type']) => {
    switch (type) {
      case 'urgent':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {isRussian ? 'Требует внимания' : 'Needs Attention'}
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {alerts.reduce((sum, a) => sum + a.count, 0)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-2xl mb-1">✓</div>
            <p className="text-sm">
              {isRussian ? 'Всё в порядке!' : 'All clear!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Button
                key={alert.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between h-auto py-2.5 px-3 border",
                  getTypeStyles(alert.type)
                )}
                onClick={() => navigate(alert.href)}
              >
                <div className="flex items-center gap-2.5">
                  <alert.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isRussian ? alert.titleRu : alert.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(alert.type)} className="font-bold">
                    {alert.count}
                  </Badge>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
