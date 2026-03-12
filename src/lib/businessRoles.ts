/**
 * Business Role Configuration
 * 
 * Defines which dashboard widgets are shown for each business role.
 * This is the SINGLE SOURCE OF TRUTH for role-based dashboard composition.
 * 
 * MC company roles (director, manager, accountant, staff) are automatically
 * mapped to business roles for dashboard composition.
 */

export type BusinessRole = 'property_manager' | 'sales_agent' | 'service_provider' | 'general';

/** MC company role from management_company_members table */
export type MCCompanyRole = 'director' | 'admin' | 'manager' | 'accountant' | 'staff' | 'member';

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
  | 'morning_briefing'
  | 'cleaning_dashboard'
  | 'channel_sync'
  | 'revenue_insights'
  | 'invites'
  | 'active_stays'
  | 'properties'
  | 'property_status'
  | 'portfolio_health'
  | 'property_priority'
  | 'operations'
  | 'crm_tasks'
  | 'upcoming_payments'
  | 'active_deals'
  | 'unified_inbox'
  | 'maintenance_health'
  | 'myuno_services'
  | 'menu';

export const BUSINESS_ROLES: Record<BusinessRole, BusinessRoleConfig> = {
  /** Property Management (MC) — for management company staff, not property owners */
  property_manager: {
    id: 'property_manager',
    labelEn: 'Property Management (MC)',
    labelRu: 'Управление объектами (УК)',
    icon: '🏠',
    widgets: [
      'today_actions',
      'property_priority',
      'kpi',
      'your_day',
      'active_stays',
      'portfolio_health',
      'channel_sync',
      'maintenance_health',
      'crm_tasks',
      'active_deals',
      'upcoming_payments',
      'revenue_insights',
      'operations',
    ],
  },
  sales_agent: {
    id: 'sales_agent',
    labelEn: 'Sales Management',
    labelRu: 'Управление продажами',
    icon: '💼',
    widgets: [
      'today_actions',
      'kpi',
      'your_day',
      'active_deals',
      'crm_tasks',
      'upcoming_payments',
      'operations',
    ],
  },
  service_provider: {
    id: 'service_provider',
    labelEn: 'Service Provider',
    labelRu: 'Поставщик услуг',
    icon: '🔧',
    widgets: [
      'today_actions',
      'property_priority',
      'your_day',
      'kpi',
      'channel_sync',
      'upcoming_payments',
      'maintenance_health',
      'operations',
    ],
  },
  general: {
    id: 'general',
    labelEn: 'All Modules',
    labelRu: 'Все модули',
    icon: '⚡',
    widgets: [
      'today_actions',
      'property_priority',
      'kpi',
      'your_day',
      'portfolio_health',
      'channel_sync',
      'active_stays',
      'maintenance_health',
      'revenue_insights',
      'upcoming_payments',
      'active_deals',
      'crm_tasks',
      'operations',
    ],
  },
};

export const BUSINESS_ROLE_LIST = Object.values(BUSINESS_ROLES);

/**
 * Maps MC company role to default business role for dashboard composition.
 * Directors/admins see everything; managers see operations; accountants see finance.
 */
export const MC_ROLE_TO_BUSINESS_ROLE: Record<MCCompanyRole, BusinessRole> = {
  director: 'general',       // Full access to all modules
  admin: 'general',          // Full access
  manager: 'property_manager', // Operations-focused
  accountant: 'service_provider', // Finance-focused (payments, tasks)
  staff: 'property_manager',  // Operations-focused
  member: 'general',          // Default view
};

/** Human-readable labels for MC company roles */
export const MC_ROLE_LABELS: Record<MCCompanyRole, { en: string; ru: string; icon: string }> = {
  director: { en: 'Director', ru: 'Директор', icon: '👔' },
  admin: { en: 'Administrator', ru: 'Администратор', icon: '🛡️' },
  manager: { en: 'Manager', ru: 'Менеджер', icon: '📋' },
  accountant: { en: 'Accountant', ru: 'Бухгалтер', icon: '📊' },
  staff: { en: 'Staff', ru: 'Сотрудник', icon: '👤' },
  member: { en: 'Member', ru: 'Участник', icon: '👥' },
};

/**
 * Get business role config based on MC company role.
 * Falls back to 'general' if role is unknown.
 */
export function getBusinessRoleForMCRole(mcRole: string | undefined): BusinessRole {
  if (!mcRole) return 'property_manager';
  return MC_ROLE_TO_BUSINESS_ROLE[mcRole as MCCompanyRole] || 'property_manager';
}
