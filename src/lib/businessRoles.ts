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
  | 'invites'
  | 'active_stays'
  | 'properties'
  | 'operations'
  | 'crm_tasks'
  | 'upcoming_payments'
  | 'active_deals'
  | 'menu';

export const BUSINESS_ROLES: Record<BusinessRole, BusinessRoleConfig> = {
  property_manager: {
    id: 'property_manager',
    labelEn: 'Property Manager',
    labelRu: 'Управляющий',
    icon: '🏠',
    widgets: [
      'kpi',
      'invites',
      'active_stays',
      'properties',
      'operations',
      'upcoming_payments',
      'crm_tasks',
      'active_deals',
      'menu',
    ],
  },
  sales_agent: {
    id: 'sales_agent',
    labelEn: 'Sales Agent',
    labelRu: 'Агент по продажам',
    icon: '💼',
    widgets: [
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
      'kpi',
      'operations',
      'upcoming_payments',
      'crm_tasks',
      'menu',
    ],
  },
  general: {
    id: 'general',
    labelEn: 'All-in-One',
    labelRu: 'Все модули',
    icon: '⚡',
    widgets: [
      'kpi',
      'invites',
      'active_stays',
      'properties',
      'operations',
      'crm_tasks',
      'upcoming_payments',
      'active_deals',
      'menu',
    ],
  },
};

export const BUSINESS_ROLE_LIST = Object.values(BUSINESS_ROLES);
