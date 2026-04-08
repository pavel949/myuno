import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge';
import { TicketCategoryBadge } from '@/components/tickets/TicketCategoryBadge';
import { TicketMessages } from '@/components/tickets/TicketMessages';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTickets, type SupportTicket, type TicketMessage } from '@/hooks/useTickets';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { getTicket, getTicketMessages, addMessage } = useTickets();
  const { language } = useLanguage();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticketId) return;

      setIsLoading(true);
      const [ticketData, messagesData] = await Promise.all([
        getTicket(ticketId),
        getTicketMessages(ticketId),
      ]);

      setTicket(ticketData);
      setMessages(messagesData);
      setIsLoading(false);
    };

    fetchData();
  }, [ticketId]);

  const handleSendMessage = async (message: string) => {
    if (!ticketId) return false;
    const success = await addMessage(ticketId, message);
    if (success) {
      const newMessages = await getTicketMessages(ticketId);
      setMessages(newMessages);
    }
    return success;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <LoadingSpinner />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader 
            title={language === 'ru' ? 'Обращение не найдено' : 'Ticket Not Found'}
            showBack
          />
        </PageContainer>
      </AppLayout>
    );
  }

  const canReply = !['resolved', 'closed'].includes(ticket.status);

  return (
    <AppLayout>
      <PageContainer className="pb-0">
        <PageHeader 
          title={ticket.ticket_number}
          showBack
        />

        {/* Ticket Info */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketCategoryBadge category={ticket.category} />
            </div>
          </CardHeader>
          <CardContent>
            <h2 className="font-semibold mb-2">{ticket.subject}</h2>
            <p className="text-sm text-muted-foreground mb-4">{ticket.description}</p>
            
            <div className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Создано: ' : 'Created: '}
              {format(new Date(ticket.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
            </div>

            {ticket.resolution && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <h4 className="text-sm font-medium text-success mb-1">
                  {language === 'ru' ? 'Решение:' : 'Resolution:'}
                </h4>
                <p className="text-sm text-success">{ticket.resolution}</p>
                {ticket.refund_amount && (
                  <p className="text-sm text-success mt-1">
                    {language === 'ru' ? 'Сумма возврата: ' : 'Refund amount: '}
                    ฿{ticket.refund_amount.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col min-h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {language === 'ru' ? 'Переписка' : 'Conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <TicketMessages
              ticketId={ticket.id}
              messages={messages}
              onSendMessage={handleSendMessage}
              canReply={canReply}
            />
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
