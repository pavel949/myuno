import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export function InvestorRecommendations() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card className="p-6">
      <h3 className="font-medium mb-3">
        {isRu ? 'Рекомендации' : 'Recommendations'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {isRu ? 'Проекты, которые могут вас заинтересовать' : 'Projects you might be interested in'}
      </p>
    </Card>
  );
}
