import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestServiceOrders, CreateServiceOrderInput } from '@/hooks/useServiceOrders';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Home, 
  ClipboardList, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Sparkles,
  Car,
  ShoppingBag,
  Wrench,
  Star,
  User,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const serviceTypes = [
  { id: 'cleaning', icon: Sparkles, label: { en: 'Cleaning', ru: 'Уборка' } },
  { id: 'transport', icon: Car, label: { en: 'Transport', ru: 'Транспорт' } },
  { id: 'delivery', icon: ShoppingBag, label: { en: 'Delivery', ru: 'Доставка' } },
  { id: 'maintenance', icon: Wrench, label: { en: 'Maintenance', ru: 'Ремонт' } },
];

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

export default function MyStay() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stay');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { activeBookings } = useAllPropertyBookings();
  const { 
    orders, 
    activeOrders, 
    completedOrders,
    isLoading,
    createOrder,
    cancelOrder,
    rateOrder,
  } = useGuestServiceOrders();

  const currentBooking = activeBookings[0]; // Get the first active booking

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <User className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Войдите для просмотра' : 'Please login to view'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {language === 'ru' ? 'Войти' : 'Login'}
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

  return (
    <PageContainer>
      <PageHeader 
        title={language === 'ru' ? 'Мой визит' : 'My Stay'} 
        showBack 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="stay" className="flex-1">
            <Home className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Проживание' : 'Stay'}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 relative">
            <ClipboardList className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Заказы' : 'Orders'}
            {activeOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stay">
          {!currentBooking ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Нет активных бронирований' : 'No Active Bookings'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ru' 
                    ? 'Забронируйте недвижимость, чтобы увидеть информацию здесь' 
                    : 'Book a property to see information here'}
                </p>
                <Button onClick={() => navigate('/property')}>
                  {language === 'ru' ? 'Найти недвижимость' : 'Find Property'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Stay Card */}
              <Card className="mb-6 border-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {language === 'ru' ? 'Текущее проживание' : 'Current Stay'}
                    </CardTitle>
                    <Badge className="bg-success/20 text-success">
                      {language === 'ru' ? 'Активно' : 'Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">
                        {currentBooking.owner_properties?.title || 'Property'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentBooking.owner_properties?.address}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm">
                        {format(new Date(currentBooking.check_in), 'dd MMM', { locale: language === 'ru' ? ru : undefined })}
                        {' — '}
                        {format(new Date(currentBooking.check_out), 'dd MMM yyyy', { locale: language === 'ru' ? ru : undefined })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {differenceInDays(new Date(currentBooking.check_out), new Date())} {language === 'ru' ? 'дней до выезда' : 'days until checkout'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Links */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate(`/guest/guidebook/${currentBooking.property_id}`)}
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm">
                    {language === 'ru' ? 'Гайд по объекту' : 'Property Guide'}
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate(`/guest/check-in/${currentBooking.id}`)}
                >
                  <FileCheck className="w-6 h-6" />
                  <span className="text-sm">
                    {language === 'ru' ? 'Онлайн чек-ин' : 'Online Check-in'}
                  </span>
                </Button>
              </div>

              {/* Quick Actions */}
              <h3 className="font-semibold mb-3">
                {language === 'ru' ? 'Заказать услугу' : 'Order Service'}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {serviceTypes.map(service => {
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => {
                        setSelectedServiceType(service.id);
                        setOrderDialogOpen(true);
                      }}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm">
                        {service.label[language === 'ru' ? 'ru' : 'en']}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Active Orders Preview */}
              {activeOrders.length > 0 && (
                <>
                  <h3 className="font-semibold mb-3">
                    {language === 'ru' ? 'Активные заказы' : 'Active Orders'}
                  </h3>
                  {activeOrders.slice(0, 2).map(order => (
                    <Card key={order.id} className="mb-3">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{order.order_number}</div>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status][language === 'ru' ? 'ru' : 'en']}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {activeOrders.length > 2 && (
                    <Button 
                      variant="link" 
                      className="w-full"
                      onClick={() => setActiveTab('orders')}
                    >
                      {language === 'ru' ? `Ещё ${activeOrders.length - 2} заказов` : `${activeOrders.length - 2} more orders`}
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Button 
            className="w-full" 
            onClick={() => setOrderDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Новый заказ' : 'New Order'}
          </Button>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ru' ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'Нет заказов' : 'No Orders'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' 
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
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {language === 'ru' ? 'Активные' : 'Active'}
                  </h3>
                  {activeOrders.map(order => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">
                              {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{order.order_number}</div>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status][language === 'ru' ? 'ru' : 'en']}
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
                            {language === 'ru' ? 'Отменить' : 'Cancel'}
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
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {language === 'ru' ? 'Завершённые' : 'Completed'}
                  </h3>
                  {completedOrders.map(order => (
                    <Card key={order.id} className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">
                              {language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{order.order_number}</div>
                          </div>
                          <Badge className={statusColors[order.status]}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {statusLabels[order.status][language === 'ru' ? 'ru' : 'en']}
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
                            {language === 'ru' ? 'Оценить' : 'Rate'}
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
              {language === 'ru' ? 'Новый заказ' : 'New Order'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ru' ? 'Тип услуги' : 'Service Type'}</Label>
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
                        {service.label[language === 'ru' ? 'ru' : 'en']}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>{language === 'ru' ? 'Комментарий' : 'Notes'}</Label>
              <Textarea 
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={language === 'ru' ? 'Опишите что нужно сделать...' : 'Describe what you need...'}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleCreateOrder}
              disabled={!selectedServiceType || createOrder.isPending}
            >
              {language === 'ru' ? 'Заказать' : 'Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Оценить услугу' : 'Rate Service'}
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
              <Label>{language === 'ru' ? 'Отзыв (необязательно)' : 'Review (optional)'}</Label>
              <Textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={language === 'ru' ? 'Поделитесь впечатлениями...' : 'Share your experience...'}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleRateOrder}
              disabled={rateOrder.isPending}
            >
              {language === 'ru' ? 'Отправить' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
