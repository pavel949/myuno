import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { AdminCatalogHub } from '@/components/admin/AdminCatalogHub';
import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminUnifiedCatalog from './AdminUnifiedCatalog';
import AdminMasterCatalog from './AdminMasterCatalog';
import AdminTaxonomyManager from './AdminTaxonomyManager';
import AdminLookups from './AdminLookups';
import AdminServices from './AdminServices';

export default function AdminCatalogWorkspace() {
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const legacyTabs = ['catalog', 'categories', 'taxonomy', 'lookups', 'services'];
  if (!legacyTabs.includes(params.get('tab') ?? '')) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Каталоги' : 'Catalogs'} subtitle={isRu ? 'Что хотите добавить или обновить?' : 'What would you like to add or update?'} />
        <AdminCatalogHub />
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">{isRu ? 'Дополнительные инструменты' : 'Additional tools'}</summary>
          <nav className="mt-3 flex flex-wrap gap-4" aria-label={isRu ? 'Инструменты каталогов' : 'Catalog tools'}>
            {[
              ['catalog', 'Все объявления', 'All listings'],
              ['taxonomy', 'Связи и теги', 'Relationships and tags'],
              ['lookups', 'Справочники', 'Reference data'],
            ].map(([tab, ru, en]) => <Link className="inline-flex min-h-11 items-center text-sm text-primary underline" key={tab} to={`?tab=${tab}`}>{isRu ? ru : en}</Link>)}
            <Link className="inline-flex min-h-11 flex-col justify-center text-sm text-primary underline" to="/admin/life-situations">
              {isRu ? 'Жизненные ситуации' : 'Life situations'}
              <span className="text-xs text-muted-foreground">{isRu ? 'Связи предложений с задачами клиентов' : 'Connect offerings with customer needs'}</span>
            </Link>
          </nav>
        </details>
      </PageContainer>
    );
  }
  return (
    <>
    <div className="px-4 pt-4"><Link to="/admin/catalog" className="inline-flex min-h-11 items-center text-sm text-primary underline">{isRu ? '← Все каталоги' : '← All catalogs'}</Link></div>
    <AdminTabbedWorkspace
      titleEn="Catalog"
      titleRu="Каталог"
      subtitleEn="Listings, categories, taxonomy and reference data"
      subtitleRu="Объявления, категории, таксономия и справочники"
      tabs={[
        { value: 'overview', labelEn: 'All catalogs', labelRu: 'Все каталоги', content: <AdminCatalogHub /> },
        { value: 'catalog', labelEn: 'Catalog', labelRu: 'Каталог', content: <AdminUnifiedCatalog /> },
        { value: 'categories', labelEn: 'Categories', labelRu: 'Категории', content: <AdminMasterCatalog /> },
        { value: 'taxonomy', labelEn: 'Taxonomy', labelRu: 'Таксономия', content: <AdminTaxonomyManager /> },
        { value: 'lookups', labelEn: 'Reference data', labelRu: 'Справочники', content: <AdminLookups /> },
        { value: 'services', labelEn: 'Service editor', labelRu: 'Редактор услуг', content: <AdminServices /> },
      ]}
    />
    </>
  );
}
