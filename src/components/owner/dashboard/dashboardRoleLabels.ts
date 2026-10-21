import type { Language } from '@/i18n';
import type { BusinessRoleConfig, MCCompanyRole } from '@/lib/businessRoles';
import { pickLang } from '@/lib/i18n/pickLang';

const BUSINESS_ROLE_THAI: Record<BusinessRoleConfig['id'], string> = {
  property_manager: 'การบริหารที่พัก (บริษัทจัดการ)',
  sales_agent: 'การบริหารการขาย',
  service_provider: 'ผู้ให้บริการ',
  general: 'ทุกโมดูล',
};

const MC_ROLE_THAI: Record<MCCompanyRole, string> = {
  director: 'ผู้อำนวยการ',
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  accountant: 'นักบัญชี',
  staff: 'พนักงาน',
  member: 'สมาชิก',
};

/** Labels only: never maps unfamiliar membership roles into an authority claim. */
export function dashboardBusinessRoleLabel(language: Language, role: BusinessRoleConfig): string {
  return pickLang(language, { en: role.labelEn, ru: role.labelRu, th: BUSINESS_ROLE_THAI[role.id] });
}

export function dashboardCompanyRoleThai(role: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(MC_ROLE_THAI, role) ? MC_ROLE_THAI[role as MCCompanyRole] : undefined;
}
