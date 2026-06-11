import { template as adminOnboardingTemplate } from './admin-onboarding.tsx'
import { template as transferOperatorNewTemplate } from './transfer-operator-new.tsx'
import { template as transferCustomerReceivedTemplate } from './transfer-customer-received.tsx'
import { template as transferCustomerConfirmedTemplate } from './transfer-customer-confirmed.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: (props: any) => unknown
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  // deno-lint-ignore no-explicit-any
  previewData?: any
  to?: string | string[]
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'admin-onboarding': adminOnboardingTemplate,
  'transfer-operator-new': transferOperatorNewTemplate,
  'transfer-customer-received': transferCustomerReceivedTemplate,
  'transfer-customer-confirmed': transferCustomerConfirmedTemplate,
}
