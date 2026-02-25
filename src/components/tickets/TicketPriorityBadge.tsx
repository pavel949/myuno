import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { TicketPriority } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; labelRu: string; icon: React.ElementType; color: string }> = {
  urgent: { label: 'Urgent', labelRu: 'Срочно', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  high: { label: 'High', labelRu: 'Высокий', icon: ArrowUp, color: 'bg-warning/10 text-warning border-warning/20' },
  normal: { label: 'Normal', labelRu: 'Обычный', icon: Minus, color: 'bg-info/10 text-info border-info/20' },
  low: { label: 'Low', labelRu: 'Низкий', icon: ArrowDown, color: 'bg-muted text-muted-foreground border-border' },
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
