import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { CreateTicketForm } from '@/components/tickets/CreateTicketForm';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TicketCategory } from '@/hooks/useTickets';

export default function NewTicket() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id') || undefined;
  const orderNumber = searchParams.get('order_number') || undefined;
  const category = searchParams.get('category') as TicketCategory | undefined;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={language === 'ru' ? 'Новое обращение' : 'New Ticket'}
          showBack
        />
        
        <CreateTicketForm 
          orderId={orderId}
          orderNumber={orderNumber}
          prefilledCategory={category}
        />
      </PageContainer>
    </AppLayout>
  );
}
