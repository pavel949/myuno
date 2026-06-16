/**
 * ClusterOverviewPage — generic cluster landing for the 3 clusters that
 * historically had no dedicated page:  /live  /manage  /build.
 *
 * Derives content from the catalog SSOT (`src/lib/catalog/taxonomy.ts`):
 *   - hero icon/colour come from CLUSTERS[clusterId]
 *   - rendered apps come from FLAT_SERVICES filtered by clusterId
 *   - categories breadcrumb via ClusterBreadcrumb
 *   - "explore more" rail at the bottom
 *
 * The `manage` cluster is `audience: 'workspace'` (CATEGORIES has no public
 * services for it). For that case we render a workspace pointer instead of
 * an empty grid. /arrive, /invest and /stay-legal stay on their specialised
 * pages (ArriveClusterPage, InvestmentHubLanding, LegalClusterPage).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalmClusterHero } from '@/components/uno/CalmClusterHero';
import { ClusterAppCard } from '@/components/uno/ClusterAppCard';
import { ClusterBreadcrumb } from '@/components/navigation/ClusterBreadcrumb';
import { ExploreMoreRail } from '@/components/navigation/ExploreMoreRail';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CLUSTERS,
  FLAT_SERVICES,
  getClusterById,
  type ClusterId,
} from '@/lib/catalog/taxonomy';
import { APP_ROUTES } from '@/lib/config/routes';

interface ClusterOverviewPageProps {
  clusterId: ClusterId;
}

export default function ClusterOverviewPage({ clusterId }: ClusterOverviewPageProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const cluster = useMemo(() => getClusterById(clusterId), [clusterId]);
  const services = useMemo(
    () => FLAT_SERVICES.filter((s) => s.clusterId === clusterId),
    [clusterId],
  );

  if (!cluster) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-muted-foreground">
          {isRu ? 'Кластер не найден.' : 'Cluster not found.'}
          <div className="mt-4">
            <Link to="/" className="text-primary underline">
              {isRu ? 'На главную' : 'Back home'}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const HeroIcon = cluster.icon;
  const isWorkspace = cluster.audience === 'workspace';

  return (
    <AppLayout>
      <div className="pb-24">
        <CalmClusterHero
          clusterId={clusterId}
          icon={HeroIcon}
          title={isRu ? cluster.labelRu : cluster.labelEn}
          subtitle={isRu ? cluster.valueRu : cluster.valueEn}
          fallbackPath="/"
        />

        <div className="px-4 py-3">
          <ClusterBreadcrumb
            clusterId={clusterId}
            serviceLabelRu="Все сервисы"
            serviceLabelEn="All services"
          />
        </div>

        {isWorkspace && (
          <WorkspaceClusterBanner clusterId={clusterId} />
        )}

        {!isWorkspace && services.length > 0 && (
          <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <ClusterAppCard
                  key={svc.id}
                  clusterId={clusterId}
                  icon={Icon}
                  title={isRu ? svc.labelRu : svc.labelEn}
                  description={isRu ? svc.categoryLabelRu : svc.categoryLabelEn}
                  path={svc.path}
                  status={svc.status}
                />
              );
            })}
          </div>
        )}

        {clusterId === 'build' && (
          <div className="mt-4 px-4">
            <Link
              to={APP_ROUTES.NEWBUILDS}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-primary/[0.035]"
            >
              <span>
                <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                  {isRu ? 'Витрина новостроек' : 'New developments showcase'}
                </span>
                <span className="block text-[12px] text-muted-foreground mt-0.5">
                  {isRu
                    ? 'ClearView-рейтинги, фильтры, off-plan и resale.'
                    : 'ClearView ratings, filters, off-plan and resale.'}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
            </Link>
          </div>
        )}

        <div className="mt-6 px-4">
          <ExploreMoreRail clusterId={clusterId} />
        </div>
      </div>
    </AppLayout>
  );
}

function WorkspaceClusterBanner({ clusterId }: { clusterId: ClusterId }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const target =
    clusterId === 'manage'
      ? { to: '/mc', labelRu: 'Кабинет управления (MC)', labelEn: 'Management cabinet (MC)' }
      : { to: '/', labelRu: 'Главная', labelEn: 'Home' };

  return (
    <div className="mx-4 my-4 rounded-2xl border border-border bg-muted/40 p-5">
      <p className="text-[15px] font-semibold tracking-tight text-foreground">
        {isRu
          ? 'Это рабочая зона оператора и собственника.'
          : 'This is a workspace for operators and owners.'}
      </p>
      <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
        {isRu
          ? 'Управление объектами, командой и финансами доступно через рабочий кабинет.'
          : 'Property, team and finance operations live in the workspace cabinet.'}
      </p>
      <Link
        to={target.to}
        className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
      >
        {isRu ? target.labelRu : target.labelEn}
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}

// Re-export `CLUSTERS` so the file is self-contained at the symbol level.
export { CLUSTERS };
