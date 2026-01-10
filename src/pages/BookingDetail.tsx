import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User, Package, XCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingData {
  id: string;
  booking_type: string;
  status: string;
  scheduled_at: string | null;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  items: Array<{
    id: string;
    item_name: string | null;
    quantity: number | null;
    unit_price: number | null;
    subtotal: number | null;
  }>;
  participants: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  }>;
  addresses: Array<{
    id: string;
    address_type: string;
    address: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'submitted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'cancelled_by_user':
    case 'cancelled_by_provider': return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'in_progress': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string, language: string) => {
  const labels: Record<string, { en: string; ru: string }> = {
    draft: { en: 'Draft', ru: 'Черновик' },
    submitted: { en: 'Submitted', ru: 'Отправлено' },
    confirmed: { en: 'Confirmed', ru: 'Подтверждено' },
    in_progress: { en: 'In Progress', ru: 'В процессе' },
    completed: { en: 'Completed', ru: 'Завершено' },
    cancelled_by_user: { en: 'Cancelled', ru: 'Отменено' },
    cancelled_by_provider: { en: 'Cancelled by Provider', ru: 'Отменено провайдером' },
    expired: { en: 'Expired', ru: 'Истекло' },
  };
  return labels[status]?.[language === 'ru' ? 'ru' : 'en'] || status;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'completed': return <CheckCircle className="w-5 h-5" />;
    case 'cancelled_by_user':
    case 'cancelled_by_provider': return <XCircle className="w-5 h-5" />;
    case 'submitted':
    case 'in_progress': return <AlertCircle className="w-5 h-5" />;
    default: return <Clock className="w-5 h-5" />;
  }
};

export default function BookingDetail() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!user || !id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items(*),
          booking_participants(*),
          booking_addresses(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setBooking({
        id: data.id,
        booking_type: data.booking_type,
        status: data.status,
        scheduled_at: data.scheduled_at,
        total_amount: data.total_amount,
        currency: data.currency,
        notes: data.notes,
        created_at: data.created_at,
        items: data.booking_items || [],
        participants: data.booking_participants || [],
        addresses: data.booking_addresses || [],
      });
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  }, [user, id, language]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadBooking();
    }
  }, [user, id, loadBooking]);

  const handleCancel = async () => {
    if (!booking) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_user' })
        .eq('id', booking.id);

      if (error) throw error;

      // Add status history
      await supabase.from('booking_status_history').insert([{
        booking_id: booking.id,
        from_status: booking.status as any,
        to_status: 'cancelled_by_user' as const,
        notes: 'Cancelled by user',
      }]);

      toast.success(language === 'ru' ? 'Бронирование отменено' : 'Booking cancelled');
      setBooking({ ...booking, status: 'cancelled_by_user' });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(language === 'ru' ? 'Ошибка отмены' : 'Failed to cancel');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return format(date, 'd MMMM yyyy, HH:mm', { locale: language === 'ru' ? ru : enUS });
    } catch {
      return dateStr;
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <LoadingState />
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Бронирование не найдено' : 'Booking not found'}
          </p>
          <Button onClick={() => navigate('/bookings')} className="mt-4">
            {language === 'ru' ? 'К бронированиям' : 'Back to Bookings'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canCancel = ['submitted', 'confirmed', 'draft'].includes(booking.status);
  const primaryParticipant = booking.participants.find(p => p);
  const deliveryAddress = booking.addresses.find(a => a.address_type === 'delivery' || a.address_type === 'service');

  return (
    <AppLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/bookings')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-display font-bold">
                {language === 'ru' ? 'Детали бронирования' : 'Booking Details'}
              </h1>
              <p className="text-xs text-muted-foreground">#{booking.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-32">
          {/* Status Card */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
              </div>
              <div className="flex-1">
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusLabel(booking.status, language)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ru' ? 'Создано:' : 'Created:'} {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {booking.scheduled_at && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Дата и время' : 'Date & Time'}
              </h3>
              <p className="text-lg font-semibold">{formatDate(booking.scheduled_at)}</p>
            </div>
          )}

          {/* Items */}
          {booking.items.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Услуги / Товары' : 'Services / Items'}
              </h3>
              <div className="space-y-2">
                {booking.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.item_name} {item.quantity && item.quantity > 1 ? `×${item.quantity}` : ''}
                    </span>
                    <span className="font-medium">
                      ฿{(item.subtotal || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">{language === 'ru' ? 'Итого' : 'Total'}</span>
                  <span className="font-bold text-primary">
                    ฿{(booking.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          {primaryParticipant && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Контакт' : 'Contact'}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{primaryParticipant.name}</p>
                {primaryParticipant.phone && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    {primaryParticipant.phone}
                  </p>
                )}
                {primaryParticipant.email && (
                  <p className="text-muted-foreground">{primaryParticipant.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {deliveryAddress && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Адрес' : 'Address'}
              </h3>
              <p className="text-sm text-muted-foreground">{deliveryAddress.address}</p>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-medium mb-2">
                {language === 'ru' ? 'Примечания' : 'Notes'}
              </h3>
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {canCancel && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isCancelling}>
                  {isCancelling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {language === 'ru' ? 'Отменить бронирование' : 'Cancel Booking'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'ru' ? 'Отменить бронирование?' : 'Cancel Booking?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ru' 
                      ? 'Это действие нельзя отменить. Бронирование будет помечено как отменённое.'
                      : 'This action cannot be undone. The booking will be marked as cancelled.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ru' ? 'Нет, оставить' : 'No, keep it'}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    {language === 'ru' ? 'Да, отменить' : 'Yes, cancel'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
