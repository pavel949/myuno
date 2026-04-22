/**
 * ClusterBreadcrumb — contextual breadcrumb showing cluster > service
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getClusterById } from '@/lib/nav/clusterCatalog';
import { ECOSYSTEM_CLUSTER_HEADER_TRIPLET, pickTriplet } from '@/lib/ecosystemGlossary';
const CLUSTER_PATHS: Record<string, string> = {
  arrive: '/cluster/arrive',
  live: '/discover',
  legal: '/cluster/legal',
  invest: '/cluster/invest',
  manage: '/mc',
  build: '/for-management-companies',
  enjoy: '/discover',
  family: '/discover',
};

interface ClusterBreadcrumbProps {
  clusterId: string;
  serviceLabelRu: string;
  serviceLabelEn: string;
  className?: string;
}

export function ClusterBreadcrumb({ clusterId, serviceLabelRu, serviceLabelEn, className }: ClusterBreadcrumbProps) {
  const { language } = useLanguage();
  const entry = getClusterById(clusterId);
  const path = CLUSTER_PATHS[clusterId];
  const trip = ECOSYSTEM_CLUSTER_HEADER_TRIPLET[clusterId];
  const clusterTitle = entry
    ? pickTriplet(
        { ru: entry.labelRu, en: entry.labelEn, th: entry.labelTh ?? entry.labelEn },
        language,
      )
    : trip
      ? pickTriplet(trip, language)
      : null;

  if (!clusterTitle || !path) return null;

  const color = entry?.color ?? '#94a3b8';

  return (
    <nav className={`flex items-center gap-1.5 text-xs ${className || ''}`}>
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <Link
        to={path}
        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        {clusterTitle}
      </Link>
      <span className="text-muted-foreground/40">›</span>
      <span className="text-muted-foreground">
        {pickTriplet(
          { ru: serviceLabelRu, en: serviceLabelEn, th: serviceLabelEn },
          language,
        )}
      </span>
    </nav>
  );
}
