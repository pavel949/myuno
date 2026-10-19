import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { GroupedServiceDestinations, type ServiceDestination } from '@/components/services/GroupedServiceDestinations';
import { APP_ROUTES } from '@/lib/config/routes';
import { Scale, Plane, Calculator, FileSearch, Shield, FileText } from 'lucide-react';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';

type ClusterApp = ServiceDestination;

const APPS: ClusterApp[] = [
  {
    serviceId: 'visa',
    label: 'VisaTrack',
    labelRu: 'Визы',
    desc: 'Track visa expiry & renewals',
    descRu: 'Отслеживайте сроки визы',
    path: APP_ROUTES.VISA_IMMIGRATION,
    fallbackIcon: Plane,
  },
  {
    serviceId: 'tax',
    label: 'TaxNav',
    labelRu: 'Налоги',
    desc: 'Tax obligations navigator',
    descRu: 'Навигатор налоговых обязательств',
    path: APP_ROUTES.TAX_NAV,
    fallbackIcon: Calculator,
  },
  {
    serviceId: 'contract-ai',
    label: 'ContractAI',
    labelRu: 'Анализ договоров',
    desc: 'AI contract analysis',
    descRu: 'AI-анализ договоров',
    path: APP_ROUTES.CONTRACT_ANALYSIS,
    fallbackIcon: FileSearch,
  },
  {
    serviceId: 'insurance',
    label: 'Insurance',
    labelRu: 'Страхование',
    desc: 'Health & property insurance',
    descRu: 'Медицинское и имущественное',
    path: APP_ROUTES.INSURANCE,
    fallbackIcon: Shield,
  },
  {
    serviceId: 'legal',
    label: 'Legal Services',
    labelRu: 'Юридические услуги',
    desc: 'Lawyers & notaries',
    descRu: 'Юристы и нотариусы',
    path: APP_ROUTES.LEGAL,
    fallbackIcon: FileText,
  },
];

export default function LegalClusterPage() {
  const { language } = useLanguage();
  const t = language === 'ru';

  return (
    <AppLayout>
      <div className="pb-24">
        <CalmClusterHero
          clusterId="legal"
          icon={Scale}
          title={t ? 'Юридические сервисы' : 'Legal services'}
          subtitle={t ? 'Визы, налоги, договоры, страхование, юристы' : 'Visas, taxes, contracts, insurance, lawyers'}
          fallbackPath="/"
        />

        <div className="px-4 py-3">
          <ClusterBreadcrumb clusterId="legal" serviceLabelRu="Все сервисы" serviceLabelEn="All services" />
        </div>
        <div className="px-4"><GroupedServiceDestinations apps={APPS} clusterId="legal" idPrefix="legal-services" /></div>

        <div className="mt-6 px-4">
          <ExploreMoreRail clusterId="legal" />
        </div>
      </div>
    </AppLayout>
  );
}
