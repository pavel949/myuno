import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyBookings, PropertyBooking } from '@/hooks/usePropertyBookings';
import { useOwnerProperty } from '@/hooks/usePropertyCare';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PropertyChatWindow } from '@/components/owner/PropertyChatWindow';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerChatRoom() {
  const { type, id } = useParams<{ type: 'property' | 'booking'; id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Fetch booking details if type is booking (with ownership verification)
  const { data: booking } = useQuery({
    queryKey: ['booking-detail', id, user?.id],
    queryFn: async () => {
      if (type !== 'booking' || !id || !user) return null;
      const { data, error } = await supabase
        .from('property_bookings')
        .select('*, owner_properties(title, title_ru)')
        .eq('id', id)
        .eq('owner_id', user.id) // Security: verify ownership
        .single();
      if (error) throw error;
      return data;
    },
    enabled: type === 'booking' && !!id && !!user,
  });

  // Fetch property details if type is property
  const { data: property } = useOwnerProperty(type === 'property' ? id : undefined);

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Чат' : 'Chat'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для доступа к чату' : 'Sign in to access chat'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const title = type === 'booking'
    ? booking?.guest_name || (isRu ? 'Чат с гостем' : 'Guest Chat')
    : property?.title || (isRu ? 'Чат по объекту' : 'Property Chat');

  const subtitle = type === 'booking'
    ? (isRu && (booking?.owner_properties as any)?.title_ru 
        ? (booking?.owner_properties as any)?.title_ru 
        : (booking?.owner_properties as any)?.title)
    : property?.address;

  return (
    <PageContainer className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        showBack
        fallbackPath="/owner/messages"
      />

      <div className="flex-1 mt-4 min-h-0">
        <PropertyChatWindow
          propertyId={type === 'property' ? id : booking?.property_id}
          bookingId={type === 'booking' ? id : undefined}
          guestName={booking?.guest_name || undefined}
          propertyTitle={type === 'property' 
            ? (isRu && property?.title_ru ? property.title_ru : property?.title)
            : undefined
          }
          className="h-full"
        />
      </div>
    </PageContainer>
  );
}
