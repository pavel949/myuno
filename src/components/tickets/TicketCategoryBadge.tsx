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
  refund: { label: 'Refund', labelRu: 'Возврат', icon: RefreshCcw, color: 'bg-purple-500/10 text-purple-600' },
  quality: { label: 'Quality', labelRu: 'Качество', icon: Star, color: 'bg-yellow-500/10 text-yellow-600' },
  fraud: { label: 'Fraud', labelRu: 'Мошенничество', icon: ShieldAlert, color: 'bg-red-500/10 text-red-600' },
  damage: { label: 'Damage', labelRu: 'Повреждение', icon: Wrench, color: 'bg-orange-500/10 text-orange-600' },
  payment: { label: 'Payment', labelRu: 'Оплата', icon: CreditCard, color: 'bg-green-500/10 text-green-600' },
  delivery: { label: 'Delivery', labelRu: 'Доставка', icon: Truck, color: 'bg-blue-500/10 text-blue-600' },
  cancellation: { label: 'Cancellation', labelRu: 'Отмена', icon: XCircle, color: 'bg-gray-500/10 text-gray-600' },
  other: { label: 'Other', labelRu: 'Другое', icon: HelpCircle, color: 'bg-slate-500/10 text-slate-600' },
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
