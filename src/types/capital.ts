// Capital CRM — TypeScript types matching capital_* Supabase tables

export type BuyerType = 'investor_rental' | 'investor_resale' | 'end_user' | 'mixed';
export type Warmth = 'cold' | 'warm' | 'hot' | 'client';
export type PreferredChannel = 'whatsapp' | 'telegram' | 'email' | 'phone';
export type ConstructionStatus = 'off_plan' | 'under_construction' | 'completed';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type OutreachChannel = 'whatsapp' | 'telegram' | 'email' | 'phone' | 'meeting';
export type ResponseType = 'interested' | 'not_now' | 'declined' | 'no_response';
export type PipelineStage = 'lead' | 'qualified' | 'viewing' | 'reservation' | 'contract' | 'closed_won' | 'closed_lost';

// ── Contacts ──
export interface CapitalContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  telegram_id: string | null;
  whatsapp_phone: string | null;
  preferred_channel: PreferredChannel;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  buyer_type: BuyerType | null;
  warmth: Warmth;
  source: string | null;
  tags: string[];
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type CapitalContactInsert = Omit<CapitalContact, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type CapitalContactUpdate = Partial<Omit<CapitalContact, 'id' | 'created_at' | 'updated_at'>>;

// ── Projects ──
export interface CapitalProject {
  id: string;
  name: string;
  developer: string | null;
  location_area: string | null;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  completion_date: string | null;
  construction_status: ConstructionStatus | null;
  target_buyer_types: string[];
  selling_points: string[];
  commission_pct: number | null;
  is_active: boolean;
  materials_url: string | null;
  units_total: number | null;
  units_available: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type CapitalProjectInsert = Omit<CapitalProject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type CapitalProjectUpdate = Partial<Omit<CapitalProject, 'id' | 'created_at' | 'updated_at'>>;

// ── Campaigns ──
export interface CapitalCampaign {
  id: string;
  name: string;
  project_id: string | null;
  target_criteria: Record<string, unknown>;
  status: CampaignStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  user_id: string;
}

export type CapitalCampaignInsert = Omit<CapitalCampaign, 'id' | 'created_at'> & {
  id?: string;
};

export type CapitalCampaignUpdate = Partial<Omit<CapitalCampaign, 'id' | 'created_at'>>;

// ── Outreach ──
export interface CapitalOutreach {
  id: string;
  campaign_id: string | null;
  contact_id: string;
  project_id: string | null;
  channel: OutreachChannel | null;
  message_text: string | null;
  sent_at: string | null;
  delivered: boolean;
  read: boolean;
  replied: boolean;
  response_type: ResponseType | null;
  follow_up_date: string | null;
  follow_up_done: boolean;
  notes: string | null;
  created_at: string;
  user_id: string;
}

export type CapitalOutreachInsert = Omit<CapitalOutreach, 'id' | 'created_at'> & {
  id?: string;
};

export type CapitalOutreachUpdate = Partial<Omit<CapitalOutreach, 'id' | 'created_at'>>;

// ── Pipeline ──
export interface CapitalPipelineDeal {
  id: string;
  contact_id: string;
  project_id: string | null;
  campaign_id: string | null;
  stage: PipelineStage;
  unit_number: string | null;
  price_agreed: number | null;
  price_currency: string;
  commission_expected: number | null;
  commission_received: number | null;
  stage_changed_at: string;
  lost_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type CapitalPipelineDealInsert = Omit<CapitalPipelineDeal, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type CapitalPipelineDealUpdate = Partial<Omit<CapitalPipelineDeal, 'id' | 'created_at' | 'updated_at'>>;

// ── Message Templates ──
export interface CapitalMessageTemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'telegram' | 'email' | null;
  buyer_type: string | null;
  language: string;
  subject: string | null;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  user_id: string;
}

export type CapitalMessageTemplateInsert = Omit<CapitalMessageTemplate, 'id' | 'created_at'> & {
  id?: string;
};

export type CapitalMessageTemplateUpdate = Partial<Omit<CapitalMessageTemplate, 'id' | 'created_at'>>;

// ── Joined types for UI ──
export interface CapitalOutreachWithDetails extends CapitalOutreach {
  contact?: CapitalContact;
  project?: CapitalProject;
  campaign?: CapitalCampaign;
}

export interface CapitalPipelineDealWithDetails extends CapitalPipelineDeal {
  contact?: CapitalContact;
  project?: CapitalProject;
}

// ── Constants ──
export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  investor_rental: 'Инвестор (аренда)',
  investor_resale: 'Инвестор (перепродажа)',
  end_user: 'Для себя',
  mixed: 'Смешанный',
};

export const WARMTH_LABELS: Record<Warmth, string> = {
  cold: 'Холодный',
  warm: 'Тёплый',
  hot: 'Горячий',
  client: 'Клиент',
};

export const WARMTH_COLORS: Record<Warmth, string> = {
  cold: 'bg-slate-500/20 text-slate-400',
  warm: 'bg-amber-500/20 text-amber-400',
  hot: 'bg-red-500/20 text-red-400',
  client: 'bg-emerald-500/20 text-emerald-400',
};

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  lead: 'Лид',
  qualified: 'Квалифицирован',
  viewing: 'Просмотр',
  reservation: 'Бронь',
  contract: 'Договор',
  closed_won: 'Закрыт (успех)',
  closed_lost: 'Закрыт (отказ)',
};

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  lead: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  qualified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  viewing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  reservation: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  contract: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed_won: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed_lost: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Черновик',
  active: 'Активна',
  paused: 'Пауза',
  completed: 'Завершена',
};

export const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
  phone: 'Звонок',
  meeting: 'Встреча',
};

export const CONSTRUCTION_STATUS_LABELS: Record<ConstructionStatus, string> = {
  off_plan: 'Off-plan',
  under_construction: 'Строится',
  completed: 'Завершён',
};

export const PIPELINE_STAGES_ORDER: PipelineStage[] = [
  'lead', 'qualified', 'viewing', 'reservation', 'contract', 'closed_won', 'closed_lost',
];
