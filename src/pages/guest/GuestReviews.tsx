import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { Loader2, AlertCircle } from 'lucide-react';

export default function GuestReviews() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeBookings, isLoading } = useGuestPropertyBookings();
  const booking = activeBookings?.[0];
  const propertyId = booking?.property_id;
  const propertyName = (booking as any)?.owner_properties?.title || '';

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!activeBookings || activeBookings.length === 0 || !propertyId) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Отзывы' : 'Reviews'} showBack />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Нет активного бронирования' : 'No Active Booking'}
            </h2>
            <p className="text-muted-foreground">
              {isRu
                ? 'Отзывы будут доступны при активном бронировании'
                : 'Reviews will be available when you have an active booking'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Отзывы' : 'Reviews'}
        showBack
      />

      <ReviewsSection
        itemType="property"
        itemId={propertyId}
        itemName={propertyName}
        showStats
      />
    </PageContainer>
  );
}
