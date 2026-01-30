import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Calendar, Home, MessageCircle, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { TripServicesGrid } from '@/components/property/TripServicesGrid';

export default function PropertyDepositSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sessionId = searchParams.get('session_id');
  const propertyId = searchParams.get('property_id');
  const bookingId = searchParams.get('booking_id');

  return (
    <AppLayout showBottomNav={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh]">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-center mb-2">
          {isRu ? 'Предоплата получена!' : 'Deposit Received!'}
        </h1>
        
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          {isRu 
            ? 'Ваша предоплата 10% успешно обработана. Команда myUNO свяжется с вами для подтверждения бронирования.'
            : 'Your 10% deposit has been processed successfully. The myUNO team will contact you to confirm your booking.'}
        </p>

        {/* What's Next Card */}
        <Card className="w-full max-w-sm mb-6">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">{isRu ? 'Что дальше?' : "What's Next?"}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Мы проверим доступность объекта и заблокируем даты'
                    : 'We will verify availability and block the dates'}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Вы получите подтверждение бронирования на email'
                    : 'You will receive booking confirmation via email'}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu 
                    ? 'Остаток суммы оплачивается при заезде'
                    : 'Remaining balance is paid at check-in'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cross-sell Services */}
        <div className="w-full max-w-sm mb-6">
          <TripServicesGrid 
            variant="compact" 
            maxItems={6}
            bookingId={bookingId || undefined}
            propertyId={propertyId || undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {bookingId && (
            <Button onClick={() => navigate(`/trip/${bookingId}`)} className="w-full gap-2">
              <ArrowRight className="w-4 h-4" />
              {isRu ? 'Моя поездка' : 'My Trip'}
            </Button>
          )}
          
          <Button 
            variant={bookingId ? 'outline' : 'default'}
            onClick={() => navigate('/bookings')} 
            className="w-full gap-2"
          >
            <Calendar className="w-4 h-4" />
            {isRu ? 'Мои бронирования' : 'My Bookings'}
          </Button>
          
          <Button variant="ghost" onClick={() => navigate('/property')} className="w-full gap-2">
            <Home className="w-4 h-4" />
            {isRu ? 'К списку недвижимости' : 'Browse Properties'}
          </Button>
        </div>

        {/* Reference ID */}
        {sessionId && (
          <p className="text-xs text-muted-foreground mt-6">
            {isRu ? 'Номер транзакции' : 'Transaction ID'}: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </AppLayout>
  );
}
