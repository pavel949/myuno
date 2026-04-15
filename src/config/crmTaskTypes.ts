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
  CalendarClock,
  Bell,
  Presentation,
  Globe,
  PenTool,
  ClipboardList,
  Bookmark,
  ShieldCheck,
  Home,
  PhoneForwarded,
  Key,
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
  check_in: {
    icon: CalendarCheck,
    color: 'text-success',
    bgColor: 'bg-success/10',
    labelEn: 'Check-in / arrival',
    labelRu: 'Заезд / прибытие',
  },
  key_handover: {
    icon: Key,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    labelEn: 'Key handover',
    labelRu: 'Передача ключей',
  },
  installment_reminder: {
    icon: CalendarClock,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary',
    labelEn: 'Installment / payment schedule',
    labelRu: 'Взнос / график платежей',
  },
  reservation: {
    icon: Bookmark,
    color: 'text-accent-foreground',
    bgColor: 'bg-accent',
    labelEn: 'Reservation / booking fee',
    labelRu: 'Бронь / booking fee',
  },
  kyc_docs: {
    icon: ShieldCheck,
    color: 'text-info',
    bgColor: 'bg-info/10',
    labelEn: 'KYC / documents',
    labelRu: 'KYC / документы',
  },
  onboarding_visit: {
    icon: Home,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    labelEn: 'Onboarding / property visit',
    labelRu: 'Онбординг / осмотр объекта',
  },
  renewal_call: {
    icon: PhoneForwarded,
    color: 'text-success',
    bgColor: 'bg-success/10',
    labelEn: 'Renewal / upsell call',
    labelRu: 'Продление / upsell',
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
  'kyc_docs',
  'reservation',
  'installment_reminder',
  'check_in',
  'key_handover',
  'onboarding_visit',
  'renewal_call',
  'deadline',
  'research',
  'other',
] as const;

export function getCrmTaskConfig(taskType: string): CrmTaskTypeConfig {
  return CRM_TASK_TYPES[taskType] ?? CRM_TASK_TYPES.other;
}
