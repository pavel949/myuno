import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatableInput } from '@/components/forms/TranslatableInput';
import { PropertyFormData } from '@/hooks/usePropertyWizard';

interface DescriptionStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function DescriptionStep({ formData, updateFormData }: DescriptionStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isRu ? 'Описание объекта' : 'Property Description'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
