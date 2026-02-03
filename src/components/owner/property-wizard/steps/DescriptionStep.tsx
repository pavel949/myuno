import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { PropertyFormData } from '@/hooks/usePropertyWizard';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Sparkles, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Amenity labels for display
const amenityLabels: Record<string, { en: string; ru: string }> = {
  pool: { en: 'Pool', ru: 'Бассейн' },
  gym: { en: 'Gym', ru: 'Спортзал' },
  security: { en: '24h Security', ru: 'Охрана 24ч' },
  parking: { en: 'Parking', ru: 'Парковка' },
  garden: { en: 'Garden', ru: 'Сад' },
  playground: { en: 'Playground', ru: 'Детская площадка' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  spa: { en: 'Spa', ru: 'Спа' },
  tennis: { en: 'Tennis Court', ru: 'Теннисный корт' },
  beach_access: { en: 'Beach Access', ru: 'Доступ к пляжу' },
  concierge: { en: 'Concierge', ru: 'Консьерж' },
  shuttle: { en: 'Shuttle Service', ru: 'Трансфер' },
};

interface DescriptionStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject?: PropertyProject | null;
}

export function DescriptionStep({ formData, updateFormData, selectedProject }: DescriptionStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleUseProjectDescription = () => {
    updateFormData({
      description: selectedProject?.description_en || '',
      description_ru: selectedProject?.description_ru || '',
    });
    toast.success(
      isRu 
        ? 'Описание проекта загружено. Отредактируйте под ваш объект.' 
        : 'Project description loaded. Customize it for your property.'
    );
  };

  const projectAmenities = selectedProject?.amenities || [];
  const hasProjectDescription = selectedProject?.description_en || selectedProject?.description_ru;
  const isDescriptionEmpty = !formData.description && !formData.description_ru;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isRu ? 'Описание объекта' : 'Property Description'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Use Project Description Button */}
        {hasProjectDescription && isDescriptionEmpty && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">
              {isRu 
                ? 'У проекта есть описание. Хотите использовать его как основу?' 
                : 'Project has a description. Want to use it as a starting point?'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseProjectDescription}
              className="gap-2 flex-shrink-0"
            >
              <Building2 className="h-4 w-4" />
              {isRu ? 'Использовать' : 'Use it'}
            </Button>
          </div>
        )}

        {/* Project Amenities Reference */}
        {projectAmenities.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">
              {isRu ? 'Удобства проекта (доступны вашим гостям):' : 'Project amenities (available to your guests):'}
            </p>
            <div className="flex flex-wrap gap-2">
              {projectAmenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenityLabels[amenity]
                    ? (isRu ? amenityLabels[amenity].ru : amenityLabels[amenity].en)
                    : amenity}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Упомяните эти удобства в описании вашего объекта' 
                : 'Mention these amenities in your property description'}
            </p>
          </div>
        )}

        <TranslatableInput
          label={isRu ? 'Описание' : 'Description'}
          value={isRu ? formData.description_ru : formData.description}
          translatedValue={isRu ? formData.description : formData.description_ru}
          onChange={(val) => updateFormData({ [isRu ? 'description_ru' : 'description']: val })}
          onTranslatedChange={(val) => updateFormData({ [isRu ? 'description' : 'description_ru']: val })}
          placeholder={isRu ? 'Опишите вашу недвижимость...' : 'Describe your property...'}
          translatedPlaceholder={isRu ? 'Describe your property...' : 'Опишите вашу недвижимость...'}
          multiline
          rows={4}
        />

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <p className="text-sm font-medium text-primary">
            {isRu ? '🎯 Это только начало!' : '🎯 This is just the beginning!'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'После создания карточки вы сможете детально настроить условия аренды: тарифы по сезонам, скидки за длительное проживание, правила заезда, штрафы, депозиты и многое другое.' 
              : 'After creating the listing, you can fine-tune rental terms: seasonal rates, long-stay discounts, check-in rules, penalties, deposits, and more.'}
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? '💡 После добавления объект будет проверен модератором UNO. Вы получите уведомление о статусе в течение 24 часов.' 
              : "💡 After adding, the property will be reviewed by UNO. You'll receive a status update within 24 hours."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
