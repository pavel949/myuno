/**
 * @component MarketingSection
 * @description Marketing and promotion section for property management hub
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty } from '@/hooks/usePropertyCare';
import { 
  usePropertyAnalytics, 
  usePropertyAnalyticsSummary,
  calculateListingHealthScore
} from '@/hooks/usePropertyMarketing';
import { ListingHealthScore } from './ListingHealthScore';
import { ViewsAnalytics } from './ViewsAnalytics';
import { BoostListingCard } from './BoostListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface MarketingSectionProps {
  propertyId: string;
}

export function PropertyManageMarketingSection({ propertyId }: MarketingSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: property, isLoading: propertyLoading } = useOwnerProperty(propertyId);
  const { data: analytics = [], isLoading: analyticsLoading } = usePropertyAnalytics(propertyId, 30);
  const summary = usePropertyAnalyticsSummary(propertyId, 30);
  
  const listingScore = calculateListingHealthScore(property || null);
  
  if (propertyLoading || analyticsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-none" />
        <Skeleton className="h-[300px] w-full rounded-none" />
        <Skeleton className="h-[250px] w-full rounded-none" />
      </div>
    );
  }
  
  if (!property) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isRu ? 'Объект не найден' : 'Property not found'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">
          {isRu ? 'Маркетинг и продвижение' : 'Marketing & Promotion'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Увеличьте видимость объекта и привлекайте больше гостей' 
            : 'Increase visibility and attract more guests'}
        </p>
      </div>
      
      {/* Listing Health Score */}
      {listingScore && (
        <ListingHealthScore score={listingScore} />
      )}
      
      {/* Views & Analytics */}
      <ViewsAnalytics 
        analytics={analytics} 
        summary={summary}
      />
      
      {/* Boost/Promotion Options */}
      <BoostListingCard propertyId={propertyId} />
      
      {/* Tips Section */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <h3 className="font-medium mb-3">
            {isRu ? '💡 Советы по продвижению' : '💡 Marketing Tips'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {isRu 
              ? 'Обновляйте фотографии каждый сезон для актуальности' 
              : 'Update photos each season to stay current'}
            </li>
            <li>• {isRu 
              ? 'Отвечайте на запросы в течение часа для лучшего рейтинга' 
              : 'Respond to inquiries within an hour for better ranking'}
            </li>
            <li>• {isRu 
              ? 'Используйте сезонное ценообразование в высокий сезон' 
              : 'Use seasonal pricing during peak season'}
            </li>
            <li>• {isRu 
              ? 'Просите гостей оставлять отзывы после выезда' 
              : 'Ask guests to leave reviews after checkout'}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
