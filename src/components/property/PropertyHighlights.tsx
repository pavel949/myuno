import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Waves, Sunrise, TreePine, Mountain, Building2, 
  Sparkles, Wifi, Car, Utensils, Dumbbell,
  ShieldCheck, Baby, Dog, Accessibility, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyHighlightsProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  className?: string;
}

const highlightOptions = [
  // Location
  { value: 'beach_close', labelEn: 'Near Beach (< 500m)', labelRu: 'Рядом с пляжем (< 500м)', icon: Waves, category: 'location' },
  { value: 'amazing_view', labelEn: 'Amazing View', labelRu: 'Потрясающий вид', icon: Sunrise, category: 'location' },
  { value: 'garden', labelEn: 'Private Garden', labelRu: 'Частный сад', icon: TreePine, category: 'location' },
  { value: 'mountain_view', labelEn: 'Mountain View', labelRu: 'Вид на горы', icon: Mountain, category: 'location' },
  { value: 'city_center', labelEn: 'City Center', labelRu: 'Центр города', icon: Building2, category: 'location' },
  
  // Amenities
  { value: 'private_pool', labelEn: 'Private Pool', labelRu: 'Частный бассейн', icon: Waves, category: 'amenity' },
  { value: 'luxury', labelEn: 'Luxury Property', labelRu: 'Люкс', icon: Sparkles, category: 'amenity' },
  { value: 'fast_wifi', labelEn: 'High-Speed WiFi', labelRu: 'Быстрый WiFi', icon: Wifi, category: 'amenity' },
  { value: 'parking', labelEn: 'Free Parking', labelRu: 'Бесплатная парковка', icon: Car, category: 'amenity' },
  { value: 'full_kitchen', labelEn: 'Full Kitchen', labelRu: 'Полная кухня', icon: Utensils, category: 'amenity' },
  { value: 'gym', labelEn: 'Gym Access', labelRu: 'Доступ в зал', icon: Dumbbell, category: 'amenity' },
  
  // Trust
  { value: 'verified', labelEn: 'Verified Host', labelRu: 'Верифицированный хозяин', icon: ShieldCheck, category: 'trust' },
  { value: 'family_friendly', labelEn: 'Family Friendly', labelRu: 'Для семей с детьми', icon: Baby, category: 'trust' },
  { value: 'pet_friendly', labelEn: 'Pet Friendly', labelRu: 'Можно с питомцами', icon: Dog, category: 'trust' },
  { value: 'accessible', labelEn: 'Wheelchair Accessible', labelRu: 'Доступно для инвалидов', icon: Accessibility, category: 'trust' },
  { value: 'flexible_checkin', labelEn: 'Flexible Check-in', labelRu: 'Гибкий заезд', icon: Clock, category: 'trust' },
];

const categories = [
  { value: 'location', labelEn: 'Location', labelRu: 'Расположение' },
  { value: 'amenity', labelEn: 'Amenities', labelRu: 'Удобства' },
  { value: 'trust', labelEn: 'Trust & Safety', labelRu: 'Доверие' },
];

export function PropertyHighlights({ highlights, onChange, className }: PropertyHighlightsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const toggleHighlight = (value: string) => {
    if (highlights.includes(value)) {
      onChange(highlights.filter(h => h !== value));
    } else {
      // Limit to 6 highlights
      if (highlights.length < 6) {
        onChange([...highlights, value]);
      }
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {isRu ? 'Особенности объекта' : 'Property Highlights'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isRu 
                ? `Выберите до 6 ключевых особенностей (${highlights.length}/6)` 
                : `Select up to 6 key highlights (${highlights.length}/6)`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => {
          const categoryHighlights = highlightOptions.filter(h => h.category === category.value);
          
          return (
            <div key={category.value}>
              <h4 className="text-sm font-medium mb-3">
                {isRu ? category.labelRu : category.labelEn}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categoryHighlights.map(highlight => {
                  const Icon = highlight.icon;
                  const isSelected = highlights.includes(highlight.value);
                  const isDisabled = !isSelected && highlights.length >= 6;
                  
                  return (
                    <Badge
                      key={highlight.value}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer gap-1.5 py-1.5 px-3 transition-all",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        isSelected && "ring-2 ring-primary/20"
                      )}
                      onClick={() => !isDisabled && toggleHighlight(highlight.value)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {isRu ? highlight.labelRu : highlight.labelEn}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Selected Summary */}
        {highlights.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">
              {isRu ? 'Выбранные особенности:' : 'Selected highlights:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map(value => {
                const highlight = highlightOptions.find(h => h.value === value);
                if (!highlight) return null;
                const Icon = highlight.icon;
                
                return (
                  <Badge key={value} variant="secondary" className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {isRu ? highlight.labelRu : highlight.labelEn}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
