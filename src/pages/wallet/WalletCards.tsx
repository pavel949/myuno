import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { PaymentMethodsSection } from '@/components/wallet/PaymentMethodsSection';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WalletCards() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <PageContainer>
      <PageHeader 
        title={isRu ? 'Мои карты' : 'My Cards'} 
        showBack 
      />
      <PaymentMethodsSection />
    </PageContainer>
  );
}
