/**
 * ClusterBreadcrumb — contextual breadcrumb showing cluster > service
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClusterInfo {
  labelRu: string;
  labelEn: string;
  color: string;
  path: string;
}

const CLUSTER_MAP: Record<string, ClusterInfo> = {
  arrive: { labelRu: 'ПРИЕХАТЬ', labelEn: 'ARRIVE', color: '#00D68F', path: '/cluster/arrive' },
  live: { labelRu: 'ЖИТЬ', labelEn: 'LIVE', color: '#4E7BFF', path: '/discover' },
  legal: { labelRu: 'ЛЕГАЛЬНО', labelEn: 'STAY LEGAL', color: '#F59E0B', path: '/cluster/legal' },
  invest: { labelRu: 'КУПИТЬ', labelEn: 'INVEST', color: '#A855F7', path: '/cluster/invest' },
  manage: { labelRu: 'УПРАВЛЯТЬ', labelEn: 'MANAGE', color: '#06B6D4', path: '/mc' },
  build: { labelRu: 'ДЕВЕЛОПЕРАМ', labelEn: 'BUILD', color: '#F43F5E', path: '/for-management-companies' },
};

interface ClusterBreadcrumbProps {
  clusterId: string;
  serviceLabelRu: string;
  serviceLabelEn: string;
  className?: string;
}

export function ClusterBreadcrumb({ clusterId, serviceLabelRu, serviceLabelEn, className }: ClusterBreadcrumbProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const cluster = CLUSTER_MAP[clusterId];

  if (!cluster) return null;

  return (
    <nav className={`flex items-center gap-1.5 text-xs ${className || ''}`}>
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cluster.color }} />
      <Link
        to={cluster.path}
        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        {isRu ? cluster.labelRu : cluster.labelEn}
      </Link>
      <span className="text-muted-foreground/40">›</span>
      <span className="text-muted-foreground">
        {isRu ? serviceLabelRu : serviceLabelEn}
      </span>
    </nav>
  );
}
