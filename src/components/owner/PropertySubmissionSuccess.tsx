import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Bell, 
  CalendarCheck,
  Home,
  ArrowRight
} from 'lucide-react';

interface PropertySubmissionSuccessProps {
  propertyId?: string;
  propertyTitle?: string;
}

export function PropertySubmissionSuccess({ 
  propertyId, 
  propertyTitle 
}: PropertySubmissionSuccessProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const steps = [
    {
      icon: Eye,
      title: isRu ? 'Объект на рассмотрении' : 'Property under review',
      description: isRu 
        ? 'Специалисты myUNO проверят информацию' 
        : 'myUNO team will verify the information'
    },
    {
      icon: Bell,
      title: isRu ? 'Вы получите уведомление' : 'You will receive a notification',
      description: isRu 
        ? 'Когда объект будет одобрен или потребуется доработка' 
        : 'When property is approved or needs revision'
    },
    {
      icon: CalendarCheck,
      title: isRu ? 'Настройте календарь и цены' : 'Set up calendar and prices',
      description: isRu 
        ? 'После одобрения вы сможете принимать бронирования' 
        : 'After approval you can start accepting bookings'
    }
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute inset-0 bg-success/20 rounded-full blur-xl"
            />
            <CheckCircle className="h-24 w-24 text-success relative z-10" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-2xl font-bold mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isRu ? 'Спасибо!' : 'Thank you!'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-center text-muted-foreground mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isRu 
            ? 'Информация отправлена специалистам myUNO' 
            : 'Information sent to myUNO team'}
        </motion.p>

        {/* Property name if available */}
        {propertyTitle && (
          <motion.p 
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            "{propertyTitle}"
          </motion.p>
        )}

        {/* Time indicator card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full mt-6"
        >
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {isRu ? 'Модерация займёт от 1 часа' : 'Review takes from 1 hour'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Обычно в рабочее время ещё быстрее' 
                    : 'Usually faster during business hours'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div 
          className="w-full mt-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm font-medium text-muted-foreground">
            {isRu ? 'Что будет дальше:' : 'What happens next:'}
          </p>
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Protection period info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full mt-4"
        >
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              {isRu 
                ? '🛡️ Первые 48 часов после одобрения все бронирования требуют вашего подтверждения для безопасности' 
                : '🛡️ First 48 hours after approval all bookings require your confirmation for safety'}
            </p>
          </Card>
        </motion.div>

        {/* Action buttons */}
        <motion.div 
          className="w-full mt-8 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => navigate('/owner/properties')}
          >
            <Home className="h-4 w-4 mr-2" />
            {isRu ? 'Мои объекты' : 'My Properties'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/owner/properties/new')}
          >
            {isRu ? 'Добавить ещё объект' : 'Add another property'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
