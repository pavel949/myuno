import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminUnifiedCatalog from './AdminUnifiedCatalog';
import AdminMasterCatalog from './AdminMasterCatalog';
import AdminTaxonomyManager from './AdminTaxonomyManager';
import AdminLookups from './AdminLookups';
import AdminServices from './AdminServices';

export default function AdminCatalogWorkspace() {
  return (
    <AdminTabbedWorkspace
      titleEn="Catalog"
      titleRu="Каталог"
      subtitleEn="Listings, categories, taxonomy and reference data"
      subtitleRu="Объявления, категории, таксономия и справочники"
      tabs={[
        { value: 'catalog', labelEn: 'Catalog', labelRu: 'Каталог', content: <AdminUnifiedCatalog /> },
        { value: 'categories', labelEn: 'Categories', labelRu: 'Категории', content: <AdminMasterCatalog /> },
        { value: 'taxonomy', labelEn: 'Taxonomy', labelRu: 'Таксономия', content: <AdminTaxonomyManager /> },
        { value: 'lookups', labelEn: 'Reference data', labelRu: 'Справочники', content: <AdminLookups /> },
        { value: 'services', labelEn: 'Service editor', labelRu: 'Редактор услуг', content: <AdminServices /> },
      ]}
    />
  );
}
