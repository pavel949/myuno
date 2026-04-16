export type InvestmentHubRole = 'investor' | 'project_owner' | 'advisor' | 'operator' | 'admin';

export type InvestmentHubZone = 'market' | 'deals' | 'network' | 'execution';

export type InvestmentAssetClass =
  | 'real_estate'
  | 'hospitality'
  | 'fnb'
  | 'retail'
  | 'marine'
  | 'wellness'
  | 'tech'
  | 'franchise'
  | 'mixed_use';

export interface InvestmentHubJtbd {
  id: string;
  role: InvestmentHubRole;
  titleEn: string;
  titleRu: string;
  titleTh: string;
  successSignalEn: string;
  successSignalRu: string;
  successSignalTh: string;
}

export interface InvestmentHubScenario {
  id: string;
  zone: InvestmentHubZone;
  titleEn: string;
  titleRu: string;
  titleTh: string;
  stepsEn: string[];
  stepsRu: string[];
  stepsTh: string[];
}

export interface HubEntity {
  id: string;
  entityType: 'company' | 'fund' | 'project' | 'person';
  name: string;
  countryCode: string;
  city: string | null;
  verifiedAt: string | null;
  reliabilityScore: number | null;
}

export interface InvestmentOpportunity {
  id: string;
  title: string;
  metadata?: Record<string, unknown> | null;
  assetClass: InvestmentAssetClass;
  stage: 'screening' | 'qualified' | 'intro' | 'dd' | 'closed' | 'lost';
  fitScore: number | null;
  reliabilityScore: number | null;
  executionScore: number | null;
  targetRaiseUsd: number | null;
  minTicketUsd: number | null;
  zone: InvestmentHubZone;
}

export interface IntroRequest {
  id: string;
  opportunityId: string;
  investorEntityId: string;
  projectEntityId: string;
  introStatus: 'new' | 'qualified' | 'scheduled' | 'declined' | 'completed';
  feeType: 'intro_fee' | 'success_fee';
  createdAt: string;
}
