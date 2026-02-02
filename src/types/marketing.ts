// Marketing Command Center Types

export type CampaignGoal = 'awareness' | 'acquisition' | 'activation' | 'retention' | 'referral';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type TargetSegment = 'b2c_users' | 'providers' | 'owners' | 'partners';
export type CampaignChannel = 'google' | 'meta' | 'tiktok' | 'email' | 'whatsapp' | 'telegram' | 'push';
export type Currency = 'USD' | 'THB' | 'RUB';

export interface CampaignBudget {
  total: number;
  daily_cap?: number;
  currency: Currency;
}

export interface CampaignSchedule {
  start_date: string;
  end_date?: string;
  timezone?: string;
}

export interface CampaignKPI {
  target_leads?: number;
  target_conversions?: number;
  target_cac?: number;
  target_roas?: number;
}

export interface CampaignPerformance {
  leads?: number;
  conversions?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cvr?: number;
  cac?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal: CampaignGoal;
  target_segment: TargetSegment | null;
  channels: CampaignChannel[];
  budget: CampaignBudget | null;
  schedule: CampaignSchedule | null;
  kpi_targets: CampaignKPI | null;
  ab_variants: unknown[] | null;
  performance_data: CampaignPerformance | null;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  goal: CampaignGoal;
  target_segment: TargetSegment;
  channels: CampaignChannel[];
  budget: {
    total: number;
    daily_cap?: number;
    currency: Currency;
  };
  schedule: {
    start_date: string;
    end_date?: string;
    timezone?: string;
  };
  kpi_targets?: CampaignKPI;
}

// Labels for UI
export const GOAL_LABELS: Record<CampaignGoal, { en: string; ru: string }> = {
  awareness: { en: 'Awareness', ru: 'Узнаваемость' },
  acquisition: { en: 'Acquisition', ru: 'Привлечение' },
  activation: { en: 'Activation', ru: 'Активация' },
  retention: { en: 'Retention', ru: 'Удержание' },
  referral: { en: 'Referral', ru: 'Реферальная' },
};

export const STATUS_LABELS: Record<CampaignStatus, { en: string; ru: string }> = {
  draft: { en: 'Draft', ru: 'Черновик' },
  scheduled: { en: 'Scheduled', ru: 'Запланировано' },
  active: { en: 'Active', ru: 'Активна' },
  paused: { en: 'Paused', ru: 'На паузе' },
  completed: { en: 'Completed', ru: 'Завершена' },
};

export const SEGMENT_LABELS: Record<TargetSegment, { en: string; ru: string }> = {
  b2c_users: { en: 'B2C Users', ru: 'B2C Пользователи' },
  providers: { en: 'Providers', ru: 'Провайдеры' },
  owners: { en: 'Property Owners', ru: 'Владельцы' },
  partners: { en: 'Partners', ru: 'Партнёры' },
};

export const CHANNEL_LABELS: Record<CampaignChannel, { en: string; ru: string; icon?: string }> = {
  google: { en: 'Google Ads', ru: 'Google Ads' },
  meta: { en: 'Meta (FB/IG)', ru: 'Meta (FB/IG)' },
  tiktok: { en: 'TikTok', ru: 'TikTok' },
  email: { en: 'Email', ru: 'Email' },
  whatsapp: { en: 'WhatsApp', ru: 'WhatsApp' },
  telegram: { en: 'Telegram', ru: 'Telegram' },
  push: { en: 'Push Notifications', ru: 'Push-уведомления' },
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  THB: '฿',
  RUB: '₽',
};
