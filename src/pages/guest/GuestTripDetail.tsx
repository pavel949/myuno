import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, isPast, isFuture, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  MapPin, Calendar, Users, Clock, Phone, MessageCircle,
  Wifi, Key, Car, AlertTriangle, CheckCircle2, Home,
  ChevronRight, ExternalLink, Copy, Loader2, Star, XCircle,
  ShieldCheck
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TripServicesGrid } from '@/components/property/TripServicesGrid';
import { MessageHostButton } from '@/components/property/MessageHostButton';
import { WriteReviewModal } from '@/components/reviews/WriteReviewModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PropertyBooking {
  id: string;
  order_number: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  deposit_amount: number;
  status: string;
  currency: string;
  created_at: string;
  properties: {
    id: string;
    title: string;
    title_ru: string;
    address: string;
    district: string;
    images: string[];
    check_in_time: string;
    check_out_time: string;
    check_in_instructions: string;
    check_in_instructions_ru: string;
    wifi_network: string;
    wifi_password: string;
    key_handover: string;
    manager_name: string;
    manager_phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    house_rules: string;
    house_rules_ru: string;
  };
}

export default function GuestTripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['guest-booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          *,
          properties!property_id (
            id, title, title_ru, address, district, images,
            check_in_time, check_out_time, check_in_instructions, check_in_instructions_ru,
            wifi_network, wifi_password, key_handover,
            manager_name, manager_phone, emergency_contact_name, emergency_contact_phone,
            house_rules, house_rules_ru
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as PropertyBooking;
    },
    enabled: !!id && !!user,
  });

  if (!user) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRu ? 'Войдите для просмотра' : 'Sign in to View'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isRu ? 'Авторизуйтесь чтобы увидеть детали бронирования' : 'Please sign in to see booking details'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRu ? 'Бронирование не найдено' : 'Booking Not Found'}
          </h2>
          <Button variant="outline" onClick={() => navigate('/bookings')}>
            {isRu ? 'К списку бронирований' : 'Back to Bookings'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const property = booking.properties;
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = differenceInDays(checkOut, checkIn);
  
  // Trip timeline status
  const now = new Date();
  const tripStatus = isPast(checkOut) ? 'completed' : isToday(checkIn) || (isPast(checkIn) && isFuture(checkOut)) ? 'active' : 'upcoming';
  const daysUntilCheckIn = differenceInDays(checkIn, now);
  const showCheckInDetails = daysUntilCheckIn <= 1 || tripStatus === 'active';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRu ? `${label} скопировано` : `${label} copied`);
  };

  const statusBadge = {
    upcoming: { label: isRu ? 'Предстоящая' : 'Upcoming', variant: 'default' as const },
    active: { label: isRu ? 'Сейчас' : 'Active', variant: 'default' as const, className: 'bg-success' },
    completed: { label: isRu ? 'Завершена' : 'Completed', variant: 'secondary' as const },
  }[tripStatus];

  return (
    <AppLayout showBottomNav={false}>
      <PageHeader 
        title={isRu ? 'Моя поездка' : 'My Trip'}
        showBack
        fallbackPath="/bookings"
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Property Hero */}
        <Card className="overflow-hidden">
          {property?.images?.[0] && (
            <div className="aspect-video relative">
              <img
                src={property.images[0]}
                alt={isRu ? property.title_ru : property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge {...statusBadge} className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
          )}
          <CardContent className="p-4">
            <h2 className="font-bold text-lg mb-1">
              {isRu ? property?.title_ru : property?.title}
            </h2>
            {property?.address && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {property.address}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>#{booking.order_number}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Guests */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isRu ? 'Заезд' : 'Check-in'}
                </p>
                <p className="font-semibold">
                  {format(checkIn, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isRu ? 'с' : 'from'} {property?.check_in_time || '14:00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isRu ? 'Выезд' : 'Check-out'}
                </p>
                <p className="font-semibold">
                  {format(checkOut, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isRu ? 'до' : 'by'} {property?.check_out_time || '12:00'}
                </p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {nights} {isRu ? 'ночей' : 'nights'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {booking.guests_count} {isRu ? 'гостей' : 'guests'}
                </span>
              </div>
              <span className="font-bold">
                {formatPrice(booking.total_amount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Details - shown 24h before or during stay */}
        {showCheckInDetails && (
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                {isRu ? 'Информация для заезда' : 'Check-in Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* WiFi */}
              {(property?.wifi_network || property?.wifi_password) && (
                <div className="p-3 bg-muted/50 rounded-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">WiFi</span>
                  </div>
                  {property.wifi_network && (
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{isRu ? 'Сеть' : 'Network'}:</span>
                      <button
                        onClick={() => copyToClipboard(property.wifi_network, 'WiFi')}
                        className="flex items-center gap-1 font-mono hover:text-primary"
                      >
                        {property.wifi_network}
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {property.wifi_password && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isRu ? 'Пароль' : 'Password'}:</span>
                      <button
                        onClick={() => copyToClipboard(property.wifi_password, 'Password')}
                        className="flex items-center gap-1 font-mono hover:text-primary"
                      >
                        {property.wifi_password}
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Check-in instructions */}
              {(property?.check_in_instructions || property?.check_in_instructions_ru) && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {isRu ? 'Инструкции' : 'Instructions'}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {isRu ? (property.check_in_instructions_ru || property.check_in_instructions) : property.check_in_instructions}
                  </p>
                </div>
              )}

              {/* Key handover */}
              {property?.key_handover && (
                <div className="flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {property.key_handover === 'in_person' && (isRu ? 'Личная встреча с менеджером' : 'In-person meet with manager')}
                    {property.key_handover === 'lockbox' && (isRu ? 'Сейф с кодом' : 'Lockbox with code')}
                    {property.key_handover === 'doorman' && (isRu ? 'У консьержа/охраны' : 'Doorman/Security')}
                    {property.key_handover === 'self_service' && (isRu ? 'Умный замок' : 'Smart lock')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Host */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {isRu ? 'Контакты' : 'Contact'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {property?.manager_phone && (
              <a
                href={`tel:${property.manager_phone}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-none hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {property.manager_name || (isRu ? 'Менеджер' : 'Manager')}
                  </p>
                  <p className="text-xs text-muted-foreground">{property.manager_phone}</p>
                </div>
                <Phone className="w-5 h-5 text-primary" />
              </a>
            )}

            <MessageHostButton
              propertyId={property?.id || ''}
              propertyTitle={isRu ? property?.title_ru : property?.title}
              labelRu="Написать хозяину"
              labelEn="Message host"
              variant="outline"
              fullWidth
            />

            {property?.emergency_contact_phone && (
              <a
                href={`tel:${property.emergency_contact_phone}`}
                className="flex items-center justify-between p-3 border border-destructive/30 bg-destructive/5 rounded-none"
              >
                <div>
                  <p className="font-medium text-sm text-destructive">
                    {isRu ? 'Экстренный контакт' : 'Emergency'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {property.emergency_contact_name || property.emergency_contact_phone}
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </a>
            )}
          </CardContent>
        </Card>

        {/* House Rules */}
        {(property?.house_rules || property?.house_rules_ru) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {isRu ? 'Правила дома' : 'House Rules'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {isRu ? (property.house_rules_ru || property.house_rules) : property.house_rules}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cross-sell Services */}
        {tripStatus === 'upcoming' && (
          <TripServicesGrid
            variant="full"
            maxItems={6}
            bookingId={booking.id}
            propertyId={property?.id}
          />
        )}

        {/* Leave Review CTA — shown after checkout */}
        {tripStatus === 'completed' && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {isRu ? 'Как прошла поездка?' : 'How was your stay?'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {isRu
                      ? 'Ваш отзыв поможет другим гостям и хозяину улучшить сервис.'
                      : 'Your review helps other guests and the host improve their service.'}
                  </p>
                  <Button size="sm" onClick={() => setIsReviewOpen(true)}>
                    <Star className="w-4 h-4 mr-1" />
                    {isRu ? 'Оставить отзыв' : 'Leave a Review'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Booking — shown for upcoming bookings */}
        {tripStatus === 'upcoming' && booking.status !== 'cancelled' && (
          <Card>
            <CardContent className="p-4">
              {/* Cancellation Policy */}
              <div className="flex items-start gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-0.5">
                    {isRu ? 'Политика отмены' : 'Cancellation Policy'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu
                      ? 'Бесплатная отмена до 48 часов до заезда. После — депозит не возвращается.'
                      : 'Free cancellation up to 48 hours before check-in. After that, the deposit is non-refundable.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setIsCancelOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-1" />
                {isRu ? 'Отменить бронирование' : 'Cancel Booking'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Write Review Modal */}
      {property && (
        <WriteReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          itemType="property"
          itemId={property.id}
          itemName={isRu ? property.title_ru : property.title}
          onSuccess={() => {
            setIsReviewOpen(false);
            toast.success(isRu ? 'Спасибо за отзыв!' : 'Thank you for your review!');
          }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Отменить бронирование?' : 'Cancel Booking?'}
            </DialogTitle>
            <DialogDescription>
              {isRu
                ? 'Это действие нельзя отменить. Возврат средств зависит от политики отмены.'
                : 'This action cannot be undone. Refund depends on the cancellation policy.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-none text-sm">
            <p className="font-medium">{isRu ? property?.title_ru : property?.title}</p>
            <p className="text-muted-foreground">
              {format(new Date(booking.check_in), 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
              {' → '}
              {format(new Date(booking.check_out), 'dd MMM yyyy', { locale: isRu ? ru : undefined })}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              {isRu ? 'Нет, оставить' : 'No, Keep It'}
            </Button>
            <Button
              variant="destructive"
              disabled={isCancelling}
              onClick={async () => {
                setIsCancelling(true);
                try {
                  const { error } = await supabase
                    .from('property_bookings')
                    .update({
                      status: 'cancelled',
                      cancelled_at: new Date().toISOString(),
                      cancelled_by: user?.id,
                      cancellation_reason: 'guest_requested',
                    })
                    .eq('id', booking.id);

                  if (error) throw error;

                  toast.success(isRu ? 'Бронирование отменено' : 'Booking cancelled');
                  queryClient.invalidateQueries({ queryKey: ['guest-booking', id] });
                  setIsCancelOpen(false);
                } catch {
                  toast.error(isRu ? 'Ошибка отмены' : 'Cancellation failed');
                } finally {
                  setIsCancelling(false);
                }
              }}
            >
              {isCancelling
                ? (isRu ? 'Отмена...' : 'Cancelling...')
                : (isRu ? 'Да, отменить' : 'Yes, Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
