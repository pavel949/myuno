import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

/** Financial entries require a persisted order and the checked receipt command. */
export function ManualPaymentForm() {
  const { language } = useLanguage();
  return (
    <Button size="sm" className="gap-1.5" asChild>
      <Link to="/admin/operations?tab=manual-payments&manual_status=review">
        <Receipt className="h-4 w-4" />
        {language === 'ru' ? 'Учесть поступление по заявке' : 'Record request receipt'}
      </Link>
    </Button>
  );
}
