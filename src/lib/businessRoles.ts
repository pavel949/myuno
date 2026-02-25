/**
 * Business Role Configuration
 * 
 * Defines which dashboard widgets are shown for each business role.
 * This is the SINGLE SOURCE OF TRUTH for role-based dashboard composition.
 */

export type BusinessRole = 'property_manager' | 'sales_agent' | 'service_provider' | 'general';

export interface BusinessRoleConfig {
  id: BusinessRole;
  labelEn: string;
  labelRu: string;
  icon: string;
  /** Widget keys in display order */
  widgets: DashboardWidgetKey[];
  /** Menu items to show (by path) — empty = show all */
  menuFilter?: string[];
}

export type DashboardWidgetKey =
  | 'kpi'
  | 'your_day'
  | 'today_briefing'
  | 'today_actions'
  | 'channel_sync'
  | 'revenue_insights'
  | 'invites'
  | 'active_stays'
  | 'properties'
  | 'operations'
  | 'crm_tasks'
  | 'upcoming_payments'
  | 'active_deals'
  | 'unified_inbox'
  | 'maintenance_health'
  | 'myuno_services'
  | 'menu';

export const BUSINESS_ROLES: Record<BusinessRole, BusinessRoleConfig> = {
  property_manager: {
    id: 'property_manager',
    labelEn: 'Property Management',
    labelRu: 'Управление недвижимостью',
    icon: '🏠',
    widgets: [
      'your_day',
      'kpi',
      'channel_sync',
      'unified_inbox',
      'active_stays',
      'properties',
      'maintenance_health',
      'myuno_services',
      'revenue_insights',
      'upcoming_payments',
      'active_deals',
      'crm_tasks',
      'operations',
      'menu',
    ],
  },
  sales_agent: {
    id: 'sales_agent',
    labelEn: 'Sales Agent',
    labelRu: 'Агент по продажам',
    icon: '💼',
    widgets: [
      'your_day',
      'kpi',
      'active_deals',
      'crm_tasks',
      'properties',
      'operations',
      'menu',
    ],
  },
  service_provider: {
    id: 'service_provider',
    labelEn: 'Service Provider',
    labelRu: 'Поставщик услуг',
    icon: '🔧',
    widgets: [
      'your_day',
      'kpi',
      'operations',
      'upcoming_payments',
      'crm_tasks',
      'menu',
    ],
  },
  general: {
    id: 'general',
    labelEn: 'All Modules',
    labelRu: 'Все модули',
    icon: '⚡',
    widgets: [
      'your_day',
      'kpi',
      'channel_sync',
      'unified_inbox',
      'active_stays',
      'properties',
      'maintenance_health',
      'myuno_services',
      'revenue_insights',
      'upcoming_payments',
      'active_deals',
      'crm_tasks',
      'operations',
      'menu',
    ],
  },
};

export const BUSINESS_ROLE_LIST = Object.values(BUSINESS_ROLES);
