/**
 * @module CrmTaskTypes
 * @description CRM task type configuration — world-class task taxonomy
 * inspired by HubSpot, Salesforce, Pipedrive
 */

import {
  Phone,
  Mail,
  MessageSquare,
  Users,
  Eye,
  FileText,
  Send,
  CreditCard,
  Handshake,
  UserPlus,
  CalendarCheck,
  Bell,
  Presentation,
  Globe,
  PenTool,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export interface CrmTaskTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  labelEn: string;
  labelRu: string;
}

export const CRM_TASK_TYPES: Record<string, CrmTaskTypeConfig> = {
  call: {
    icon: Phone,
    color: 'text-success',
    bgColor: 'bg-success/10',
    labelEn: 'Call',
    labelRu: 'Звонок',
  },
  email: {
    icon: Mail,
    color: 'text-info',
    bgColor: 'bg-info/10',
    labelEn: 'Email',
    labelRu: 'Письмо',
  },
  message: {
    icon: MessageSquare,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    labelEn: 'Message',
    labelRu: 'Сообщение',
  },
  meeting: {
    icon: Users,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    labelEn: 'Meeting',
    labelRu: 'Встреча',
  },
  viewing: {
    icon: Eye,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary',
    labelEn: 'Viewing',
    labelRu: 'Показ',
  },
  presentation: {
    icon: Presentation,
    color: 'text-accent-foreground',
    bgColor: 'bg-accent',
    labelEn: 'Presentation',
    labelRu: 'Презентация',
  },
  document: {
    icon: FileText,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    labelEn: 'Document',
    labelRu: 'Документ',
  },
  contract: {
    icon: PenTool,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    labelEn: 'Contract',
    labelRu: 'Договор',
  },
  payment: {
    icon: CreditCard,
    color: 'text-success',
    bgColor: 'bg-success/10',
    labelEn: 'Payment',
    labelRu: 'Оплата',
  },
  follow_up: {
    icon: Bell,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    labelEn: 'Follow-up',
    labelRu: 'Напоминание',
  },
  onboarding: {
    icon: UserPlus,
    color: 'text-info',
    bgColor: 'bg-info/10',
    labelEn: 'Onboarding',
    labelRu: 'Онбординг',
  },
  negotiation: {
    icon: Handshake,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    labelEn: 'Negotiation',
    labelRu: 'Переговоры',
  },
  send: {
    icon: Send,
    color: 'text-info',
    bgColor: 'bg-info/10',
    labelEn: 'Send Materials',
    labelRu: 'Отправить',
  },
  deadline: {
    icon: CalendarCheck,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    labelEn: 'Deadline',
    labelRu: 'Дедлайн',
  },
  research: {
    icon: Globe,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary',
    labelEn: 'Research',
    labelRu: 'Исследование',
  },
  other: {
    icon: ClipboardList,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    labelEn: 'Other',
    labelRu: 'Прочее',
  },
} as const;

/** Ordered list for UI selectors — most common first */
export const CRM_TASK_TYPE_ORDER = [
  'call',
  'email',
  'message',
  'meeting',
  'viewing',
  'follow_up',
  'document',
  'contract',
  'payment',
  'send',
  'presentation',
  'negotiation',
  'onboarding',
  'deadline',
  'research',
  'other',
] as const;

export function getCrmTaskConfig(taskType: string): CrmTaskTypeConfig {
  return CRM_TASK_TYPES[taskType] ?? CRM_TASK_TYPES.other;
}
