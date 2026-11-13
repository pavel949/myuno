import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminLeadConfigs from './AdminLeadConfigs';
import AdminIntakeConfigs from './AdminIntakeConfigs';

export default function AdminFormSettings() {
  return (
    <AdminTabbedWorkspace
      titleEn="Form settings"
      titleRu="Настройки форм"
      subtitleEn="Lead forms and automated data intake"
      subtitleRu="Формы заявок и автоматический приём данных"
      tabs={[
        { value: 'leads', labelEn: 'Request forms', labelRu: 'Формы заявок', content: <AdminLeadConfigs /> },
        { value: 'intake', labelEn: 'Data intake', labelRu: 'Приём данных', content: <AdminIntakeConfigs /> },
      ]}
    />
  );
}
