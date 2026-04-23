import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GitBranch, ArrowRight, Users, TrendingUp, Clock } from 'lucide-react';

export function MCCFunnelsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Mock funnels
  const funnels = [
    {
      id: '1',
      name: isRu ? 'Привлечение новых пользователей' : 'New User Acquisition',
      type: 'acquisition',
      isActive: true,
      stages: [
        { name: isRu ? 'Показы' : 'Impressions', count: 45000, rate: 100 },
        { name: isRu ? 'Клики' : 'Clicks', count: 3200, rate: 7.1 },
        { name: isRu ? 'Лендинг' : 'Landing', count: 2800, rate: 87.5 },
        { name: isRu ? 'Регистрация' : 'Signup', count: 892, rate: 31.8 },
        { name: isRu ? 'Активация' : 'Activation', count: 654, rate: 73.3 },
      ],
      conversionRate: 1.45,
      avgTime: '2.3 days',
    },
    {
      id: '2',
      name: isRu ? 'Воронка бронирования' : 'Booking Funnel',
      type: 'activation',
      isActive: true,
      stages: [
        { name: isRu ? 'Просмотр' : 'View', count: 12000, rate: 100 },
        { name: isRu ? 'Детали' : 'Details', count: 4500, rate: 37.5 },
        { name: isRu ? 'Корзина' : 'Cart', count: 1200, rate: 26.7 },
        { name: isRu ? 'Оплата' : 'Payment', count: 890, rate: 74.2 },
        { name: isRu ? 'Подтверждение' : 'Confirmed', count: 780, rate: 87.6 },
      ],
      conversionRate: 6.5,
      avgTime: '45 min',
    },
    {
      id: '3',
      name: isRu ? 'Реактивация' : 'Reactivation',
      type: 'retention',
      isActive: false,
      stages: [
        { name: isRu ? 'Неактивные' : 'Dormant', count: 2500, rate: 100 },
        { name: isRu ? 'Email отправлен' : 'Email Sent', count: 2500, rate: 100 },
        { name: isRu ? 'Открыто' : 'Opened', count: 625, rate: 25 },
        { name: isRu ? 'Возврат' : 'Returned', count: 187, rate: 30 },
      ],
      conversionRate: 7.5,
      avgTime: '5 days',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Воронки конверсии' : 'Conversion Funnels'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Визуализируйте и оптимизируйте путь пользователя' : 'Visualize and optimize user journeys'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Создать воронку' : 'Create Funnel'}
        </Button>
      </div>

      {/* Funnels */}
      <div className="space-y-6">
        {funnels.map((funnel) => (
          <Card key={funnel.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-primary/10">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{funnel.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={funnel.isActive ? 'default' : 'secondary'}>
                        {funnel.isActive ? (isRu ? 'Активна' : 'Active') : (isRu ? 'Черновик' : 'Draft')}
                      </Badge>
                      <Badge variant="outline">{funnel.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{isRu ? 'Конверсия' : 'CVR'}</span>
                    </div>
                    <p className="font-bold text-lg">{funnel.conversionRate}%</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{isRu ? 'Время' : 'Avg Time'}</span>
                    </div>
                    <p className="font-bold text-lg">{funnel.avgTime}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Funnel Visualization */}
              <div className="flex items-center gap-2 overflow-x-auto py-4">
                {funnel.stages.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <div 
                      className="flex-shrink-0 p-4 rounded-none bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/20 text-center min-w-[120px]"
                      style={{ 
                        opacity: 0.5 + (stage.rate / 200),
                      }}
                    >
                      <p className="text-xs text-muted-foreground mb-1">{stage.name}</p>
                      <p className="text-xl font-bold">{stage.count.toLocaleString()}</p>
                      <p className="text-xs text-primary font-medium">{stage.rate}%</p>
                    </div>
                    {idx < funnel.stages.length - 1 && (
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {((funnel.stages[idx + 1].count / stage.count) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  {isRu ? 'Редактировать' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm">
                  {isRu ? 'Аналитика' : 'Analytics'}
                </Button>
                <Button variant="outline" size="sm">
                  {isRu ? 'A/B Тест' : 'A/B Test'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
