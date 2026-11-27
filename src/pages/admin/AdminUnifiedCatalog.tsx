import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminProviders } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Table2, Building2, LayoutGrid } from 'lucide-react';
import { UnifiedCatalogTable } from '@/components/admin/catalog/UnifiedCatalogTable';
import { AdminCatalogHub } from '@/components/admin/AdminCatalogHub';
import { ContentCreatorMenu } from '@/components/admin/ContentCreatorMenu';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ds';
import { PageContainer } from '@/components/uno/PageContainer';

/** The existing record workbench and canonical domain editors share one entry. */
export default function AdminUnifiedCatalog() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('data');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const { providers } = useAdminProviders();
  const selectedProvider = providers.find(provider => provider.id === selectedProviderId);

  return <PageContainer>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <SectionHeader title={isRussian ? 'Записи каталога' : 'Catalog records'}
        subtitle={isRussian ? 'Обзор загруженных записей и переход к редакторам каталогов' : 'Loaded records and links to the domain catalog editors'} icon={Package} size="md" />
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <Select value={selectedProviderId || '_all'} onValueChange={value => setSelectedProviderId(value === '_all' ? '' : value)}>
          <SelectTrigger className="min-h-11 w-full sm:w-[220px]" aria-label={isRussian ? 'Поставщик' : 'Provider'}>
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={isRussian ? 'Выберите поставщика' : 'Select provider'} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="_all">{isRussian ? 'Все поставщики' : 'All providers'}</SelectItem>
            {providers.map(provider => <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2"><span className="min-w-0 truncate">{provider.name}</span>
                {provider.is_verified && <Badge variant="secondary">✓</Badge>}
              </div>
            </SelectItem>)}
          </SelectContent>
        </Select>
        {selectedProviderId && <ContentCreatorMenu providerId={selectedProviderId} providerName={selectedProvider?.name} />}
      </div>
    </div>
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 w-full">
      <TabsList className="flex h-auto max-w-full flex-wrap gap-1">
        <TabsTrigger value="data" className="min-h-11 gap-2"><Table2 className="h-4 w-4" />{isRussian ? 'Данные' : 'Data'}</TabsTrigger>
        <TabsTrigger value="catalogs" className="min-h-11 gap-2"><LayoutGrid className="h-4 w-4" />{isRussian ? 'Редакторы каталогов' : 'Catalog editors'}</TabsTrigger>
      </TabsList>
      <TabsContent value="data" className="mt-4"><UnifiedCatalogTable providerId={selectedProviderId || undefined} /></TabsContent>
      <TabsContent value="catalogs" className="mt-4"><AdminCatalogHub /></TabsContent>
    </Tabs>
  </PageContainer>;
}
