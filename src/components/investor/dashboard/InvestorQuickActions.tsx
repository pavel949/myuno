import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Search, FileText } from 'lucide-react';

export function InvestorQuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={() => navigate('/property/invest')}>
        <Search className="h-4 w-4 mr-2" />
        {isRu ? 'Смотреть проекты' : isTh ? 'ดูโปรเจกต์' : 'Browse Projects'}
      </Button>
      <Button variant="outline" onClick={() => navigate('/account/orders')}>
        <FileText className="h-4 w-4 mr-2" />
        {isRu ? 'Мои заявки' : isTh ? 'ใบสมัครของฉัน' : 'My Applications'}
      </Button>
    </div>
  );
}
