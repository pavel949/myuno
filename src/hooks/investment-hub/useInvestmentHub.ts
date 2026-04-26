import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { IntroRequest, InvestmentHubZone, InvestmentOpportunity } from '@/types/investmentHub';
import { useInvestmentProjects } from '@/hooks/useInvestmentProjects';

interface OpportunityRow {
  id: string;
  title: string;
  asset_class: string;
  stage: string;
  fit_score: number | null;
  reliability_score: number | null;
  execution_score: number | null;
  target_raise_usd: number | null;
  min_ticket_usd: number | null;
  zone: InvestmentHubZone;
  metadata: Record<string, unknown> | null;
}

interface IntroRequestRow {
  id: string;
  opportunity_id: string;
  investor_entity_id: string;
  project_entity_id: string;
  intro_status: string;
  fee_type: string;
  created_at: string;
}

function getZoneFromProjectType(projectType: string): InvestmentHubZone {
  if (projectType.startsWith('real_estate')) return 'market';
  if (projectType.includes('tech') || projectType.includes('franchise')) return 'deals';
  if (projectType.includes('hospitality') || projectType.includes('restaurant')) return 'network';
  return 'execution';
}

export function useHubOpportunities(zone: InvestmentHubZone) {
  const projectsQuery = useInvestmentProjects();

  const opportunitiesQuery = useQuery({
    queryKey: ['investment-hub-opportunities', zone],
    queryFn: async () => {
      const { data, error } = await typedFrom('investment_opportunities')
        .select('id,title,asset_class,stage,fit_score,reliability_score,execution_score,target_raise_usd,min_ticket_usd,zone,metadata')
        .eq('zone', zone)
        .order('fit_score', { ascending: false, nullsFirst: false })
        .limit(20);

      if (error) throw error;

      return ((data ?? []) as OpportunityRow[]).map((item) => ({
        id: item.id,
        title: item.title,
        metadata: item.metadata,
        assetClass: item.asset_class,
        stage: item.stage,
        fitScore: item.fit_score,
        reliabilityScore: item.reliability_score,
        executionScore: item.execution_score,
        targetRaiseUsd: item.target_raise_usd,
        minTicketUsd: item.min_ticket_usd,
        zone: item.zone,
      })) as InvestmentOpportunity[];
    },
    retry: false,
  });

  const fallbackOpportunities = useMemo<InvestmentOpportunity[]>(() => {
    const projects = projectsQuery.data ?? [];

    return projects
      .filter((project) => getZoneFromProjectType(project.project_type) === zone)
      .slice(0, 12)
      .map((project) => ({
        id: project.id,
        title: project.title_en,
        assetClass: project.project_type.startsWith('real_estate') ? 'real_estate' : 'mixed_use',
        stage: 'qualified',
        fitScore: project.muuno_score,
        reliabilityScore: project.is_verified ? 80 : 55,
        executionScore: project.is_hot ? 75 : 60,
        targetRaiseUsd: project.funding_goal,
        minTicketUsd: project.min_investment,
        zone,
      }));
  }, [projectsQuery.data, zone]);

  if (opportunitiesQuery.error) {
    return {
      data: fallbackOpportunities,
      isLoading: projectsQuery.isLoading,
      source: 'fallback' as const,
    };
  }

  return {
    data: opportunitiesQuery.data ?? [],
    isLoading: opportunitiesQuery.isLoading,
    source: 'hub' as const,
  };
}

export function useHubIntroRequests() {
  return useQuery({
    queryKey: ['investment-hub-intro-requests'],
    queryFn: async () => {
      const { data, error } = await typedFrom('intro_requests')
        .select('id,opportunity_id,investor_entity_id,project_entity_id,intro_status,fee_type,created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return ((data ?? []) as IntroRequestRow[]).map((item) => ({
        id: item.id,
        opportunityId: item.opportunity_id,
        investorEntityId: item.investor_entity_id,
        projectEntityId: item.project_entity_id,
        introStatus: item.intro_status,
        feeType: item.fee_type,
        createdAt: item.created_at,
      })) as IntroRequest[];
    },
    retry: false,
  });
}
