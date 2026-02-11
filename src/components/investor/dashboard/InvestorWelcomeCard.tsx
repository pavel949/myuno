import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp } from 'lucide-react';

export function InvestorWelcomeCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Мои инвестиции' : 'My Investments'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Отслеживайте ваши инвестиционные интересы' : 'Track your investment interests'}
          </p>
        </div>
      </div>
    </Card>
  );
}
