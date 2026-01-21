import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null | undefined;

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  rejectionReason?: string | null;
  className?: string;
  showTooltip?: boolean;
}

const statusConfig = {
  pending: {
    labelEn: 'On Moderation',
    labelRu: 'На модерации',
    descriptionEn: 'Your listing is being reviewed by our team',
    descriptionRu: 'Ваша карточка рассматривается нашей командой',
    variant: 'outline' as const,
    className: 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
    icon: Clock,
  },
  approved: {
    labelEn: 'Published',
    labelRu: 'Опубликовано',
    descriptionEn: 'Your listing is visible to users',
    descriptionRu: 'Ваша карточка видна пользователям',
    variant: 'outline' as const,
    className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20',
    icon: CheckCircle,
  },
  rejected: {
    labelEn: 'Rejected',
    labelRu: 'Отклонено',
    descriptionEn: 'Your listing was not approved',
    descriptionRu: 'Ваша карточка была отклонена',
    variant: 'outline' as const,
    className: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20',
    icon: XCircle,
  },
  unknown: {
    labelEn: 'Unknown',
    labelRu: 'Неизвестно',
    descriptionEn: 'Status is not available',
    descriptionRu: 'Статус недоступен',
    variant: 'outline' as const,
    className: 'border-muted text-muted-foreground',
    icon: AlertCircle,
  },
};

export function ApprovalStatusBadge({
  status,
  rejectionReason,
  className = '',
  showTooltip = true,
}: ApprovalStatusBadgeProps) {
  const { language } = useLanguage();
  
  const normalizedStatus = status && status in statusConfig ? status : 'unknown';
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig];
  const Icon = config.icon;
  
  const label = language === 'ru' ? config.labelRu : config.labelEn;
  const description = language === 'ru' ? config.descriptionRu : config.descriptionEn;
  
  const tooltipContent = normalizedStatus === 'rejected' && rejectionReason
    ? `${description}: ${rejectionReason}`
    : description;

  const badge = (
    <Badge variant={config.variant} className={`${config.className} ${className} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
