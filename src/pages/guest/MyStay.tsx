import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestServiceOrders, CreateServiceOrderInput } from '@/hooks/useServiceOrders';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Home, 
  ClipboardList, 
  Plus,
  CheckCircle,
  XCircle,
  Sparkles,
  Car,
  ShoppingBag,
  Wrench,
  Star,
  User,
  Calendar,
  Clock,
  MessageSquare
} from 'lucide-react';
import { differenceInDays } from 'date-fns';

// New professional components
import { GuestKPICard } from '@/components/guest/GuestKPICard';
import { GuestStayCard } from '@/components/guest/GuestStayCard';
import { GuestAlertPanel } from '@/components/guest/GuestAlertPanel';
import { GuestQuickServices } from '@/components/guest/GuestQuickServices';

const serviceTypes = [
  { id: 'cleaning', icon: Sparkles, label: { en: 'Cleaning', ru: 'Уборка' }, color: 'text-info' },
  { id: 'transport', icon: Car, label: { en: 'Transport', ru: 'Транспорт' }, color: 'text-warning' },
  { id: 'delivery', icon: ShoppingBag, label: { en: 'Delivery', ru: 'Доставка' }, color: 'text-pink-500' },
  { id: 'maintenance', icon: Wrench, label: { en: 'Maintenance', ru: 'Ремонт' }, color: 'text-amber-500' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, { en: string; ru: string }> = {
  pending: { en: 'Pending', ru: 'Ожидает' },
  assigned: { en: 'Assigned', ru: 'Назначен' },
  in_progress: { en: 'In Progress', ru: 'В работе' },
  completed: { en: 'Completed', ru: 'Завершён' },
  cancelled: { en: 'Cancelled', ru: 'Отменён' },
};

export default function MyStay() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const [activeTab, setActiveTab] = useState('stay');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { activeBookings, upcomingBookings, isLoading: bookingsLoading } = useGuestPropertyBookings();
  const { 
    orders, 
    activeOrders, 
    completedOrders,
    isLoading: ordersLoading,
    createOrder,
    cancelOrder,
    rateOrder,
  } = useGuestServiceOrders();

  const currentBooking = activeBookings[0];

  // Calculate KPI data
  const kpiData = useMemo(() => {
    const daysUntilCheckout = currentBooking 
      ? Math.max(0, differenceInDays(new Date(currentBooking.check_out), new Date()))
      : 0;
    
    return {
      daysRemaining: daysUntilCheckout,
      activeOrdersCount: activeOrders.length,
      unreadMessages: 0, // TODO: integrate with chat system
      checkoutSoon: daysUntilCheckout <= 1 && currentBooking !== null,
    };
  }, [currentBooking, activeOrders]);

  // Transform booking for GuestStayCard
  const stayCardBooking = currentBooking ? {
    id: currentBooking.id,
    check_in: currentBooking.check_in,
    check_out: currentBooking.check_out,
    status: currentBooking.status,
    property: currentBooking.owner_properties ? {
      id: currentBooking.property_id,
      name_en: currentBooking.owner_properties.title,
      name_ru: currentBooking.owner_properties.title,
      address: currentBooking.owner_properties.address,
      cover_image: currentBooking.owner_properties.cover_image,
    } : undefined,
  } : null;

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 rounded-full bg-muted">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {isRu ? 'Войдите для просмотра' : 'Please login to view'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Login'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleCreateOrder = async () => {
    if (!selectedServiceType) return;

    const serviceLabel = serviceTypes.find(s => s.id === selectedServiceType)?.label;
    
    const input: CreateServiceOrderInput = {
      booking_id: currentBooking?.id,
      property_id: currentBooking?.property_id,
      service_type: selectedServiceType,
      service_name: serviceLabel?.en || selectedServiceType,
      service_name_ru: serviceLabel?.ru,
      notes: orderNotes,
    };

    await createOrder.mutateAsync(input);
    setOrderDialogOpen(false);
    setSelectedServiceType('');
    setOrderNotes('');
  };

  const handleRateOrder = async () => {
    if (!ratingOrderId) return;
    
    await rateOrder.mutateAsync({
      orderId: ratingOrderId,
      rating,
      review: reviewText,
    });
    
    setRatingDialogOpen(false);
    setRatingOrderId(null);
    setRating(5);
    setReviewText('');
  };

  const openRatingDialog = (orderId: string) => {
    setRatingOrderId(orderId);
    setRatingDialogOpen(true);
  };

  const isLoading = bookingsLoading || ordersLoading;

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Мой визит' : 'My Stay'} 
        showBack 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="stay" className="flex-1">
            <Home className="w-4 h-4 mr-2" />
            {isRu ? 'Проживание' : 'Stay'}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 relative">
            <ClipboardList className="w-4 h-4 mr-2" />
            {isRu ? 'Заказы' : 'Orders'}
            {activeOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stay" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <GuestKPICard
              title={isRu ? 'Дней осталось' : 'Days Left'}
              value={kpiData.daysRemaining}
              icon={Calendar}
              iconColor={kpiData.checkoutSoon ? 'text-warning' : 'text-primary'}
              loading={isLoading}
            />
            <GuestKPICard
              title={isRu ? 'Активные' : 'Active'}
              value={kpiData.activeOrdersCount}
              icon={Clock}
              iconColor="text-info"
              loading={isLoading}
              onClick={() => setActiveTab('orders')}
            />
            <GuestKPICard
              title={isRu ? 'Сообщения' : 'Messages'}
              value={kpiData.unreadMessages}
              icon={MessageSquare}
              iconColor="text-success"
              loading={isLoading}
              href="/guest/chat"
            />
          </div>

          {/* Alert Panel */}
          <GuestAlertPanel
            checkoutSoon={kpiData.checkoutSoon}
            daysUntilCheckout={kpiData.daysRemaining}
            activeOrders={kpiData.activeOrdersCount}
            unreadMessages={kpiData.unreadMessages}
            loading={isLoading}
          />

          {/* Current Stay Card */}
          <GuestStayCard 
            booking={stayCardBooking} 
            loading={bookingsLoading}
          />

          {/* Quick Services */}
          <GuestQuickServices />

          {/* Order Service Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                {isRu ? 'Заказать услугу' : 'Order Service'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {serviceTypes.map(service => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="ghost"
                      className="h-auto py-3 flex-col gap-1.5 hover:bg-muted"
                      onClick={() => {
                        setSelectedServiceType(service.id);
                        setOrderDialogOpen(true);
                      }}
                    >
                      <div className={`p-2 rounded-full bg-muted ${service.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">
                        {service.label[isRu ? 'ru' : 'en']}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Orders Preview */}
          {activeOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    {isRu ? 'Активные заказы' : 'Active Orders'}
                  </CardTitle>
                  <Badge variant="secondary">{activeOrders.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {activeOrders.slice(0, 2).map(order => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {isRu ? order.service_name_ru || order.service_name : order.service_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.order_number}</p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]?.[isRu ? 'ru' : 'en'] || order.status}
                    </Badge>
                  </div>
                ))}
                {activeOrders.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setActiveTab('orders')}
                  >
                    {isRu ? `Ещё ${activeOrders.length - 2} заказов` : `${activeOrders.length - 2} more orders`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && !currentBooking && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-info" />
                  {isRu ? 'Предстоящие' : 'Upcoming'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {upcomingBookings.slice(0, 2).map(booking => (
                  <GuestStayCard 
                    key={booking.id}
                    booking={{
                      id: booking.id,
                      check_in: booking.check_in,
                      check_out: booking.check_out,
                      status: booking.status,
                      property: booking.owner_properties ? {
                        id: booking.property_id,
                        name_en: booking.owner_properties.title,
                        name_ru: booking.owner_properties.title,
                        address: booking.owner_properties.address,
                        cover_image: booking.owner_properties.cover_image,
                      } : undefined,
                    }}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Button 
            className="w-full" 
            onClick={() => setOrderDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isRu ? 'Новый заказ' : 'New Order'}
          </Button>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                  <ClipboardList className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {isRu ? 'Нет заказов' : 'No Orders'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Закажите услугу, чтобы увидеть её здесь' 
                    : 'Order a service to see it here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active Orders */}
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {isRu ? 'Активные' : 'Active'}
                  </h3>
                  {activeOrders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {isRu ? order.service_name_ru || order.service_name : order.service_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{order.order_number}</p>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]?.[isRu ? 'ru' : 'en'] || order.status}
                          </Badge>
                        </div>
                        {order.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{order.notes}</p>
                        )}
                        {order.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelOrder.mutate(order.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {isRu ? 'Отменить' : 'Cancel'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {isRu ? 'Завершённые' : 'Completed'}
                  </h3>
                  {completedOrders.map(order => (
                    <Card key={order.id} className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {isRu ? order.service_name_ru || order.service_name : order.service_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{order.order_number}</p>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {statusLabels[order.status]?.[isRu ? 'ru' : 'en'] || order.status}
                          </Badge>
                        </div>
                        {order.rating ? (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < order.rating! ? 'text-warning fill-warning' : 'text-muted'}`} 
                              />
                            ))}
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRatingDialog(order.id)}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            {isRu ? 'Оценить' : 'Rate'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Новый заказ' : 'New Order'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>{isRu ? 'Тип услуги' : 'Service Type'}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {serviceTypes.map(service => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant={selectedServiceType === service.id ? 'default' : 'outline'}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setSelectedServiceType(service.id)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">
                        {service.label[isRu ? 'ru' : 'en']}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>{isRu ? 'Комментарий' : 'Notes'}</Label>
              <Textarea 
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={isRu ? 'Опишите что нужно сделать...' : 'Describe what you need...'}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleCreateOrder}
              disabled={!selectedServiceType || createOrder.isPending}
            >
              {isRu ? 'Заказать' : 'Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Оценить услугу' : 'Rate Service'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'text-warning fill-warning' : 'text-muted'}`} 
                  />
                </button>
              ))}
            </div>

            <div>
              <Label>{isRu ? 'Отзыв (необязательно)' : 'Review (optional)'}</Label>
              <Textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={isRu ? 'Поделитесь впечатлениями...' : 'Share your experience...'}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleRateOrder}
              disabled={rateOrder.isPending}
            >
              {isRu ? 'Отправить' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
