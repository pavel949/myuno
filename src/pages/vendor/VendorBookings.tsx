import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorBookings } from '@/hooks/useVendor';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { BookingStatusTimeline, BookingStatusTimelineSkeleton } from '@/components/bookings/BookingStatusTimeline';
import { useBookingStatusHistory } from '@/hooks/useBookingStatusHistory';

/**
 * Inline status-history block for a single vendor booking.
 * Subscribes to the master `booking_status_history` table via the booking_id
 * link on `vendor_bookings`. Renders only when expanded so we don't open
 * a realtime channel per row by default.
 */
function VendorBookingHistory({
  masterBookingId,
  currentStatus,
  createdAt,
  isRussian,
}: {
  masterBookingId: string | null | undefined;
  currentStatus: string;
  createdAt: string;
  isRussian: boolean;
}) {
  const { events, isLoading, highlightIds } = useBookingStatusHistory({
    table: 'booking_status_history',
    bookingId: masterBookingId ?? undefined,
    enabled: !!masterBookingId,
  });

  if (!masterBookingId) {
    return (
      <p className="text-xs text-muted-foreground">
        {isRussian ? 'История недоступна' : 'No history available'}
      </p>
    );
  }

  if (isLoading) {
    return <BookingStatusTimelineSkeleton rows={3} compact />;
  }

  return (
    <BookingStatusTimeline
      events={events}
      currentStatus={currentStatus}
      createdAt={createdAt}
      highlightIds={highlightIds}
      compact
    />
  );
}

const VendorBookings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { bookings, isLoading: bookingsLoading, updateBookingStatus, refetch } = useVendorBookings(profile?.id);
  
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const handleAction = async () => {
    if (!selectedBooking || !actionType) return;
    
    setIsUpdating(true);
    try {
      const newStatus = actionType === 'confirm' ? 'confirmed' : 'cancelled';
      const { error } = await updateBookingStatus(selectedBooking, newStatus);
      
      if (error) throw error;
      
      toast.success(
        isRussian 
          ? (actionType === 'confirm' ? 'Бронирование подтверждено' : 'Бронирование отменено')
          : (actionType === 'confirm' ? 'Booking confirmed' : 'Booking cancelled')
      );
      
      setSelectedBooking(null);
      setActionType(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(isRussian ? 'Ошибка при обновлении' : 'Error updating booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{isRussian ? 'Ожидает' : 'Pending'}</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20">{isRussian ? 'Подтверждено' : 'Confirmed'}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">{isRussian ? 'Завершено' : 'Completed'}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{isRussian ? 'Отменено' : 'Cancelled'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!profile) return null;

  return (
    <PageContainer>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-2 xs:grid-cols-4 w-full">
            <TabsTrigger value="all">{isRussian ? 'Все' : 'All'}</TabsTrigger>
            <TabsTrigger value="pending">{isRussian ? 'Новые' : 'New'}</TabsTrigger>
            <TabsTrigger value="confirmed">{isRussian ? 'Активные' : 'Active'}</TabsTrigger>
            <TabsTrigger value="completed">{isRussian ? 'Готовые' : 'Done'}</TabsTrigger>
          </TabsList>
        </Tabs>

        {bookingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет бронирований' : 'No bookings'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Бронирования появятся здесь' : 'Bookings will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{booking.customer_name || 'Customer'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.service?.name || isRussian ? 'Услуга' : 'Service'}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.scheduled_at
                          ? format(new Date(booking.scheduled_at), 'dd MMMM yyyy', {
                              locale: isRussian ? ru : undefined,
                            })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.scheduled_at
                          ? format(new Date(booking.scheduled_at), 'HH:mm')
                          : '-'}
                        {booking.duration_minutes && ` (${booking.duration_minutes} ${isRussian ? 'мин' : 'min'})`}
                      </span>
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${booking.customer_phone}`} className="text-primary">
                          {booking.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-lg font-bold">{booking.amount.toLocaleString()} ₽</p>
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'Ваш доход:' : 'Your earnings:'} {booking.net_amount.toLocaleString()} ₽
                      </p>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => {
                            setSelectedBooking(booking.id);
                            setActionType('cancel');
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => {
                            setSelectedBooking(booking.id);
                            setActionType('confirm');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {isRussian ? 'Принять' : 'Accept'}
                        </Button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {isRussian ? 'Завершить' : 'Complete'}
                      </Button>
                    )}
                  </div>

                  {/* Status history toggle */}
                  <div className="mt-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistory((prev) => ({
                          ...prev,
                          [booking.id]: !prev[booking.id],
                        }))
                      }
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      aria-expanded={!!expandedHistory[booking.id]}
                    >
                      <History className="h-3.5 w-3.5" />
                      {isRussian ? 'История статусов' : 'Status history'}
                      {expandedHistory[booking.id] ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {expandedHistory[booking.id] && (
                      <div className="mt-3">
                        <VendorBookingHistory
                          masterBookingId={(booking as { booking_id?: string | null }).booking_id ?? null}
                          currentStatus={booking.status}
                          createdAt={booking.created_at}
                          isRussian={isRussian}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={!!selectedBooking && !!actionType} onOpenChange={() => {
          setSelectedBooking(null);
          setActionType(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'confirm' 
                  ? (isRussian ? 'Подтвердить бронирование?' : 'Confirm booking?')
                  : (isRussian ? 'Отменить бронирование?' : 'Cancel booking?')}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'confirm'
                  ? (isRussian ? 'Клиент получит уведомление о подтверждении.' : 'Customer will be notified about confirmation.')
                  : (isRussian ? 'Клиент получит уведомление об отмене.' : 'Customer will be notified about cancellation.')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBooking(null);
                  setActionType(null);
                }}
              >
                {isRussian ? 'Назад' : 'Back'}
              </Button>
              <Button
                variant={actionType === 'cancel' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {actionType === 'confirm' 
                  ? (isRussian ? 'Подтвердить' : 'Confirm')
                  : (isRussian ? 'Отменить' : 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorBookings;
