/**
 * ClusterRail — one cluster shown as an icon grid (4×2 / 6×N) on Home.
 * Pulls services from FLAT_SERVICES via clusterId, role-ranked, top N.
 */
import React, { useMemo } from 'react';
import {
  AVAILABLE_SERVICES,
  getClusterById,
  type ClusterId,
} from '@/lib/catalog/taxonomy';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLifeOSRole } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import { rankServices } from '@/lib/superapp/rankServices';
import { IconGrid } from './IconGrid';

export interface ClusterRailProps {
  clusterId: ClusterId;
  limit?: number;
}

export const ClusterRail: React.FC<ClusterRailProps> = ({ clusterId, limit = 8 }) => {
  const { effectivePersonas } = useUserPersonas();
  const role = useLifeOSRole();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  const cluster = getClusterById(clusterId);

  const services = useMemo(() => {
    const inCluster = AVAILABLE_SERVICES.filter((s) => s.clusterId === clusterId);
    return rankServices(inCluster, { role, personas: effectivePersonas }).slice(0, limit);
  }, [clusterId, role, effectivePersonas, limit]);

  if (!cluster || services.length === 0) return null;

  return (
    <IconGrid
      title={isRu ? cluster.labelRu : isTh ? (cluster.labelTh ?? cluster.labelEn) : cluster.labelEn}
      count={AVAILABLE_SERVICES.filter((s) => s.clusterId === clusterId).length}
      seeAllHref={cluster.homeRoute}
      services={services}
    />
  );
};

export default ClusterRail;
