import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Download, Share2, Mail, Smartphone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { getCurrencySymbol } from '@/lib/currencyUtils';

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
}: BookingConfirmationProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const currencySymbol = getCurrencySymbol(currency || 'THB');
  const isCash = paymentMethod === 'cash';

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
        className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold mb-2">
          {language === 'ru' ? 'Бронирование подтверждено!' : 'Booking Confirmed!'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {language === 'ru' ? 'Номер заказа' : 'Order number'}: #{bookingId.slice(0, 8).toUpperCase()}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm bg-card rounded-2xl border p-5 mb-4"
      >
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        
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

        <div className="border-t mt-4 pt-4 flex justify-between items-center">
          <span className="text-muted-foreground">
            {language === 'ru' ? 'Итого' : 'Total'}
          </span>
          <span className="text-xl font-bold text-primary">
            {currencySymbol}{total.toLocaleString()}
          </span>
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
    </div>
  );
}
