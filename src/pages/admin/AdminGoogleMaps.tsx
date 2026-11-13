import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminGoogleMapsSettings from './AdminGoogleMapsSettings';
import AdminGoogleMapsDiagnostics from './AdminGoogleMapsDiagnostics';

export default function AdminGoogleMaps() {
  return (
    <AdminTabbedWorkspace
      titleEn="Google Maps"
      titleRu="Google Maps"
      subtitleEn="API key settings and connection diagnostics"
      subtitleRu="Настройки API-ключа и диагностика подключения"
      tabs={[
        { value: 'settings', labelEn: 'Settings', labelRu: 'Настройки', content: <AdminGoogleMapsSettings /> },
        { value: 'diagnostics', labelEn: 'Diagnostics', labelRu: 'Диагностика', content: <AdminGoogleMapsDiagnostics /> },
      ]}
    />
  );
}
