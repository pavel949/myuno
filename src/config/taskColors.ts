/**
 * @module TaskColors
 * @description Centralized task type styling configuration
 * 
 * Uses semantic CSS tokens from the design system where available.
 * Custom colors use HSL variables that should be defined in index.css.
 */

import { LogIn, LogOut, Sparkles, Wrench, Search, Gauge, Clock, Camera, ClipboardList, type LucideIcon } from 'lucide-react';

export interface TaskTypeConfig {
  icon: LucideIcon;
  /** Text color class - uses semantic tokens */
  color: string;
  /** Background color class - uses semantic tokens with opacity */
  bgColor: string;
  /** English label */
  label: string;
  /** Russian label */
  labelRu: string;
}

/**
 * Task type configuration mapping
 * 
 * Colors use semantic tokens:
 * - success: check-in (green)
 * - warning: check-out (amber)
 * - info: cleaning (blue)
 * - accent: maintenance (orange)
 * - secondary: inspection (purple)
 * - primary: meter reading (brand color)
 */
export const TASK_TYPE_CONFIG: Record<string, TaskTypeConfig> = {
  check_in: { 
    icon: LogIn, 
    color: 'text-success', 
    bgColor: 'bg-success/10', 
    label: 'Check-in', 
    labelRu: 'Заезд' 
  },
  check_out: { 
    icon: LogOut, 
    color: 'text-warning', 
    bgColor: 'bg-warning/10', 
    label: 'Check-out', 
    labelRu: 'Выезд' 
  },
  cleaning: { 
    icon: Sparkles, 
    color: 'text-info', 
    bgColor: 'bg-info/10', 
    label: 'Cleaning', 
    labelRu: 'Уборка' 
  },
  maintenance: { 
    icon: Wrench, 
    color: 'text-accent-foreground', 
    bgColor: 'bg-accent', 
    label: 'Maintenance', 
    labelRu: 'Ремонт' 
  },
  inspection: { 
    icon: Search, 
    color: 'text-secondary-foreground', 
    bgColor: 'bg-secondary', 
    label: 'Inspection', 
    labelRu: 'Осмотр' 
  },
  meter_reading: { 
    icon: Gauge, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10', 
    label: 'Meter Reading', 
    labelRu: 'Счётчики' 
  },
} as const;

/**
 * Alternative icons for specific contexts
 */
export const TASK_TYPE_ALT_ICONS: Partial<Record<string, LucideIcon>> = {
  inspection: Camera,
  meter_reading: Clock,
};

/**
 * Get task config with fallback for unknown types
 */
export function getTaskConfig(taskType: string): TaskTypeConfig {
  return TASK_TYPE_CONFIG[taskType] ?? {
    icon: ClipboardList,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: taskType,
    labelRu: taskType,
  };
}

/**
 * Calendar dot colors for event types
 */
export const CALENDAR_DOT_COLORS = {
  blocked: 'bg-destructive',
  check_in: 'bg-success',
  check_out: 'bg-warning',
  cleaning: 'bg-info',
  maintenance: 'bg-accent',
  other_task: 'bg-secondary',
} as const;

/**
 * Activity stream icon configuration
 */
export const ACTIVITY_ICONS = {
  check_in: { icon: LogIn, color: 'text-success', bg: 'bg-success/10' },
  check_out: { icon: LogOut, color: 'text-warning', bg: 'bg-warning/10' },
  cleaning: { icon: Sparkles, color: 'text-info', bg: 'bg-info/10' },
  maintenance: { icon: Wrench, color: 'text-accent-foreground', bg: 'bg-accent' },
} as const;
