import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { pickLang } from '@/lib/i18n/pickLang';

/** Finance hands off to the existing request verification workflow.
 * Never create a paid order, guessed commission or accounting fact in this UI.
 */
export function ManualPaymentForm() {
  const {language}=useLanguage();
  return <Button size="sm" variant="outline" className="gap-1.5" asChild>
    <Link to="/admin/operations?tab=manual-payments">
      <Wallet className="h-4 w-4" aria-hidden="true"/>
      {pickLang(language,{en:'Review manual payments',ru:'Проверить ручные оплаты',th:'ตรวจสอบการชำระเงินด้วยตนเอง'})}
    </Link>
  </Button>;
}
