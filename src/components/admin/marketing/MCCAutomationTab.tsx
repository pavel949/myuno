import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Zap, 
  Mail, 
  MessageSquare, 
  Bell,
  Clock,
  Target,
  Users,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';

export function MCCAutomationTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Mock automation rules
  const automationRules = [
    {
      id: '1',
      name: isRu ? 'Welcome Email серия' : 'Welcome Email Series',
      description: isRu ? 'Автоматическая серия из 5 писем для новых пользователей' : 'Automated 5-email series for new users',
      trigger: 'signup',
      actions: ['email', 'push'],
      isActive: true,
      executions: 892,
      lastRun: '2 min ago',
    },
    {
      id: '2',
      name: isRu ? 'Брошенная корзина' : 'Cart Abandonment',
      description: isRu ? 'WhatsApp напоминание через 1 час после оставления корзины' : 'WhatsApp reminder 1 hour after cart abandonment',
      trigger: 'cart_abandoned',
      actions: ['whatsapp', 'email'],
      isActive: true,
      executions: 234,
      lastRun: '15 min ago',
    },
    {
      id: '3',
      name: isRu ? 'Горячий лид алерт' : 'Hot Lead Alert',
      description: isRu ? 'Уведомление команды при score > 80' : 'Notify team when lead score > 80',
      trigger: 'lead_scored',
      actions: ['notification', 'slack'],
      isActive: true,
      executions: 127,
      lastRun: '1 hour ago',
    },
    {
      id: '4',
      name: isRu ? 'Реактивация неактивных' : 'Dormant User Reactivation',
      description: isRu ? 'Email + push для пользователей неактивных 30+ дней' : 'Email + push for users inactive 30+ days',
      trigger: 'user_inactive',
      actions: ['email', 'push'],
      isActive: false,
      executions: 456,
      lastRun: '3 days ago',
    },
    {
      id: '5',
      name: isRu ? 'Post-booking follow-up' : 'Post-booking Follow-up',
      description: isRu ? 'Запрос отзыва через 24 часа после бронирования' : 'Review request 24 hours after booking',
      trigger: 'booking_completed',
      actions: ['email', 'whatsapp'],
      isActive: true,
      executions: 678,
      lastRun: '30 min ago',
    },
  ];

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'signup': return Users;
      case 'cart_abandoned': return Target;
      case 'lead_scored': return Zap;
      case 'user_inactive': return Clock;
      case 'booking_completed': return Target;
      default: return Zap;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'push': return Bell;
      case 'notification': return Bell;
      default: return Zap;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isRu ? 'Автоматизация' : 'Automation'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Правила и триггеры для автоматических действий' : 'Rules and triggers for automated actions'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Новое правило' : 'New Rule'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{automationRules.filter(r => r.isActive).length}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Активных правил' : 'Active Rules'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">2,387</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Выполнено сегодня' : 'Executed Today'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">98.5%</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Успешность' : 'Success Rate'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">1.2s</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Среднее время' : 'Avg Response'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {automationRules.map((rule) => {
          const TriggerIcon = getTriggerIcon(rule.trigger);
          
          return (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${rule.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <TriggerIcon className={`h-5 w-5 ${rule.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? (isRu ? 'Активно' : 'Active') : (isRu ? 'Выкл' : 'Disabled')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>{isRu ? 'Триггер:' : 'Trigger:'}</span>
                          <Badge variant="outline" className="text-xs">{rule.trigger}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{isRu ? 'Действия:' : 'Actions:'}</span>
                          {rule.actions.map((action, idx) => {
                            const ActionIcon = getActionIcon(action);
                            return (
                              <ActionIcon key={idx} className="h-4 w-4" />
                            );
                          })}
                        </div>
                        <span>{rule.executions.toLocaleString()} {isRu ? 'выполнений' : 'executions'}</span>
                        <span>{isRu ? 'Последний:' : 'Last:'} {rule.lastRun}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.isActive} />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isRu ? 'Быстрые шаблоны' : 'Quick Templates'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-xs">{isRu ? 'Onboarding серия' : 'Onboarding Series'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Target className="h-6 w-6 mb-2" />
              <span className="text-xs">{isRu ? 'Lead nurturing' : 'Lead Nurturing'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-xs">{isRu ? 'Реактивация' : 'Reactivation'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Zap className="h-6 w-6 mb-2" />
              <span className="text-xs">{isRu ? 'Event-based' : 'Event-based'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
