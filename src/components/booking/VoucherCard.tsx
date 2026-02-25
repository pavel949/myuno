import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  QrCode, 
  Download, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Ticket,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface VoucherCardProps {
  voucherNumber: string;
  bookingType: string;
  title: string;
  subtitle?: string;
  date?: Date | string;
  time?: string;
  location?: string;
  guestName?: string;
  guestsCount?: number;
  amount?: number;
  currency?: string;
  status?: 'active' | 'used' | 'expired' | 'cancelled';
  qrCodeData?: string;
  onDownload?: () => void;
  onShare?: () => void;
  compact?: boolean;
  className?: string;
}

export function VoucherCard({
  voucherNumber,
  bookingType,
  title,
  subtitle,
  date,
  time,
  location,
  guestName,
  guestsCount,
  amount,
  currency = 'THB',
  status = 'active',
  qrCodeData,
  onDownload,
  onShare,
  compact = false,
  className,
}: VoucherCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const formatDate = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return format(dateObj, 'dd MMMM yyyy', { locale: isRu ? ru : undefined });
  };

  const statusConfig = {
    active: { 
      label: isRu ? 'Активен' : 'Active', 
      color: 'bg-success/20 text-success border-success/30' 
    },
    used: { 
      label: isRu ? 'Использован' : 'Used', 
      color: 'bg-muted text-muted-foreground' 
    },
    expired: { 
      label: isRu ? 'Истёк' : 'Expired', 
      color: 'bg-warning/20 text-warning border-warning/30' 
    },
    cancelled: { 
      label: isRu ? 'Отменён' : 'Cancelled', 
      color: 'bg-destructive/20 text-destructive border-destructive/30' 
    },
  };

  const typeLabels: Record<string, { en: string; ru: string }> = {
    tour: { en: 'Tour', ru: 'Тур' },
    yacht: { en: 'Yacht', ru: 'Яхта' },
    property: { en: 'Property', ru: 'Недвижимость' },
    service: { en: 'Service', ru: 'Услуга' },
    beauty: { en: 'Beauty', ru: 'Красота' },
    event: { en: 'Event', ru: 'Событие' },
    restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  };

  const typeLabel = typeLabels[bookingType]?.[isRu ? 'ru' : 'en'] || bookingType;

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-mono">
                  {voucherNumber}
                </span>
                <Badge variant="outline" className={cn('text-xs', statusConfig[status].color)}>
                  {statusConfig[status].label}
                </Badge>
              </div>
              <h3 className="font-semibold truncate">{title}</h3>
              {date && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(date)} {time && `• ${time}`}
                </p>
              )}
            </div>
            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider opacity-80">
                {typeLabel}
              </span>
              <Badge variant="secondary" className={cn('text-xs', statusConfig[status].color)}>
                {statusConfig[status].label}
              </Badge>
            </div>
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            {subtitle && (
              <p className="text-sm opacity-90">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80 uppercase tracking-wider">
              {isRu ? 'Ваучер' : 'Voucher'}
            </p>
            <p className="font-mono text-sm">{voucherNumber}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {date && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Дата' : 'Date'}
                </p>
                <p className="font-medium">{formatDate(date)}</p>
              </div>
            </div>
          )}
          
          {time && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Время' : 'Time'}
                </p>
                <p className="font-medium">{time}</p>
              </div>
            </div>
          )}

          {guestName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Гость' : 'Guest'}
                </p>
                <p className="font-medium">{guestName}</p>
                {guestsCount && guestsCount > 1 && (
                  <p className="text-xs text-muted-foreground">
                    +{guestsCount - 1} {isRu ? 'гостей' : 'guests'}
                  </p>
                )}
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Место' : 'Location'}
                </p>
                <p className="font-medium text-sm">{location}</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="mb-5" />

        {/* QR Code Section */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {amount !== undefined && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Сумма' : 'Amount'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {currency} {amount.toLocaleString()}
                </p>
              </div>
            )}
            
            {status === 'active' && (
              <div className="flex items-center gap-1 text-sm text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRu ? 'Готов к использованию' : 'Ready to use'}</span>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="w-24 h-24 bg-white rounded-xl border-2 border-dashed border-muted flex items-center justify-center">
            {qrCodeData ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`} 
                alt="QR Code"
                className="w-20 h-20"
              />
            ) : (
              <QrCode className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {(onDownload || onShare) && (
          <>
            <Separator className="my-5" />
            <div className="flex gap-3">
              {onDownload && (
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={onDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isRu ? 'Скачать PDF' : 'Download PDF'}
                </Button>
              )}
              {onShare && (
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={onShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {isRu ? 'Поделиться' : 'Share'}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
