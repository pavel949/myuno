/**
 * OwnerTransparencyDashboard — Read-only portal for property owners
 * to monitor management company activities in real-time.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyUserRole } from '@/hooks/usePropertyDelegates';
import { useSupabaseSingle } from '@/hooks/useSupabaseQuery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { OwnerOverviewTab } from '@/components/owner/transparency/OwnerOverviewTab';
import { ActivityFeed } from '@/components/owner/transparency/ActivityFeed';
import { OwnerFinanceTab } from '@/components/owner/transparency/OwnerFinanceTab';
import { OwnerBookingsTab } from '@/components/owner/transparency/OwnerBookingsTab';
import { OwnerTermsTab } from '@/components/owner/transparency/OwnerTermsTab';
import { OwnerReportsTab } from '@/components/owner/transparency/OwnerReportsTab';
import { OwnerNotificationBell } from '@/components/owner/transparency/OwnerNotificationBell';

export default function OwnerTransparencyDashboard() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();

  const { data: role, isLoading: roleLoading } = usePropertyUserRole(propertyId);
  const { data: property, isLoading: propLoading } = useSupabaseSingle<any>({
    table: 'properties',
    id: propertyId,
    select: 'id, title, title_ru, address, cover_image',
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{isRu ? 'Необходима авторизация' : 'Authentication required'}</p>
      </div>
    );
  }

  if (roleLoading || propLoading) {
    return (
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <div className="h-8 bg-muted animate-pulse rounded-none w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-none" />)}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-none" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{isRu ? 'Нет доступа' : 'Access denied'}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isRu
            ? 'У вас нет прав для просмотра этого объекта. Попросите управляющую компанию отправить вам приглашение.'
            : 'You don\'t have permission to view this property. Ask the management company to send you an invitation.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/property/my')}>
          {isRu ? 'Назад' : 'Go back'}
        </Button>
      </div>
    );
  }

  const propertyTitle = isRu ? (property?.title_ru || property?.title) : property?.title;

  return (
    <div className="p-4 space-y-5 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackPath={APP_ROUTES.OWNER} variant="ghost" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{propertyTitle || (isRu ? 'Объект' : 'Property')}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            {isRu ? 'Режим просмотра — только чтение' : 'Read-only view'}
          </div>
        </div>
        <OwnerNotificationBell />
      </div>

      {/* Cover image */}
      {property?.cover_image && (
        <div className="rounded-none overflow-hidden h-40">
          <img src={property.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview">{isRu ? 'Обзор' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="activity">{isRu ? 'Лента' : 'Activity'}</TabsTrigger>
          <TabsTrigger value="finance">{isRu ? 'Финансы' : 'Finance'}</TabsTrigger>
          <TabsTrigger value="reports">{isRu ? 'Отчёты' : 'Reports'}</TabsTrigger>
          <TabsTrigger value="bookings">{isRu ? 'Брони' : 'Bookings'}</TabsTrigger>
          <TabsTrigger value="terms">{isRu ? 'Условия' : 'Terms'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OwnerOverviewTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="finance">
          <OwnerFinanceTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="reports">
          <OwnerReportsTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="bookings">
          <OwnerBookingsTab propertyId={propertyId!} />
        </TabsContent>

        <TabsContent value="terms">
          <OwnerTermsTab propertyId={propertyId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
