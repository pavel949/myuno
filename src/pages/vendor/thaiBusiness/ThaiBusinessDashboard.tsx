/**
 * ThaiBusinessDashboard — B2B owner workspace (inside VendorLayout).
 *
 * Tabs: Profile · Services · Messages · Bookings · Landing. Feature-flag gated.
 * Services/Messages/Bookings/Landing require a saved business first.
 */
import { Store } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useMyThaiBusiness } from '@/hooks/thaiServices/useThaiServices';
import { ProfileTab } from './ProfileTab';
import { ServicesTab } from './ServicesTab';
import { MessagesTab } from './MessagesTab';
import { BookingsTab } from './BookingsTab';
import { LandingTab } from './LandingTab';

export default function ThaiBusinessDashboard() {
  const enabled = useFeatureFlag('THAI_BUSINESS_LAYER');
  const { t, language } = useLanguage();
  const { data: business, isLoading } = useMyThaiBusiness();

  if (!enabled) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('thai.owner.title')} — {pickLang(language, { ru: 'скоро', en: 'coming soon', th: 'เร็ว ๆ นี้' })}.
      </div>
    );
  }
  if (isLoading) return <LoadingState />;

  const hasBusiness = !!business;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-5 h-5 text-foreground" />
        <h1 className="text-xl font-semibold text-foreground">{t('thai.owner.title')}</h1>
        {business && (
          <Badge variant={business.is_active ? 'secondary' : 'outline'}>
            {business.is_active ? t('thai.owner.active') : t('thai.owner.pendingModeration')}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">{t('thai.owner.tab.profile')}</TabsTrigger>
          <TabsTrigger value="services" disabled={!hasBusiness}>{t('thai.owner.tab.services')}</TabsTrigger>
          <TabsTrigger value="messages" disabled={!hasBusiness}>{t('thai.owner.tab.messages')}</TabsTrigger>
          <TabsTrigger value="bookings" disabled={!hasBusiness}>{t('thai.owner.tab.bookings')}</TabsTrigger>
          <TabsTrigger value="landing" disabled={!hasBusiness}>{t('thai.owner.tab.landing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4"><ProfileTab business={business ?? null} /></TabsContent>
        {hasBusiness && (
          <>
            <TabsContent value="services" className="mt-4"><ServicesTab businessId={business.id} /></TabsContent>
            <TabsContent value="messages" className="mt-4"><MessagesTab businessId={business.id} /></TabsContent>
            <TabsContent value="bookings" className="mt-4"><BookingsTab businessId={business.id} /></TabsContent>
            <TabsContent value="landing" className="mt-4"><LandingTab business={business} /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
