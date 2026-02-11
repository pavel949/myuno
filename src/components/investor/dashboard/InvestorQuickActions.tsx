import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Search, FileText } from 'lucide-react';

export function InvestorQuickActions() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={() => navigate('/invest')}>
        <Search className="h-4 w-4 mr-2" />
        {isRu ? 'Смотреть проекты' : 'Browse Projects'}
      </Button>
      <Button variant="outline" onClick={() => navigate('/account/orders')}>
        <FileText className="h-4 w-4 mr-2" />
        {isRu ? 'Мои заявки' : 'My Applications'}
      </Button>
    </div>
  );
}
