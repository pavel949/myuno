import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServiceCatalogStatus, getServiceIcon, type ClusterId, type ServiceStatus } from '@/lib/catalog';
import { pickLang } from '@/lib/i18n/pickLang';
import { groupCatalogDestinations } from '@/lib/services/catalogServiceGroups';
import { ClusterAppCard } from '@/components/uno/ClusterAppCard';
import { ServiceCategorySection } from './ServiceCategorySection';

export interface ServiceDestination {
  serviceId: string;
  label: string;
  labelRu: string;
  desc: string;
  descRu: string;
  path: string;
  fallbackIcon: LucideIcon;
  statusOverride?: ServiceStatus;
}

/** Existing navigation actions keep their route and catalogue status. */
export function GroupedServiceDestinations({ apps, clusterId, idPrefix }: {
  apps: ServiceDestination[]; clusterId: ClusterId; idPrefix: string;
}) {
  const { language } = useLanguage();
  return <div className="space-y-6">
    {groupCatalogDestinations(apps).map(group => <ServiceCategorySection key={group.id} id={`${idPrefix}-${group.id}`}
      title={group.category
        ? pickLang(language, { ru: group.category.labelRu, en: group.category.labelEn, th: group.category.labelTh })
        : pickLang(language, { ru: 'Другие услуги и материалы', en: 'Other services and guides', th: 'บริการและคู่มืออื่น ๆ' })}>
      {group.items.map(app => <ClusterAppCard key={`${app.serviceId}:${app.path}`} clusterId={clusterId}
        icon={getServiceIcon(app.serviceId, app.fallbackIcon)}
        title={pickLang(language, { ru: app.labelRu, en: app.label })}
        description={pickLang(language, { ru: app.descRu, en: app.desc })}
        path={app.path} status={app.statusOverride ?? getServiceCatalogStatus(app.serviceId) ?? 'available'} />)}
    </ServiceCategorySection>)}
  </div>;
}
