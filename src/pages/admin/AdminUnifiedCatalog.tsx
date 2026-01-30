import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Home, ShoppingCart } from 'lucide-react';
import { CatalogServicesTab } from '@/components/admin/catalog/CatalogServicesTab';
import { CatalogPropertiesTab } from '@/components/admin/catalog/CatalogPropertiesTab';
import { CatalogProductsTab } from '@/components/admin/catalog/CatalogProductsTab';

export default function AdminUnifiedCatalog() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('services');

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {isRussian ? 'Единый каталог' : 'Unified Catalog'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRussian ? 'Все объекты и товары в одном месте' : 'All services and products in one place'}
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
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

        <TabsContent value="services" className="mt-4">
          <CatalogServicesTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="properties" className="mt-4">
          <CatalogPropertiesTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <CatalogProductsTab searchQuery={searchQuery} statusFilter={statusFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
