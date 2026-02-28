import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  Users,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant: 'properties' | 'bookings' | 'tasks' | 'analytics' | 'success';
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
  properties: {
    icon: Home,
    titleEn: 'No properties yet',
    titleRu: 'Пока нет объектов',
    titleTh: 'ยังไม่มีอสังหาฯ',
    descriptionEn: 'Add your first property to start managing rentals',
    descriptionRu: 'Добавьте первый объект для управления арендой',
    descriptionTh: 'เพิ่มอสังหาฯ แรกเพื่อเริ่มจัดการเช่า',
    actionEn: 'Add property',
    actionRu: 'Добавить объект',
    actionTh: 'เพิ่มอสังหาฯ',
    actionPath: '/owner/properties/new',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  bookings: {
    icon: Calendar,
    titleEn: 'No bookings',
    titleRu: 'Нет бронирований',
    titleTh: 'ยังไม่มีการจอง',
    descriptionEn: 'Bookings will appear here when guests reserve your properties',
    descriptionRu: 'Бронирования появятся, когда гости забронируют ваши объекты',
    descriptionTh: 'การจองจะปรากฏที่นี่เมื่อแขกจองอสังหาฯ ของคุณ',
    actionEn: 'View calendar',
    actionRu: 'Открыть календарь',
    actionTh: 'ดูปฏิทิน',
    actionPath: '/owner/calendar',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  tasks: {
    icon: CheckCircle2,
    titleEn: 'All clear',
    titleRu: 'Всё в порядке',
    titleTh: 'ทุกอย่างเรียบร้อย',
    descriptionEn: 'No pending tasks. Your properties are running smoothly.',
    descriptionRu: 'Нет задач. Ваши объекты работают отлично.',
    descriptionTh: 'ไม่มีงานค้าง อสังหาฯ ของคุณดำเนินไปด้วยดี',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  analytics: {
    icon: TrendingUp,
    titleEn: 'Analytics coming soon',
    titleRu: 'Аналитика скоро',
    titleTh: 'การวิเคราะห์เร็วๆ นี้',
    descriptionEn: 'Complete a few bookings to see revenue metrics',
    descriptionRu: 'Завершите несколько бронирований для метрик',
    descriptionTh: 'ทำการจองสำเร็จเพื่อดูตัวชี้วัดรายได้',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  success: {
    icon: Users,
    titleEn: 'Welcome to owner panel',
    titleRu: 'Добро пожаловать',
    titleTh: 'ยินดีต้อนรับ',
    descriptionEn: 'Manage your properties, bookings, and finances',
    descriptionRu: 'Управляйте объектами, бронированиями и финансами',
    descriptionTh: 'จัดการอสังหาฯ การจอง และการเงิน',
    actionEn: 'Get started',
    actionRu: 'Начать',
    actionTh: 'เริ่มต้น',
    actionPath: '/owner/properties/new',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
};

export function OwnerEmptyState({ variant, className, onAction }: EmptyStateProps) {
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

// Compact celebration state for task blocks
export function OwnerSuccessState({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20', className)}>
      <div className="p-2 rounded-full bg-success/10 shrink-0">
        <CheckCircle2 className="h-5 w-5 text-success" />
      </div>
      <div>
         <p className="text-sm font-medium text-success">
          {isRu ? 'Всё в порядке' : isTh ? 'ทุกอย่างเรียบร้อย' : 'All clear'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Нет задач на сегодня' : isTh ? 'ไม่มีงานวันนี้' : 'No tasks for today'}
        </p>
      </div>
    </div>
  );
}
