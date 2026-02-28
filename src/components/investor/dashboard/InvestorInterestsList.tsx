import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export function InvestorInterestsList() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  return (
    <Card className="p-6">
      <h3 className="font-medium mb-3">
        {isRu ? 'Мои заявки' : isTh ? 'ใบสมัครของฉัน' : 'My Applications'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {isRu ? 'У вас пока нет активных заявок' : isTh ? 'ยังไม่มีใบสมัครที่ใช้งาน' : 'No active applications yet'}
      </p>
    </Card>
  );
}
