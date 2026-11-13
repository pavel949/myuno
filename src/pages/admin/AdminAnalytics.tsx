import { AdminTabbedWorkspace } from '@/components/admin/AdminTabbedWorkspace';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import AcquisitionMetrics from './AcquisitionMetrics';
import AdminInvestorMetrics from './AdminInvestorMetrics';
import MarketingDashboard from './marketing/MarketingDashboard';

export default function AdminAnalytics() {
  return (
    <AdminTabbedWorkspace
      titleEn="Analytics"
      titleRu="Аналитика"
      subtitleEn="Visits, acquisition, commercial indicators and marketing"
      subtitleRu="Посещения, привлечение, коммерческие показатели и маркетинг"
      tabs={[
        { value: 'visits', labelEn: 'Visits', labelRu: 'Посещения', content: <AdminAnalyticsDashboard /> },
        { value: 'acquisition', labelEn: 'Acquisition', labelRu: 'Привлечение', content: <AcquisitionMetrics /> },
        { value: 'revenue', labelEn: 'Revenue', labelRu: 'Выручка', content: <AdminInvestorMetrics /> },
        { value: 'marketing', labelEn: 'Marketing', labelRu: 'Маркетинг', content: <MarketingDashboard /> },
      ]}
    />
  );
}
