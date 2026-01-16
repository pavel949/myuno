import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffServiceOrders } from '@/hooks/useServiceOrders';
import { useStaffProfile } from '@/hooks/useStaffProfile';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Calendar,
  Star,
  AlertCircle,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive',
};

const priorityLabels = {
  low: { en: 'Low', ru: 'Низкий' },
  normal: { en: 'Normal', ru: 'Обычный' },
  high: { en: 'High', ru: 'Высокий' },
  urgent: { en: 'Urgent', ru: 'Срочно' },
};

export default function StaffDashboard() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');

  const { orders, isLoading, startOrder, completeOrder } = useStaffServiceOrders();
  const { profile, toggleAvailability } = useStaffProfile();

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Войдите для доступа к панели' : 'Please login to access dashboard'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {language === 'ru' ? 'Войти' : 'Login'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const assignedOrders = orders.filter(o => o.status === 'assigned');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');

  const handleStartOrder = async (orderId: string) => {
    await startOrder.mutateAsync(orderId);
  };

  const handleCompleteOrder = async (orderId: string) => {
    // TODO: Open modal for completion notes and photos
    await completeOrder.mutateAsync({ orderId });
  };

  return (
    <PageContainer>
      <PageHeader 
        title={language === 'ru' ? 'Панель исполнителя' : 'Staff Dashboard'} 
        showBack 
      />

      {/* Profile Status Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{profile?.display_name || user.email}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span>{profile?.avg_rating?.toFixed(1) || '0.0'}</span>
                  <span>•</span>
                  <span>{profile?.completed_tasks || 0} {language === 'ru' ? 'заданий' : 'tasks'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Доступен' : 'Available'}
              </span>
              <Switch 
                checked={profile?.is_available ?? false}
                onCheckedChange={() => toggleAvailability.mutate()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{assignedOrders.length}</div>
            <div className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Ожидают' : 'Pending'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-warning">{inProgressOrders.length}</div>
            <div className="text-sm text-muted-foreground">
              {language === 'ru' ? 'В работе' : 'In Progress'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="tasks" className="flex-1">
            <ClipboardList className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Задания' : 'Tasks'}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Календарь' : 'Calendar'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Нет активных заданий' : 'No active tasks'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
                    ? 'Новые задания появятся здесь' 
                    : 'New tasks will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* In Progress - show first */}
              {inProgressOrders.map(order => (
                <Card key={order.id} className="border-warning">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{order.order_number}</p>
                      </div>
                      <Badge className="bg-warning/20 text-warning">
                        {language === 'ru' ? 'В работе' : 'In Progress'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.property && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{language === 'ru' ? order.property.title_ru : order.property.title_en}</div>
                          <div className="text-muted-foreground">{order.property.address}</div>
                        </div>
                      </div>
                    )}
                    {order.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(order.scheduled_at), 'dd MMM, HH:mm', { 
                            locale: language === 'ru' ? ru : undefined 
                          })}
                        </span>
                      </div>
                    )}
                    {order.notes && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {order.notes}
                      </p>
                    )}
                    <Button 
                      className="w-full" 
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={completeOrder.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Завершить' : 'Complete'}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Assigned - waiting to start */}
              {assignedOrders.map(order => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{order.order_number}</p>
                      </div>
                      <Badge className={priorityColors[order.priority]}>
                        {priorityLabels[order.priority][language === 'ru' ? 'ru' : 'en']}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.property && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{language === 'ru' ? order.property.title_ru : order.property.title_en}</div>
                          <div className="text-muted-foreground">{order.property.address}</div>
                        </div>
                      </div>
                    )}
                    {order.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(order.scheduled_at), 'dd MMM, HH:mm', { 
                            locale: language === 'ru' ? ru : undefined 
                          })}
                        </span>
                      </div>
                    )}
                    {order.notes && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {order.notes}
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleStartOrder(order.id)}
                      disabled={startOrder.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Начать' : 'Start'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {language === 'ru' ? 'Календарь заданий' : 'Task Calendar'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'Скоро будет доступен просмотр заданий на календаре' 
                  : 'Calendar view coming soon'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
