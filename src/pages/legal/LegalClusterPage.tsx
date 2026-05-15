import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { ClusterAppCard } from '@/components/uno/ClusterAppCard';
import { APP_ROUTES } from '@/lib/config/routes';
import { getServiceCatalogStatus, getServiceIcon, type ServiceStatus } from '@/lib/catalog';
import { Scale, Plane, Calculator, FileSearch, Shield, FileText, type LucideIcon } from 'lucide-react';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';

interface ClusterApp {
  serviceId: string;
  label: string;
  labelRu: string;
  desc: string;
  descRu: string;
  path: string;
  fallbackIcon: LucideIcon;
  statusOverride?: ServiceStatus;
}

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

function resolveStatus(app: ClusterApp): ServiceStatus {
  return app.statusOverride ?? getServiceCatalogStatus(app.serviceId) ?? 'available';
}

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
        <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 xl:grid-cols-3">
          {APPS.map((app) => {
            const Icon = getServiceIcon(app.serviceId, app.fallbackIcon);
            return (
              <ClusterAppCard
                key={app.path}
                clusterId="legal"
                icon={Icon}
                title={t ? app.labelRu : app.label}
                description={t ? app.descRu : app.desc}
                path={app.path}
                status={resolveStatus(app)}
              />
            );
          })}
        </div>

        <div className="mt-6 px-4">
          <ExploreMoreRail clusterId="legal" />
        </div>
      </div>
    </AppLayout>
  );
}
