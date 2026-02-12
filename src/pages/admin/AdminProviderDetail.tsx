import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProviderDetails } from '@/hooks/useProviderDetails';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, Building2, Handshake, Package, ShoppingCart, FileText, CalendarCheck } from 'lucide-react';
import { ProviderContractEditor } from '@/components/admin/ProviderContractEditor';
import {
  ProviderDetailHeader,
  ProviderQuickStats,
  ProviderOverviewTab,
  ProviderServicesTab,
  ProviderProductsTab,
  ProviderContractsTab,
  ProviderBookingsTab,
} from '@/components/admin/provider-detail';

export default function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('overview');

  const { provider, services, products, contracts, bookings, isLoading, error, refetch } = useProviderDetails(id || null);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-medium mb-2">
              {isRussian ? 'Провайдер не найден' : 'Provider not found'}
            </h3>
            <Button variant="outline" onClick={() => navigate('/admin/providers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isRussian ? 'Назад к списку' : 'Back to list'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <ProviderDetailHeader provider={provider} onUpdate={refetch} />
      <ProviderQuickStats provider={provider} services={services} products={products} contracts={contracts} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 w-full max-w-3xl">
          <TabsTrigger value="overview" className="gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Обзор' : 'Overview'}</span>
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="gap-1">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Условия' : 'Terms'}</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Услуги' : 'Services'}</span>
            {services.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{services.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Товары' : 'Products'}</span>
            {products.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{products.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Контракты' : 'Contracts'}</span>
            {contracts.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{contracts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Заказы' : 'Bookings'}</span>
            {bookings.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{bookings.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <ProviderOverviewTab provider={provider} />
        </TabsContent>

        <TabsContent value="collaboration" className="mt-4">
          <div className="max-w-2xl">
            <ProviderContractEditor providerId={provider.id} providerName={provider.name} />
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ProviderServicesTab services={services} providerId={provider.id} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProviderProductsTab products={products} providerId={provider.id} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <ProviderContractsTab contracts={contracts} providerId={provider.id} />
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <ProviderBookingsTab bookings={bookings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
