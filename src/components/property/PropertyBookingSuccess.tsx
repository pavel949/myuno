import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Calendar, 
  Download, 
  Share2, 
  MapPin, 
  Clock, 
  Users, 
  Shield,
  ExternalLink,
  Loader2,
  Home,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generatePropertyBookingICS, downloadICSFile } from '@/lib/generateCalendarEvent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TripServicesGrid } from './TripServicesGrid';
import type { PaymentStage } from './PaymentStageSelector';

interface PropertyBookingSuccessProps {
  orderId: string;
  orderNumber: string;
  propertyTitle: string;
  propertyImage?: string;
  propertyAddress?: string;
  checkIn: Date;
  checkOut: Date;
  checkInTime?: string;
  checkOutTime?: string;
  nights: number;
  guests: number;
  currency: string;
  currencySymbol: string;
  totalAmount: number;
  paymentStages: PaymentStage[];
  isInstantBooking?: boolean;
  propertyId?: string;
}

export function PropertyBookingSuccess({
  orderId,
  orderNumber,
  propertyTitle,
  propertyImage,
  propertyAddress,
  checkIn,
  checkOut,
  checkInTime = '14:00',
  checkOutTime = '11:00',
  nights,
  guests,
  currency,
  currencySymbol,
  totalAmount,
  paymentStages,
  isInstantBooking,
  propertyId,
}: PropertyBookingSuccessProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Handle Add to Calendar
  const handleAddToCalendar = () => {
    const icsContent = generatePropertyBookingICS({
      title: propertyTitle,
      location: propertyAddress || '',
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      description: `${isRu ? 'Бронирование' : 'Booking'} #${orderNumber}\n${nights} ${isRu ? 'ночей' : 'nights'}, ${guests} ${isRu ? 'гостей' : 'guests'}`,
      bookingId: orderNumber,
    });

    downloadICSFile(icsContent, `booking-${orderNumber}.ics`);
    toast.success(isRu ? 'Событие добавлено в календарь' : 'Event added to calendar');
  };

  // Handle PDF Download
  const handleDownloadVoucher = async () => {
    setIsDownloadingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-booking-voucher', {
        body: { orderId, language },
      });

      if (error) throw error;

      // Download PDF from base64
      if (data?.pdf) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], 
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voucher-${orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(isRu ? 'Ваучер загружен' : 'Voucher downloaded');
      } else {
        throw new Error('No PDF data');
      }
    } catch (error) {
      console.error('Error downloading voucher:', error);
      toast.error(isRu ? 'Не удалось загрузить ваучер' : 'Failed to download voucher');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    const shareData = {
      title: `${isRu ? 'Бронирование' : 'Booking'}: ${propertyTitle}`,
      text: `${isRu ? 'Заезд' : 'Check-in'}: ${format(checkIn, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}\n${isRu ? 'Выезд' : 'Check-out'}: ${format(checkOut, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}`,
      url: window.location.origin + `/bookings/${orderId}`,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast.success(isRu ? 'Скопировано в буфер обмена' : 'Copied to clipboard');
    }
  };

  // Calculate paid now vs later
  const paidNow = paymentStages
    .filter(s => s.type === 'deposit' && s.isPaid !== false)
    .reduce((sum, s) => sum + s.amount, 0);
  
  const dueLater = paymentStages
    .filter(s => s.type === 'balance' || s.type === 'security_deposit')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh]">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
        <Check className="w-10 h-10 text-success" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-display font-bold mb-2 text-center">
        {isInstantBooking 
          ? (isRu ? 'Забронировано!' : 'Booking Confirmed!')
          : (isRu ? 'Запрос отправлен!' : 'Request Sent!')}
      </h2>
      <p className="text-muted-foreground text-center mb-2">
        {isRu ? 'Заказ' : 'Order'} #{orderNumber}
      </p>

      {/* Property Card */}
      <div className="w-full max-w-md rounded-xl border bg-card overflow-hidden mb-6">
        {propertyImage && (
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={propertyImage} 
              alt={propertyTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{propertyTitle}</h3>
            {isInstantBooking && (
              <Badge variant="default" className="shrink-0">
                <Check className="w-3 h-3 mr-1" />
                {isRu ? 'Подтверждено' : 'Confirmed'}
              </Badge>
            )}
          </div>

          {propertyAddress && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{propertyAddress}</span>
            </div>
          )}

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Заезд' : 'Check-in'}</p>
              <p className="font-medium">{format(checkIn, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {isRu ? 'с' : 'from'} {checkInTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Выезд' : 'Check-out'}</p>
              <p className="font-medium">{format(checkOut, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {isRu ? 'до' : 'by'} {checkOutTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{nights} {isRu ? 'ночей' : 'nights'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{guests} {isRu ? 'гостей' : 'guests'}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2">
            {paymentStages.map((stage, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className={cn(
                  "flex items-center gap-1.5",
                  stage.type === 'deposit' ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.type === 'deposit' && <Check className="w-3.5 h-3.5 text-success" />}
                  {stage.type === 'balance' && <Clock className="w-3.5 h-3.5" />}
                  {stage.type === 'security_deposit' && <Shield className="w-3.5 h-3.5" />}
                  {stage.type === 'deposit' && (isRu ? 'Оплачено' : 'Paid')}
                  {stage.type === 'balance' && (stage.dueLabel || (isRu ? 'К оплате позже' : 'Due later'))}
                  {stage.type === 'security_deposit' && (isRu ? 'Залог (возврат)' : 'Deposit (refundable)')}
                </span>
                <span className={cn(
                  "font-medium",
                  stage.type === 'deposit' && "text-success"
                )}>
                  {currencySymbol}{stage.amount.toLocaleString()}
                </span>
              </div>
            ))}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-semibold">
              <span>{isRu ? 'Итого' : 'Total'}</span>
              <span>
                {currencySymbol}{(totalAmount + paymentStages.filter(s => s.type === 'security_deposit').reduce((sum, s) => sum + s.amount, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-sell Services */}
      <div className="w-full max-w-md mb-6">
        <TripServicesGrid 
          variant="compact" 
          maxItems={6}
          bookingId={orderId}
          propertyId={propertyId}
        />
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        <Button
          className="w-full gap-2"
          onClick={() => navigate(`/trip/${orderId}`)}
        >
          <ArrowRight className="w-4 h-4" />
          {isRu ? 'Моя поездка' : 'My Trip'}
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleAddToCalendar}
        >
          <Calendar className="w-4 h-4" />
          {isRu ? 'Добавить в календарь' : 'Add to Calendar'}
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleDownloadVoucher}
          disabled={isDownloadingPdf}
        >
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isRu ? 'Скачать ваучер (PDF)' : 'Download Voucher (PDF)'}
        </Button>

        <Button
          variant="ghost"
          className="w-full gap-2"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          {isRu ? 'Поделиться' : 'Share'}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <Button variant="ghost" onClick={() => navigate('/property')}>
          <Home className="w-4 h-4 mr-2" />
          {isRu ? 'К объектам' : 'Browse More'}
        </Button>
        <Button onClick={() => navigate('/bookings')}>
          {isRu ? 'Мои бронирования' : 'My Bookings'}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
