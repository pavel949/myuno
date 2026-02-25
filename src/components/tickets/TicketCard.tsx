import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketCategoryBadge } from './TicketCategoryBadge';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { SupportTicket } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick?: () => void;
  showSlaWarning?: boolean;
}

function TicketCardInner({ ticket, onClick, showSlaWarning = true }: TicketCardProps) {
  const isOverdue = useMemo(() => {
    return ticket.sla_deadline && 
      new Date(ticket.sla_deadline) < new Date() && 
      !['resolved', 'closed'].includes(ticket.status);
  }, [ticket.sla_deadline, ticket.status]);

  const timeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(ticket.created_at), { 
      addSuffix: true, 
      locale: ru 
    });
  }, [ticket.created_at]);

  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isOverdue && 'border-destructive/30 bg-destructive/5'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">
                {ticket.ticket_number}
              </span>
              <TicketStatusBadge status={ticket.status} />
              {isOverdue && showSlaWarning && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  SLA
                </span>
              )}
            </div>

            <h3 className="font-medium text-sm line-clamp-1 mb-1">
              {ticket.subject}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {ticket.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <TicketCategoryBadge category={ticket.category} />
              <TicketPriorityBadge priority={ticket.priority} />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize to prevent re-renders when parent updates
export const TicketCard = memo(TicketCardInner);
