import { VERTICALS } from '@/lib/verticals';
import { type VerticalGroupItem } from '@/lib/verticalGroups';

/** Gradient map for vertical icons — single source of truth */
export const VERTICAL_GRADIENTS: Record<string, string> = {
  property: 'from-emerald-500 to-green-400',
  yacht: 'from-blue-500 to-cyan-400',
  vehicle: 'from-indigo-500 to-violet-400',
  experience: 'from-purple-500 to-indigo-400',
  cleaning: 'from-amber-500 to-yellow-400',
  babysitter: 'from-pink-400 to-rose-300',
  beauty: 'from-pink-500 to-purple-400',
  restaurant: 'from-rose-500 to-pink-400',
  medical: 'from-teal-500 to-emerald-400',
  legal: 'from-slate-500 to-gray-400',
  education: 'from-blue-400 to-indigo-300',
  fitness: 'from-orange-500 to-red-400',
  event: 'from-purple-500 to-indigo-400',
  water_activity: 'from-cyan-500 to-blue-400',
  pet_service: 'from-orange-500 to-amber-400',
  flower: 'from-pink-400 to-rose-300',
  insurance: 'from-slate-500 to-blue-400',
  transfer: 'from-indigo-500 to-blue-400',
  pharmacy: 'from-green-500 to-emerald-400',
  bank: 'from-blue-600 to-indigo-500',
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
