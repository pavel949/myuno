import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Download, Share2, Mail, Smartphone, MessageCircle, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { getCurrencySymbol } from '@/lib/config/currencies';
import { AftercareBanner } from '@/components/trust/AftercareBanner';
import { BookingCrossSellSheet } from '@/components/crosssell/BookingCrossSellSheet';

interface BookingConfirmationProps {
  bookingId: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  total: number;
  currency?: string;
  onViewBookings?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continuePath?: string;
  paymentMethod?: string;
  /** P2.4 — Aftercare */
  actionType?: 'booking' | 'order' | 'request' | 'inquiry';
  preparationTips?: string[];
  /** Yacht deposit flow */
  bookingMode?: 'instant' | 'request';
  depositAmount?: number;
  balanceAmount?: number;
}

export function BookingConfirmation({
  bookingId,
  title,
  date,
  time,
  location,
  total,
  currency = 'THB',
  onViewBookings,
  onContinue,
  continueLabel,
  continuePath,
  paymentMethod,
  actionType = 'booking',
  preparationTips,
  bookingMode,
  depositAmount,
  balanceAmount,
}: BookingConfirmationProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [crossSellOpen, setCrossSellOpen] = useState(false);

  // Auto-open cross-sell sheet after a short delay
  useEffect(() => {
    if (actionType === 'booking' && bookingId) {
      const timer = setTimeout(() => setCrossSellOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [bookingId, actionType]);

  const currencySymbol = getCurrencySymbol(currency || 'THB');
  const isCash = paymentMethod === 'cash';
  const isRequest = bookingMode === 'request';

  const handleViewBookings = () => {
    if (onViewBookings) {
      onViewBookings();
    } else {
      navigate('/bookings');
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (continuePath) {
      navigate(continuePath);
    } else {
      navigate('/');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'ru' ? 'Моё бронирование' : 'My Booking',
          text: `${title} - ${date} ${time || ''}`,
        });
      } catch (e) {
        // User cancelled
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isRequest ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-green-100 dark:bg-green-900'}`}
      >
        {isRequest
          ? <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          : <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        }
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold mb-2">
          {isRequest
            ? (language === 'ru' ? 'Заявка отправлена!' : 'Request Sent!')
            : (language === 'ru' ? 'Бронирование подтверждено!' : 'Booking Confirmed!')}
        </h1>
        <p className="text-muted-foreground mb-2">
          {language === 'ru' ? 'Номер заказа' : 'Order number'}: #{bookingId.slice(0, 8).toUpperCase()}
        </p>
        {isRequest && (
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            {language === 'ru'
              ? 'Менеджер myUNO свяжется с вами в течение 2 часов для подтверждения и выставления счёта на депозит'
              : 'A myUNO manager will contact you within 2 hours to confirm and send a deposit invoice'}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm bg-card rounded-2xl border p-5 mb-4"
      >
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Anchor className="w-4 h-4 text-primary" />
          {title}
        </h3>
        
        <div className="space-y-3 text-sm">
          {date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{date}</span>
            </div>
          )}
          {time && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{time}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{location}</span>
            </div>
          )}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          {/* Deposit breakdown for yacht bookings */}
          {depositAmount !== undefined && balanceAmount !== undefined && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'ru' ? 'Полная стоимость' : 'Total charter'}</span>
                <span>{currencySymbol}{total.toLocaleString()}</span>
              </div>
              {isRequest ? (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {language === 'ru' ? `Депозит (будет выставлен)` : `Deposit (to be invoiced)`}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {currencySymbol}{depositAmount.toLocaleString()}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-medium">{language === 'ru' ? 'Депозит оплачен' : 'Deposit paid'}</span>
                    <span className="text-primary font-medium">{currencySymbol}{depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{language === 'ru' ? 'Остаток при посадке' : 'Balance at boarding'}</span>
                    <span>{currencySymbol}{balanceAmount.toLocaleString()}</span>
                  </div>
                </>
              )}
            </>
          )}
          {/* Simple total when no deposit breakdown */}
          {depositAmount === undefined && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-xl font-bold text-primary">{currencySymbol}{total.toLocaleString()}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Notification Channels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-sm bg-muted/50 rounded-xl p-4 mb-6"
      >
        <p className="text-xs text-muted-foreground mb-3">
          {language === 'ru' ? 'Уведомления отправлены:' : 'Notifications sent to:'}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg text-sm">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg text-sm">
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'ru' ? 'Приложение' : 'App'}</span>
          </div>
          {isCash && (
            <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg text-sm">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              <span>WhatsApp</span>
            </div>
          )}
        </div>
        {isCash && (
          <p className="text-xs text-muted-foreground mt-3">
            {language === 'ru' 
              ? 'Наш менеджер скоро свяжется с вами для подтверждения'
              : 'Our manager will contact you shortly to confirm'}
          </p>
        )}
      </motion.div>

      {/* P2.4 — Aftercare: next steps + cross-sell */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="w-full max-w-sm mb-6"
      >
        <AftercareBanner
          actionType={actionType}
          preparationTips={preparationTips}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={handleViewBookings}
          className="w-full h-12"
          size="lg"
        >
          {language === 'ru' ? 'Мои бронирования' : 'My Bookings'}
        </Button>

        <Button
          onClick={handleContinue}
          variant="outline"
          className="w-full h-12"
          size="lg"
        >
          {continueLabel || (language === 'ru' ? 'Продолжить' : 'Continue')}
        </Button>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Поделиться' : 'Share'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled
          >
            <Download className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Скачать' : 'Download'}
          </Button>
        </div>
      </motion.div>

      {/* Cross-sell offers */}
      <BookingCrossSellSheet
        bookingId={bookingId}
        open={crossSellOpen}
        onOpenChange={setCrossSellOpen}
      />
    </div>
  );
}
