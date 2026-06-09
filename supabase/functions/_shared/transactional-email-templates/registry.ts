import { template as adminOnboardingTemplate } from './admin-onboarding.tsx'

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
}
