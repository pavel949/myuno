import { Badge } from '@/components/ui/badge';
import { 
  RefreshCcw, 
  Star, 
  ShieldAlert, 
  Wrench, 
  CreditCard, 
  Truck, 
  XCircle, 
  HelpCircle 
} from 'lucide-react';
import type { TicketCategory } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface TicketCategoryBadgeProps {
  category: TicketCategory;
  className?: string;
}

const categoryConfig: Record<TicketCategory, { label: string; labelRu: string; icon: React.ElementType; color: string }> = {
  refund: { label: 'Refund', labelRu: 'Возврат', icon: RefreshCcw, color: 'bg-accent-purple/10 text-accent-purple' },
  quality: { label: 'Quality', labelRu: 'Качество', icon: Star, color: 'bg-warning/10 text-warning' },
  fraud: { label: 'Fraud', labelRu: 'Мошенничество', icon: ShieldAlert, color: 'bg-destructive/10 text-destructive' },
  damage: { label: 'Damage', labelRu: 'Повреждение', icon: Wrench, color: 'bg-warning/10 text-warning' },
  payment: { label: 'Payment', labelRu: 'Оплата', icon: CreditCard, color: 'bg-success/10 text-success' },
  delivery: { label: 'Delivery', labelRu: 'Доставка', icon: Truck, color: 'bg-info/10 text-info' },
  cancellation: { label: 'Cancellation', labelRu: 'Отмена', icon: XCircle, color: 'bg-muted text-muted-foreground' },
  other: { label: 'Other', labelRu: 'Другое', icon: HelpCircle, color: 'bg-muted text-muted-foreground' },
};

export function TicketCategoryBadge({ category, className }: TicketCategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.color, 'border-transparent', className)}>
      <Icon className="w-3 h-3 mr-1" />
      {config.labelRu}
    </Badge>
  );
}
