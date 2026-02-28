import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Compass, 
  CheckCircle2,
  Home,
  MessageCircle,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant: 'stay' | 'orders' | 'messages' | 'success';
  className?: string;
  onAction?: () => void;
}

const EMPTY_STATES: Record<string, {
  icon: LucideIcon;
  titleEn: string;
  titleRu: string;
  titleTh: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionTh: string;
  actionEn?: string;
  actionRu?: string;
  actionTh?: string;
  actionPath?: string;
  color: string;
  bgColor: string;
}> = {
  stay: {
    icon: Compass,
    titleEn: 'No active stay',
    titleRu: 'Нет активного проживания',
    titleTh: 'ยังไม่มีการเข้าพัก',
    descriptionEn: 'Book a property to see your stay details here',
    descriptionRu: 'Забронируйте жильё, чтобы увидеть детали здесь',
    descriptionTh: 'จองที่พักเพื่อดูรายละเอียดที่นี่',
    actionEn: 'Find a place',
    actionRu: 'Найти жильё',
    actionTh: 'ค้นหาที่พัก',
    actionPath: '/discover',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  orders: {
    icon: CheckCircle2,
    titleEn: 'No active orders',
    titleRu: 'Нет активных заказов',
    titleTh: 'ยังไม่มีคำสั่งซื้อ',
    descriptionEn: 'Order services during your stay',
    descriptionRu: 'Закажите услуги во время проживания',
    descriptionTh: 'สั่งบริการระหว่างเข้าพัก',
    actionEn: 'Browse services',
    actionRu: 'Смотреть услуги',
    actionTh: 'ดูบริการ',
    actionPath: '/discover',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  messages: {
    icon: MessageCircle,
    titleEn: 'No messages',
    titleRu: 'Нет сообщений',
    titleTh: 'ไม่มีข้อความ',
    descriptionEn: 'Chat with your host or our support team',
    descriptionRu: 'Напишите хосту или в поддержку',
    descriptionTh: 'แชทกับเจ้าของที่พักหรือทีมสนับสนุน',
    actionEn: 'Start chat',
    actionRu: 'Начать чат',
    actionTh: 'เริ่มแชท',
    actionPath: '/guest/chat',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  success: {
    icon: Home,
    titleEn: 'Welcome',
    titleRu: 'Добро пожаловать',
    titleTh: 'ยินดีต้อนรับ',
    descriptionEn: 'Enjoy your stay. We are here if you need anything.',
    descriptionRu: 'Приятного отдыха. Мы рядом, если что-то понадобится.',
    descriptionTh: 'สนุกกับการเข้าพัก เราพร้อมช่วยเหลือคุณ',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
};

export function GuestEmptyState({ variant, className, onAction }: EmptyStateProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const config = EMPTY_STATES[variant];
  if (!config) return null;

  const Icon = config.icon;
  const tt = (en: string, ru: string, th: string) => isRu ? ru : isTh ? th : en;

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.actionPath) {
      navigate(config.actionPath);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex flex-col items-center justify-center py-6 px-4 text-center">
        <div className={cn('p-2.5 rounded-full mb-2', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        
        <h3 className="text-sm font-semibold mb-0.5">
          {tt(config.titleEn, config.titleRu, config.titleTh)}
        </h3>
        
        <p className="text-xs text-muted-foreground max-w-[220px] mb-3">
          {tt(config.descriptionEn, config.descriptionRu, config.descriptionTh)}
        </p>

        {(config.actionEn && config.actionPath) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAction}
            className="h-8 text-xs"
          >
            {tt(config.actionEn, config.actionRu || config.actionEn, config.actionTh || config.actionEn)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
