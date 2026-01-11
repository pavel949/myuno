import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookingCalendar } from '@/components/owner/BookingCalendar';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

export default function OwnerCalendar() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Календарь бронирований' : 'Booking Calendar'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu 
              ? 'Войдите, чтобы просмотреть календарь' 
              : 'Sign in to view the calendar'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Календарь бронирований' : 'Booking Calendar'}
        showBack
        fallbackPath="/owner"
      />
      
      <div className="mt-4">
        <BookingCalendar showPropertySelector />
      </div>
    </PageContainer>
  );
}
