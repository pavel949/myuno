import { VERTICALS } from '@/lib/verticals';
import { type VerticalGroupItem } from '@/lib/verticalGroups';

export interface ResolvedItem {
  id: string;
  icon: string;
  label: string;
  route: string;
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
    };
  }
  return {
    id: item.route || '',
    icon: item.icon || '📦',
    label: language === 'ru' ? (item.labelRu || '') : (item.labelEn || ''),
    route: item.route || '/',
  };
}
