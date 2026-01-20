import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, ArrowUp } from 'lucide-react';
import type { TicketStatus } from '@/hooks/useTickets';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; labelRu: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', labelRu: 'Открыт', icon: Clock, variant: 'default' },
  in_progress: { label: 'In Progress', labelRu: 'В работе', icon: AlertTriangle, variant: 'secondary' },
  waiting_response: { label: 'Waiting', labelRu: 'Ожидает ответа', icon: MessageSquare, variant: 'outline' },
  resolved: { label: 'Resolved', labelRu: 'Решён', icon: CheckCircle, variant: 'default' },
  closed: { label: 'Closed', labelRu: 'Закрыт', icon: XCircle, variant: 'secondary' },
  escalated: { label: 'Escalated', labelRu: 'Эскалирован', icon: ArrowUp, variant: 'destructive' },
};

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.labelRu}
    </Badge>
  );
}
