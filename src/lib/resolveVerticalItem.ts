import { VERTICALS } from '@/lib/verticals';
import { type VerticalGroupItem } from '@/lib/verticalGroups';

/** Gradient map for vertical icons — single source of truth */
export const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-success to-success',
  yacht: 'from-primary to-primary',
  vehicle: 'from-primary to-primary',
  experience: 'from-primary to-primary',
  cleaning: 'from-accent to-accent',
  babysitter: 'from-accent to-accent',
  beauty: 'from-accent to-primary',
  restaurant: 'from-accent to-accent',
  medical: 'from-success to-success',
  legal: 'from-slate-500 to-gray-400',
  education: 'from-primary to-primary',
  fitness: 'from-accent to-red-400',
  event: 'from-primary to-primary',
  water_activity: 'from-primary to-primary',
  pet_service: 'from-accent to-accent',
  flower: 'from-accent to-accent',
  insurance: 'from-slate-500 to-primary',
  transfer: 'from-primary to-primary',
  pharmacy: 'from-success to-success',
  bank: 'from-primary to-primary',
};

export interface ResolvedItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  gradient: string;
}

export function resolveVerticalItem(item: VerticalGroupItem, language: string): ResolvedItem | null {
  if (item.verticalId) {
    const v = Object.values(VERTICALS).find(v => v.id === item.verticalId);
    if (!v) return null;
    return {
      id: v.id,
      icon: v.icon,
      label: language === 'ru' ? v.labelRu : v.labelEn,
      route: `/${v.plural}`,
      gradient: VERTICAL_GRADIENTS[v.id] || 'from-primary to-accent',
    };
  }
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
    gradient: 'from-primary to-accent',
  };
}
