import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminProviders } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Home, ShoppingCart, Table2, Building2 } from 'lucide-react';
import { CatalogServicesTab } from '@/components/admin/catalog/CatalogServicesTab';
import { CatalogPropertiesTab } from '@/components/admin/catalog/CatalogPropertiesTab';
import { CatalogProductsTab } from '@/components/admin/catalog/CatalogProductsTab';
import { UnifiedCatalogTable } from '@/components/admin/catalog/UnifiedCatalogTable';
import { ContentCreatorMenu } from '@/components/admin/ContentCreatorMenu';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ds';
import { PageContainer } from '@/components/uno/PageContainer';

export default function AdminUnifiedCatalog() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('data');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  
  const { providers } = useAdminProviders();
  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title={isRussian ? 'Единый каталог' : 'Unified Catalog'}
          subtitle={isRussian ? 'Все объекты и товары в одном месте' : 'All services and products in one place'}
          icon={Package}
          size="md"
        />
        
        {/* Provider Selector + Create Menu */}
        <div className="flex items-center gap-2">
          <Select value={selectedProviderId || '_all'} onValueChange={(v) => setSelectedProviderId(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs sm:text-sm">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={isRussian ? 'Выберите провайдера' : 'Select provider'} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="_all">
                {isRussian ? 'Все провайдеры' : 'All providers'}
              </SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[180px]">{provider.name}</span>
                    {provider.is_verified && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedProviderId && (
            <ContentCreatorMenu 
              providerId={selectedProviderId} 
              providerName={selectedProvider?.name}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="data" className="gap-2">
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Данные' : 'Data'}</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Услуги' : 'Services'}</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Недвижимость' : 'Properties'}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Товары' : 'Products'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <UnifiedCatalogTable />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск по названию...' : 'Search by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRussian ? 'Статус' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRussian ? 'Все статусы' : 'All statuses'}</SelectItem>
                <SelectItem value="active">{isRussian ? 'Активные' : 'Active'}</SelectItem>
                <SelectItem value="pending">{isRussian ? 'На модерации' : 'Pending'}</SelectItem>
                <SelectItem value="inactive">{isRussian ? 'Неактивные' : 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CatalogServicesTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="properties" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск по названию...' : 'Search by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <CatalogPropertiesTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск по названию...' : 'Search by name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <CatalogProductsTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
