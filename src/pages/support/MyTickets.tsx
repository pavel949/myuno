import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { EmptyState } from '@/components/uno/EmptyState';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Plus, Ticket, CheckCircle } from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyTickets() {
  const navigate = useNavigate();
  const { tickets, isLoading } = useTickets();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('active');

  const activeTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <LoadingSpinner />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={language === 'ru' ? 'Мои обращения' : 'My Tickets'}
          showBack
        />
        <Button onClick={() => navigate('/support/new-ticket')} className="mb-4">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ru' ? 'Создать обращение' : 'New Ticket'}
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="active" className="flex-1">
              <Ticket className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Активные' : 'Active'}
              {activeTickets.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {activeTickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Закрытые' : 'Closed'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeTickets.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title={language === 'ru' ? 'Нет активных обращений' : 'No active tickets'}
                description={language === 'ru' 
                  ? 'Создайте обращение, если у вас есть вопрос или проблема' 
                  : 'Create a ticket if you have a question or issue'}
                action={
                  <Button onClick={() => navigate('/support/new-ticket')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Создать обращение' : 'Create Ticket'}
                  </Button>
                }
              />
            ) : (
              activeTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-3">
            {closedTickets.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title={language === 'ru' ? 'Нет закрытых обращений' : 'No closed tickets'}
                description={language === 'ru' 
                  ? 'Решённые обращения будут отображаться здесь' 
                  : 'Resolved tickets will appear here'}
              />
            ) : (
              closedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => navigate(`/support/tickets/${ticket.id}`)}
                  showSlaWarning={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}
