import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminServiceOrders } from '@/hooks/useServiceOrders';
import { useAllStaffProfiles } from '@/hooks/useStaffProfile';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ClipboardList, 
  UserCheck, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MapPin,
  Star,
  User,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels = {
  pending: { en: 'Pending', ru: 'Ожидает' },
  assigned: { en: 'Assigned', ru: 'Назначен' },
  in_progress: { en: 'In Progress', ru: 'В работе' },
  completed: { en: 'Completed', ru: 'Завершён' },
  cancelled: { en: 'Cancelled', ru: 'Отменён' },
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/20 text-info',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/20 text-destructive',
};

export default function OperationsHub() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  const { 
    orders, 
    pendingOrders, 
    assignedOrders, 
    inProgressOrders,
    isLoading,
    assignOrder,
  } = useAdminServiceOrders();

  const { availableStaff } = useAllStaffProfiles();

  const handleAssign = async () => {
    if (!selectedOrder || !selectedStaff) return;
    
    await assignOrder.mutateAsync({ orderId: selectedOrder, staffId: selectedStaff });
    setAssignDialogOpen(false);
    setSelectedOrder(null);
    setSelectedStaff('');
  };

  const openAssignDialog = (orderId: string) => {
    setSelectedOrder(orderId);
    setAssignDialogOpen(true);
  };

  const renderOrderCard = (order: typeof orders[0], showAssignButton = false) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{order.order_number}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColors[order.priority]}>
              {order.priority === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
              {order.priority}
            </Badge>
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status][language === 'ru' ? 'ru' : 'en']}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.property && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{order.property.title}</div>
              <div className="text-muted-foreground">{order.property.address}</div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm">
          {order.scheduled_at && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(new Date(order.scheduled_at), 'dd MMM, HH:mm', { 
                  locale: language === 'ru' ? ru : undefined 
                })}
              </span>
            </div>
          )}
          {order.amount && (
            <div className="font-medium">
              {order.amount.toLocaleString()} {order.currency}
            </div>
          )}
        </div>

        {order.notes && (
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {order.notes}
          </p>
        )}

        {showAssignButton && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => openAssignDialog(order.id)}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Назначить исполнителя' : 'Assign Staff'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <PageHeader 
        title={language === 'ru' ? 'Центр операций' : 'Operations Hub'} 
        showBack 
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{pendingOrders.length}</div>
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Ожидают' : 'Pending'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-info">{assignedOrders.length}</div>
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Назначены' : 'Assigned'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{inProgressOrders.length}</div>
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'В работе' : 'In Progress'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Staff */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {language === 'ru' ? 'Доступные исполнители' : 'Available Staff'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Нет доступных исполнителей' : 'No available staff'}
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableStaff.map(staff => (
                <div 
                  key={staff.id}
                  className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{staff.display_name}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    <span className="text-xs">{staff.avg_rating?.toFixed(1) || '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="pending" className="flex-1 relative">
            <AlertCircle className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Новые' : 'New'}
            {pendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex-1">
            <UserCheck className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Назначены' : 'Assigned'}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1">
            <Clock className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'В работе' : 'Active'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Нет новых заказов' : 'No pending orders'}
                </h3>
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map(order => renderOrderCard(order, true))
          )}
        </TabsContent>

        <TabsContent value="assigned">
          {assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ru' ? 'Нет назначенных заказов' : 'No assigned orders'}
              </CardContent>
            </Card>
          ) : (
            assignedOrders.map(order => renderOrderCard(order))
          )}
        </TabsContent>

        <TabsContent value="in_progress">
          {inProgressOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {language === 'ru' ? 'Нет заказов в работе' : 'No orders in progress'}
              </CardContent>
            </Card>
          ) : (
            inProgressOrders.map(order => renderOrderCard(order))
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Назначить исполнителя' : 'Assign Staff Member'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ru' ? 'Выберите исполнителя' : 'Select staff member'} />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map(staff => (
                  <SelectItem key={staff.id} value={staff.user_id}>
                    <div className="flex items-center gap-2">
                      <span>{staff.display_name}</span>
                      <div className="flex items-center gap-0.5 text-muted-foreground">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span className="text-xs">{staff.avg_rating?.toFixed(1) || '0'}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedStaff || assignOrder.isPending}
            >
              {language === 'ru' ? 'Назначить' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
