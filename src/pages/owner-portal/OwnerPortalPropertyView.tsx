/**
 * OwnerPortalPropertyView — Full property portal for an owner.
 * Shows only what MC has enabled via owner_portal_settings.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerPortalSettings } from '@/hooks/useOwnerPortalSettings';
import { useSupabaseSingle } from '@/hooks/useSupabaseQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Building2, Calendar, DollarSign, Wrench, FileText, Zap, MessageSquare, Home } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { OwnerOverviewTab } from '@/components/owner/transparency/OwnerOverviewTab';
import { OwnerFinanceTab } from '@/components/owner/transparency/OwnerFinanceTab';
import { OwnerBookingsTab } from '@/components/owner/transparency/OwnerBookingsTab';
import { OwnerTermsTab } from '@/components/owner/transparency/OwnerTermsTab';
import { ActivityFeed } from '@/components/owner/transparency/ActivityFeed';
import { PortalChatTab } from '@/components/owner-portal/PortalChatTab';
import { OwnerStaysTab } from '@/components/owner-portal/OwnerStaysTab';
import { PortalUtilitiesTab } from '@/components/owner-portal/PortalUtilitiesTab';
import { PortalDocumentsTab } from '@/components/owner-portal/PortalDocumentsTab';

export default function OwnerPortalPropertyView() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { user } = useAuth();

  const { settings, isLoading: settingsLoading } = useOwnerPortalSettings(propertyId, user?.id);
  const { data: property, isLoading: propLoading } = useSupabaseSingle<any>({
    table: 'properties',
    id: propertyId,
    select: 'id, title, title_ru, address, cover_image',
  });

  if (settingsLoading || propLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{isRu ? 'Доступ не настроен' : isTh ? 'ยังไม่ได้ตั้งค่าการเข้าถึง' : 'Access not configured'}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isRu
            ? 'Управляющая компания ещё не настроила доступ к этому объекту.'
            : isTh
            ? 'บริษัทบริหารจัดการยังไม่ได้ตั้งค่าการเข้าถึงทรัพย์สินนี้'
            : 'The management company has not yet configured access to this property.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/my-property')}>
          {isRu ? 'Назад' : isTh ? 'กลับ' : 'Go back'}
        </Button>
      </div>
    );
  }

  const propertyTitle = isRu ? (property?.title_ru || property?.title) : property?.title;

  // Build available tabs based on settings
  const tabs: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: isRu ? 'Обзор' : isTh ? 'ภาพรวม' : 'Overview', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  if (settings.show_booking_calendar) {
    tabs.push({ key: 'bookings', label: isRu ? 'Бронирования' : isTh ? 'การจอง' : 'Bookings', icon: <Calendar className="w-3.5 h-3.5" /> });
  }
  if (settings.show_financial_statements || settings.show_payouts || settings.show_deposits) {
    tabs.push({ key: 'finance', label: isRu ? 'Финансы' : isTh ? 'การเงิน' : 'Finance', icon: <DollarSign className="w-3.5 h-3.5" /> });
  }
  if (settings.show_maintenance) {
    tabs.push({ key: 'maintenance', label: isRu ? 'Обслуживание' : isTh ? 'งานบำรุงรักษา' : 'Maintenance', icon: <Wrench className="w-3.5 h-3.5" /> });
  }
  if (settings.show_utilities) {
    tabs.push({ key: 'utilities', label: isRu ? 'Коммуналка' : isTh ? 'ค่าสาธารณูปโภค' : 'Utilities', icon: <Zap className="w-3.5 h-3.5" /> });
  }
  if (settings.show_documents) {
    tabs.push({ key: 'documents', label: isRu ? 'Документы' : isTh ? 'เอกสาร' : 'Documents', icon: <FileText className="w-3.5 h-3.5" /> });
  }
  tabs.push({ key: 'messages', label: isRu ? 'Сообщения' : isTh ? 'ข้อความ' : 'Messages', icon: <MessageSquare className="w-3.5 h-3.5" /> });

  if (settings.show_owner_stays) {
    tabs.push({ key: 'stays', label: isRu ? 'Мои визиты' : isTh ? 'การเข้าพักของฉัน' : 'My Stays', icon: <Home className="w-3.5 h-3.5" /> });
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/my-property" variant="ghost" size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{propertyTitle || (isRu ? 'Объект' : isTh ? 'ทรัพย์สิน' : 'Property')}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            {isRu ? 'Портал владельца' : isTh ? 'พอร์ทัลเจ้าของ' : 'Owner Portal'}
          </div>
        </div>
      </div>

      {/* Welcome message */}
      {(isRu ? settings.custom_welcome_message_ru : settings.custom_welcome_message) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 text-sm">
            {isRu ? settings.custom_welcome_message_ru : settings.custom_welcome_message}
          </CardContent>
        </Card>
      )}

      {/* Cover */}
      {property?.cover_image && (
        <div className="rounded-none overflow-hidden h-40">
          <img src={property.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="flex items-center gap-1.5 text-xs">
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OwnerOverviewTab propertyId={propertyId!} />
          {settings.show_occupancy_stats && (
            <div className="mt-4">
              <ActivityFeed propertyId={propertyId!} limit={5} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          <OwnerBookingsTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="finance">
          <OwnerFinanceTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {isRu ? 'История обслуживания' : isTh ? 'ประวัติงานบำรุงรักษา' : 'Maintenance history'}
            <p className="text-xs mt-1">{isRu ? 'Будет доступно в следующем обновлении' : isTh ? 'จะเปิดให้ใช้งานในอัปเดตถัดไป' : 'Coming in next update'}</p>
          </div>
        </TabsContent>

        <TabsContent value="utilities">
          <PortalUtilitiesTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="documents">
          <PortalDocumentsTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="messages">
          <PortalChatTab propertyId={propertyId!} senderRole="owner" />
        </TabsContent>

        <TabsContent value="stays">
          <OwnerStaysTab propertyId={propertyId!} />
        </TabsContent>
      </Tabs>

      {/* myUNO Services promo */}
      <Card className="border-dashed bg-accent/5">
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-1">🛒 {isRu ? 'Услуги myUNO' : isTh ? 'บริการ myUNO' : 'myUNO Services'}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isRu
              ? 'Закажите уборку, ремонт, страховку и другие услуги для вашего объекта'
              : isTh
              ? 'สั่งบริการทำความสะอาด ซ่อมแซม ประกันภัย และบริการอื่น ๆ สำหรับทรัพย์สินของคุณ'
              : 'Order cleaning, repairs, insurance and other services for your property'}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/services')}>
            {isRu ? 'Смотреть услуги' : isTh ? 'ดูบริการ' : 'Browse Services'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
