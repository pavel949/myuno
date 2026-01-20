import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { TicketPriority } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; labelRu: string; icon: React.ElementType; color: string }> = {
  urgent: { label: 'Urgent', labelRu: 'Срочно', icon: AlertTriangle, color: 'bg-red-500/10 text-red-600 border-red-200' },
  high: { label: 'High', labelRu: 'Высокий', icon: ArrowUp, color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  normal: { label: 'Normal', labelRu: 'Обычный', icon: Minus, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  low: { label: 'Low', labelRu: 'Низкий', icon: ArrowDown, color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
};

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {config.labelRu}
    </Badge>
  );
}
