import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { useGuestGuidebook, LocalTip } from '@/hooks/usePropertyGuidebook';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Utensils,
  Coffee,
  Palmtree,
  ShoppingBag,
  Camera,
  Car,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  restaurant: Utensils,
  cafe: Coffee,
  beach: Palmtree,
  shopping: ShoppingBag,
  attraction: Camera,
  transport: Car,
  other: MapPin,
};

const categoryLabels: Record<string, { en: string; ru: string }> = {
  restaurant: { en: 'Restaurants', ru: 'Рестораны' },
  cafe: { en: 'Cafes', ru: 'Кафе' },
  beach: { en: 'Beaches', ru: 'Пляжи' },
  shopping: { en: 'Shopping', ru: 'Магазины' },
  attraction: { en: 'Attractions', ru: 'Достопримечательности' },
  transport: { en: 'Transport', ru: 'Транспорт' },
  other: { en: 'Other', ru: 'Другое' },
};

export default function GuestAreaGuide() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeBookings, isLoading: bookingsLoading } = useGuestPropertyBookings();
  const propertyId = activeBookings?.[0]?.property_id;

  const { data: guidebook, isLoading: guidebookLoading } = useGuestGuidebook(propertyId);

  const isLoading = bookingsLoading || guidebookLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!activeBookings || activeBookings.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Гид по району' : 'Area Guide'} showBack />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isRu ? 'Нет активного бронирования' : 'No Active Booking'}
            </h2>
            <p className="text-muted-foreground">
              {isRu
                ? 'Гид по району будет доступен при активном бронировании'
                : 'The area guide will be available when you have an active booking'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const tips = guidebook?.local_tips || [];

  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, LocalTip[]>);

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Гид по району' : 'Area Guide'}
        showBack
      />

      {Object.keys(groupedTips).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isRu ? 'Рекомендации скоро появятся' : 'Recommendations coming soon'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTips).map(([category, categoryTips]) => {
            const Icon = categoryIcons[category] || MapPin;
            return (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {isRu ? categoryLabels[category]?.ru : categoryLabels[category]?.en}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryTips.map((tip) => (
                    <div key={tip.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {isRu && tip.name_ru ? tip.name_ru : tip.name}
                          </p>
                          {(tip.description || tip.description_ru) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {isRu ? tip.description_ru || tip.description : tip.description}
                            </p>
                          )}
                          {tip.address && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 inline-block" />
                              {tip.address}
                            </p>
                          )}
                        </div>
                        {tip.google_maps_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={tip.google_maps_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
